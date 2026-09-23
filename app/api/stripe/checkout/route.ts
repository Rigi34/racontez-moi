import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const origin = req.headers.get("origin") ?? "https://racontez-moi.com";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    // Trouvé le 20/09/2026 (test E2E réel, Tranche B) : sans ce paramètre,
    // un paiement carte en une fois (hors Klarna) ne crée pas de Customer
    // Stripe, laissant session.customer à null — stripe_customer_id étant
    // NOT NULL en base (migration 0004), l'activation de l'abonnement
    // échouait silencieusement côté webhook. "always" garantit un Customer
    // systématique pour ce mode "payment" (cf. types Stripe SDK).
    customer_creation: "always",
    line_items: [{ price: process.env.STRIPE_PRICE_ID_PARCOURS!, quantity: 1 }],
    client_reference_id: user.id,
    // Un compte encore anonyme (essai gratuit non converti, cf. Seance.tsx
    // modeInvite) n'a pas d'email — Stripe le demandera lui-même pendant le
    // paiement plutôt que de recevoir une valeur vide.
    ...(user.email ? { customer_email: user.email } : {}),
    allow_promotion_codes: true,
    // Garantie (décision de Régis, 11/09/2026) — emplacement 1/5, le vrai
    // pic d'anxiété d'achat, plus que n'importe quelle page en amont.
    custom_text: {
      submit: {
        message:
          "Si ce n'est pas ce dont vous aviez besoin, vous êtes remboursé intégralement, sans justification, jusqu'à ce que votre livre parte à l'impression.",
      },
    },
    success_url: `${origin}/tableau-de-bord?parcours=confirme`,
    cancel_url: `${origin}/parcours?parcours=annule`,
  });

  return NextResponse.json({ url: session.url });
}
