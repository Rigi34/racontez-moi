import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const origin = req.headers.get("origin") ?? "https://racontez-moi.com";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID_PARCOURS!, quantity: 1 }],
    client_reference_id: user.id,
    customer_email: user.email,
    allow_promotion_codes: true,
    success_url: `${origin}/tableau-de-bord?parcours=confirme`,
    cancel_url: `${origin}/parcours?parcours=annule`,
  });

  return NextResponse.json({ url: session.url });
}
