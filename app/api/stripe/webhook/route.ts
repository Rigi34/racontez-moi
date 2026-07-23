import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";

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
    // Paiement unique (décision révisée le 22 juillet 2026) : un seul
    // événement suffit, il n'y a plus de cycle d'abonnement à suivre. Le
    // metadata `type` distingue le paiement du livre (23 juillet 2026,
    // séparé du forfait création) de l'achat du forfait lui-même — jamais
    // le même événement pour les deux.
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (!userId || session.payment_status !== "paid") break;

      if (session.metadata?.type === "livre") {
        await supabase
          .from("abonnements")
          .update({ livre_paye: true, updated_at: new Date().toISOString() })
          .eq("user_id", userId);
        break;
      }

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
