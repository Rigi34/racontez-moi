import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

// Achat-cadeau — aucun compte requis côté acheteur (il n'est pas forcément
// le futur narrateur) : pas de client_reference_id, les informations de
// personnalisation voyagent en metadata jusqu'au webhook, qui génère le
// code d'activation (cf. codes_cadeau, migration 0015).
export async function POST(req: NextRequest) {
  const { destinataire_prenom, offrant_nom, message } = await req.json();

  if (!destinataire_prenom?.trim() || !offrant_nom?.trim()) {
    return NextResponse.json({ error: "Le prénom du destinataire et votre nom sont requis." }, { status: 400 });
  }

  const origin = req.headers.get("origin") ?? "https://racontez-moi.com";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: process.env.STRIPE_PRICE_ID_PARCOURS!, quantity: 1 }],
    metadata: {
      type: "cadeau",
      destinataire_prenom: destinataire_prenom.trim().slice(0, 100),
      offrant_nom: offrant_nom.trim().slice(0, 100),
      message: (message ?? "").trim().slice(0, 500),
    },
    allow_promotion_codes: true,
    success_url: `${origin}/offrir/merci?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/offrir?cadeau=annule`,
  });

  return NextResponse.json({ url: session.url });
}
