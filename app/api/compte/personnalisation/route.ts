import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { lirePersonnalisationLivre, enregistrerPersonnalisationLivre } from "@/lib/profil-narrateur";
import { PALETTE_COUVERTURE } from "@/lib/couverture";

const TITRE_MAX = 60;
const SOUS_TITRE_MAX = 80;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const personnalisation = await lirePersonnalisationLivre(supabase, user.id);
  return NextResponse.json({ personnalisation });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: { titre?: string; sousTitre?: string; couleurCle?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { titre, sousTitre, couleurCle } = body;
  if (!titre?.trim() || !sousTitre?.trim() || !couleurCle) {
    return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
  }
  if (titre.trim().length > TITRE_MAX) {
    return NextResponse.json({ error: `Le titre est limité à ${TITRE_MAX} caractères.` }, { status: 400 });
  }
  if (sousTitre.trim().length > SOUS_TITRE_MAX) {
    return NextResponse.json({ error: `Le sous-titre est limité à ${SOUS_TITRE_MAX} caractères.` }, { status: 400 });
  }
  if (!PALETTE_COUVERTURE.some((c) => c.cle === couleurCle)) {
    return NextResponse.json({ error: "Couleur de couverture invalide." }, { status: 400 });
  }

  await enregistrerPersonnalisationLivre(supabase, user.id, {
    titre: titre.trim(),
    sousTitre: sousTitre.trim(),
    couleurCle,
  });

  return NextResponse.json({ ok: true });
}
