import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { creerCodeCadeau } from "@/lib/codes-cadeau";

// Client service role : le webhook n'a pas de session utilisateur, il doit
// contourner RLS pour écrire dans `abonnements`.
const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Signature webhook Stripe invalide:", err);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  switch (event.type) {
    // Paiement en plusieurs fois via Klarna (décision de Régis, 02/09/2026) :
    // Klarna peut confirmer le paiement de façon asynchrone après la fin du
    // checkout — Stripe recommande alors d'écouter aussi
    // async_payment_succeeded, sinon un paiement confirmé après un court
    // délai ne débloquerait jamais l'accès. Le garde payment_status ci-dessous
    // rend ce cas sûr sans dupliquer la logique.
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("Paiement Klarna refusé (résultat normal, pas une erreur) :", session.id);
      break;
    }

    // Paiement unique (décision révisée le 22 juillet 2026) : un seul
    // événement suffit, il n'y a plus de cycle d'abonnement à suivre. Prix
    // fixe tout compris depuis le 28 juillet 2026 (livre imprimé inclus) —
    // plus de paiement séparé pour le livre à distinguer ici.
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== "paid") break;

      // Achat-cadeau (décision du 28 juillet 2026) : génère un code
      // d'activation plutôt que d'activer un abonnement directement — vérifie
      // d'abord qu'aucun code n'existe déjà pour cette session (Stripe peut
      // renvoyer le même événement plusieurs fois), pour rester idempotent.
      if (session.metadata?.type === "cadeau") {
        const { data: codeExistant } = await supabase
          .from("codes_cadeau")
          .select("id")
          .eq("stripe_session_id", session.id)
          .maybeSingle();
        if (!codeExistant) {
          await creerCodeCadeau(supabase, {
            stripe_session_id: session.id,
            destinataire_prenom: session.metadata.destinataire_prenom ?? "",
            offrant_nom: session.metadata.offrant_nom ?? "",
            message: session.metadata.message || null,
          });
        }
        break;
      }

      const userId = session.client_reference_id;
      if (!userId) break;

      // Trouvé le 20/09/2026 lors du test E2E réel (Tranche B) : un paiement
      // par carte en une fois (hors Klarna) ne fait pas nécessairement créer
      // de Customer Stripe pour une session en mode "payment" — session.customer
      // peut être null. stripe_customer_id étant NOT NULL en base, l'upsert
      // échouait alors silencieusement (retour non vérifié) : le paiement
      // était confirmé côté Stripe (200 renvoyé) mais l'abonnement jamais
      // activé, sans aucune trace. Ici on refuse explicitement ce cas et on
      // renvoie 5xx pour que Stripe retente et que l'échec soit visible dans
      // son dashboard, plutôt que de le masquer — la stratégie de fond
      // (forcer la création d'un Customer à la création de la session, ou
      // un autre mécanisme) reste à décider séparément, non traitée ici.
      if (!session.customer) {
        console.error("Webhook Stripe: session.customer absent, abonnement non activé.", {
          event_type: event.type,
          session_id: session.id,
          user_id: userId,
        });
        return NextResponse.json({ error: "session.customer manquant." }, { status: 500 });
      }

      const { error: erreurUpsertAbonnement } = await supabase.from("abonnements").upsert(
        {
          user_id: userId,
          stripe_customer_id: session.customer as string,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (erreurUpsertAbonnement) {
        console.error("Webhook Stripe: échec de l'activation de l'abonnement.", {
          event_type: event.type,
          session_id: session.id,
          user_id: userId,
          error_code: erreurUpsertAbonnement.code,
          error_message: erreurUpsertAbonnement.message,
        });
        return NextResponse.json({ error: "Échec de l'activation de l'abonnement." }, { status: 500 });
      }
      break;
    }

    // Garantie "remboursement intégral, sans justification, tant que la
    // commande n'est pas passée" (décision de Régis, 11/09/2026) — traitée
    // manuellement par Régis dans le Dashboard Stripe (pas de flux
    // applicatif en libre-service). Ce webhook réagit au remboursement une
    // fois qu'il a eu lieu : révoque l'accès en repassant abonnements.status
    // à une valeur différente de "active", ce qui suffit à couper l'accès
    // partout (réutilise tels quels tous les contrôles déjà en place :
    // /seance, /mon-livre, /api/manuscrit/*, /api/commande/livre). Ne
    // révoque que sur un remboursement intégral (charge.refunded === true) —
    // un remboursement partiel éventuel ne doit pas couper l'accès.
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      if (!charge.refunded) break;
      const customerId = charge.customer as string | null;
      if (!customerId) break;

      await supabase
        .from("abonnements")
        .update({ status: "rembourse", updated_at: new Date().toISOString() })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
