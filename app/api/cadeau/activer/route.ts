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

  // Un compte qui a déjà le Parcours ne consomme pas un code : l'upsert
  // ci-dessous écraserait son stripe_customer_id, et un remboursement de son
  // propre achat ne retrouverait plus son abonnement (audit de clôture du
  // 27/10/2026, constat I-2). Le code reste utilisable par quelqu'un d'autre.
  const { data: abonnementExistant, error: erreurLecture } = await supabaseService
    .from("abonnements")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (erreurLecture) {
    return NextResponse.json({ error: "Une erreur est survenue. Réessayez." }, { status: 500 });
  }
  if (abonnementExistant?.status === "active") {
    return NextResponse.json({ error: "Votre compte a déjà accès au Parcours : ce code peut être offert à quelqu'un d'autre." }, { status: 409 });
  }

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
    if (ligneExistante.statut === "rembourse") {
      return NextResponse.json({ error: "Ce code n'est plus valable : l'achat a été remboursé." }, { status: 409 });
    }
    return NextResponse.json({ error: "Ce code a déjà été activé." }, { status: 409 });
  }

  const { error: erreurAbonnement } = await supabaseService.from("abonnements").upsert(
    {
      user_id: user.id,
      stripe_customer_id: `cadeau:${codeNormalise}`,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  // Sans cette vérification, un échec d'écriture répondait 200 avec un code
  // déjà consommé et aucun accès ouvert : on remet le code en "paye" pour
  // qu'une nouvelle tentative reste possible.
  if (erreurAbonnement) {
    await supabaseService
      .from("codes_cadeau")
      .update({ statut: "paye", user_id_active: null, activated_at: null })
      .eq("id", ligneActivee.id);
    return NextResponse.json({ error: "Une erreur est survenue. Réessayez." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
