import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { stripe, NOMBRE_MENSUALITES_PARCOURS } from "@/lib/stripe";

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
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (!userId) break;

      await supabase.from("abonnements").upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        status: "active",
        updated_at: new Date().toISOString(),
      });
      break;
    }

    case "customer.subscription.created": {
      // Plafonne "Le Parcours" à 12 mensualités — jamais un abonnement sans
      // fin (décision produit du 16 juillet 2026).
      const subscription = event.data.object as Stripe.Subscription;
      if (!subscription.cancel_at) {
        const dansDouzeMois = subscription.start_date + NOMBRE_MENSUALITES_PARCOURS * 30 * 24 * 60 * 60;
        await stripe.subscriptions.update(subscription.id, { cancel_at: dansDouzeMois });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("abonnements")
        .update({ status: subscription.status, updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
