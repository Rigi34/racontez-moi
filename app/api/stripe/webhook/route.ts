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

      await supabase.from("abonnements").upsert(
        {
          user_id: userId,
          stripe_customer_id: session.customer as string,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      break;
    }
  }

  return NextResponse.json({ received: true });
}
