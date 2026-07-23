import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { stripe } from "@/lib/stripe";

// Paiement séparé du livre imprimé (~50€, décision du 23 juillet 2026) —
// distinct du forfait création (129€, app/api/stripe/checkout). Le
// metadata `type: "livre"` permet au webhook de distinguer ce paiement
// d'un achat de forfait, sans dépendre du prix (qui pourrait changer).
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("status, livre_paye")
    .eq("user_id", user.id)
    .maybeSingle();

  if (abonnement?.status !== "active") {
    return NextResponse.json({ error: "Le Parcours n'est pas actif sur ce compte." }, { status: 403 });
  }
  if (abonnement.livre_paye) {
    return NextResponse.json({ error: "Le livre a déjà été payé." }, { status: 409 });
  }

  const origin = req.headers.get("origin") ?? "https://racontez-moi.com";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: process.env.STRIPE_PRICE_ID_LIVRE!, quantity: 1 }],
    client_reference_id: user.id,
    customer_email: user.email,
    allow_promotion_codes: true,
    metadata: { type: "livre" },
    success_url: `${origin}/mon-livre?livre=confirme`,
    cancel_url: `${origin}/mon-livre?livre=annule`,
  });

  return NextResponse.json({ url: session.url });
}
