import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  BUCKET_VOIX,
  TAILLE_MAX_OCTETS,
  VERSION_CONSENTEMENT_VOIX,
  voixChoisieActive,
  extensionAudio,
  genererJeton,
} from "@/lib/voix";

// Extraits de voix du narrateur (chantier VOIX-CHOISIE). Interrupteur coupé :
// la route n'existe pas (404), quoi qu'envoie le client.

export async function GET(req: NextRequest) {
  if (!voixChoisieActive()) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const fragmentId = req.nextUrl.searchParams.get("fragment_id");
  let query = supabase
    .from("extraits_voix")
    .select("id, fragment_id, chemin_stockage, type_mime, actif, created_at")
    .eq("user_id", user.id);
  if (fragmentId) query = query.eq("fragment_id", fragmentId);
  const { data: extraits } = await query;

  // URL signée courte : écoute dans l'application uniquement.
  const avecUrls = await Promise.all(
    (extraits ?? []).map(async (e) => {
      const { data } = await supabase.storage.from(BUCKET_VOIX).createSignedUrl(e.chemin_stockage, 600);
      return { id: e.id, fragment_id: e.fragment_id, type_mime: e.type_mime, actif: e.actif, url: data?.signedUrl ?? null, created_at: e.created_at };
    })
  );
  return NextResponse.json({ extraits: avecUrls });
}

// Conserve UN extrait pour un fragment, sur choix explicite du narrateur.
// Remplace l'extrait existant du même fragment (au plus un par fragment).
export async function POST(req: NextRequest) {
  if (!voixChoisieActive()) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  // Essai gratuit anonyme : pas de conservation de voix avant que le
  // narrateur ait un vrai compte (et accepté les conditions).
  if (user.is_anonymous) return NextResponse.json({ error: "Créez votre compte pour garder votre voix." }, { status: 403 });

  const form = await req.formData();
  const audio = form.get("audio");
  const fragmentId = form.get("fragment_id");
  const consentement = form.get("consentement");
  if (!(audio instanceof File) || typeof fragmentId !== "string") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  // Consentement explicite exigé côté serveur, pas seulement dans l'interface.
  if (consentement !== VERSION_CONSENTEMENT_VOIX) {
    return NextResponse.json({ error: "Consentement manquant." }, { status: 400 });
  }
  const extension = extensionAudio(audio.type);
  if (!extension) return NextResponse.json({ error: "Format audio non accepté." }, { status: 400 });
  if (audio.size === 0 || audio.size > TAILLE_MAX_OCTETS) {
    return NextResponse.json({ error: "Enregistrement vide ou trop volumineux." }, { status: 400 });
  }

  const { data: fragment } = await supabase.from("fragments").select("id").eq("id", fragmentId).eq("user_id", user.id).maybeSingle();
  if (!fragment) return NextResponse.json({ error: "Fragment introuvable." }, { status: 404 });

  const { data: ancien } = await supabase
    .from("extraits_voix")
    .select("id, chemin_stockage")
    .eq("fragment_id", fragmentId)
    .eq("user_id", user.id)
    .maybeSingle();

  const chemin = `${user.id}/${fragmentId}/${crypto.randomUUID()}.${extension}`;
  const typeMime = audio.type.split(";")[0].trim().toLowerCase();
  const { error: erreurUpload } = await supabase.storage
    .from(BUCKET_VOIX)
    .upload(chemin, Buffer.from(await audio.arrayBuffer()), { contentType: typeMime });
  if (erreurUpload) {
    console.error("Upload voix échoué:", erreurUpload.message);
    return NextResponse.json({ error: "Échec de l'envoi. Réessayez." }, { status: 500 });
  }

  // Le remplacement garde le même jeton : un QR déjà imprimé reste valable.
  const ligne = {
    user_id: user.id,
    fragment_id: fragmentId,
    chemin_stockage: chemin,
    type_mime: typeMime,
    taille_octets: audio.size,
    version_consentement: VERSION_CONSENTEMENT_VOIX,
    consenti_le: new Date().toISOString(),
    actif: true,
  };
  const { data: extrait, error: erreurEcriture } = ancien
    ? await supabase.from("extraits_voix").update(ligne).eq("id", ancien.id).select("id").single()
    : await supabase.from("extraits_voix").insert({ ...ligne, jeton: genererJeton() }).select("id").single();

  if (erreurEcriture || !extrait) {
    await supabase.storage.from(BUCKET_VOIX).remove([chemin]);
    return NextResponse.json({ error: "Échec de l'enregistrement. Réessayez." }, { status: 500 });
  }
  if (ancien) await supabase.storage.from(BUCKET_VOIX).remove([ancien.chemin_stockage]);

  return NextResponse.json({ extrait: { id: extrait.id, fragment_id: fragmentId } });
}
