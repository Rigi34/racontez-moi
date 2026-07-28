import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

// L'activation écrit dans codes_cadeau (aucune policy d'update pour un
// utilisateur authentifié — seule une lecture de sa propre ligne une fois
// activée est permise, cf. migration 0015) et dans abonnements (RLS
// n'autorise qu'une lecture de son propre abonnement, cf. migration 0004) :
// ces deux écritures passent par le service role, comme le fait déjà le
// webhook Stripe pour abonnements. Le client standard sert uniquement à
// authentifier l'utilisateur.
const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { code } = await req.json();
  if (!code?.trim()) return NextResponse.json({ error: "Code manquant." }, { status: 400 });

  const codeNormalise = code.trim().toUpperCase();

  // Verrou applicatif (filtre statut='paye' dans le update) — la contrainte
  // qui compte vraiment contre une double activation concurrente est le
  // check statut in ('paye','active') combiné à ce filtre : si une autre
  // requête a activé le code entre-temps, cette mise à jour ne touche aucune
  // ligne et .select().maybeSingle() renvoie null, détecté ci-dessous.
  const { data: ligneActivee, error: erreurUpdate } = await supabaseService
    .from("codes_cadeau")
    .update({ statut: "active", user_id_active: user.id, activated_at: new Date().toISOString() })
    .eq("code", codeNormalise)
    .eq("statut", "paye")
    .select("id")
    .maybeSingle();

  if (erreurUpdate) {
    return NextResponse.json({ error: "Une erreur est survenue. Réessayez." }, { status: 500 });
  }

  if (!ligneActivee) {
    const { data: ligneExistante } = await supabaseService
      .from("codes_cadeau")
      .select("statut")
      .eq("code", codeNormalise)
      .maybeSingle();

    if (!ligneExistante) return NextResponse.json({ error: "Ce code n'existe pas." }, { status: 404 });
    return NextResponse.json({ error: "Ce code a déjà été activé." }, { status: 409 });
  }

  await supabaseService.from("abonnements").upsert(
    {
      user_id: user.id,
      stripe_customer_id: `cadeau:${codeNormalise}`,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return NextResponse.json({ ok: true });
}
