import { NextRequest, NextResponse } from "next/server";
import { imageSize } from "image-size";
import { createClient } from "@/utils/supabase/server";
import { RESOLUTION_MIN_PX, PHOTOS_MAX_PAR_FRAGMENT, PHOTOS_MAX_TOTAL } from "@/lib/photos";

const TYPES_ACCEPTES = ["image/jpeg", "image/png", "image/webp"];

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const fragmentId = req.nextUrl.searchParams.get("fragment_id");
  let query = supabase.from("photos").select("id, fragment_id, chemin_stockage, created_at").eq("user_id", user.id);
  if (fragmentId) query = query.eq("fragment_id", fragmentId);
  const { data: photos } = await query.order("created_at", { ascending: false });

  // URLs signées à la volée — le bucket est privé (contenu personnel).
  const avecUrls = await Promise.all(
    (photos ?? []).map(async (p) => {
      const { data } = await supabase.storage.from("photos").createSignedUrl(p.chemin_stockage, 3600);
      return { id: p.id, fragment_id: p.fragment_id, url: data?.signedUrl ?? null, created_at: p.created_at };
    })
  );

  return NextResponse.json({ photos: avecUrls });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const form = await req.formData();
  const fichier = form.get("fichier");
  const fragmentId = form.get("fragment_id");
  if (!(fichier instanceof File) || typeof fragmentId !== "string") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (!TYPES_ACCEPTES.includes(fichier.type)) {
    return NextResponse.json({ error: "Format non accepté — utilisez JPEG, PNG ou WebP." }, { status: 400 });
  }

  // Le fragment doit appartenir au narrateur — RLS protège aussi la
  // lecture, mais autant refuser proprement avant toute écriture.
  const { data: fragment } = await supabase.from("fragments").select("id").eq("id", fragmentId).eq("user_id", user.id).maybeSingle();
  if (!fragment) return NextResponse.json({ error: "Fragment introuvable." }, { status: 404 });

  const [{ count: totalPhotos }, { count: photosFragment }] = await Promise.all([
    supabase.from("photos").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("photos").select("id", { count: "exact", head: true }).eq("fragment_id", fragmentId),
  ]);
  if ((totalPhotos ?? 0) >= PHOTOS_MAX_TOTAL) {
    return NextResponse.json({ error: `Limite de ${PHOTOS_MAX_TOTAL} photos atteinte pour ce livre.` }, { status: 400 });
  }
  if ((photosFragment ?? 0) >= PHOTOS_MAX_PAR_FRAGMENT) {
    return NextResponse.json({ error: `Limite de ${PHOTOS_MAX_PAR_FRAGMENT} photos atteinte pour ce fragment.` }, { status: 400 });
  }

  const buffer = Buffer.from(await fichier.arrayBuffer());

  // Résolution vérifiée à l'envoi, pas à l'assemblage final — permet de
  // redemander une photo tout de suite plutôt que de le découvrir à la
  // commande du livre (chapitre 11.4 de l'étude).
  let dimensions: { width?: number; height?: number };
  try {
    dimensions = imageSize(buffer);
  } catch {
    return NextResponse.json({ error: "Image illisible — réessayez avec un autre fichier." }, { status: 400 });
  }
  const { width, height } = dimensions;
  if (!width || !height) {
    return NextResponse.json({ error: "Impossible de lire les dimensions de l'image." }, { status: 400 });
  }
  if (Math.min(width, height) < RESOLUTION_MIN_PX) {
    return NextResponse.json(
      {
        error: `Cette photo est trop petite (${width}×${height}px) pour une impression de qualité — envoyez une version d'au moins ${RESOLUTION_MIN_PX}px sur son plus petit côté.`,
      },
      { status: 400 }
    );
  }

  const chemin = `${user.id}/${fragmentId}/${crypto.randomUUID()}.${fichier.type.split("/")[1]}`;
  const { error: erreurUpload } = await supabase.storage.from("photos").upload(chemin, buffer, { contentType: fichier.type });
  if (erreurUpload) {
    console.error("Upload photo échoué:", erreurUpload);
    return NextResponse.json({ error: "Échec de l'envoi. Réessayez." }, { status: 500 });
  }

  const { data: photo, error: erreurInsertion } = await supabase
    .from("photos")
    .insert({ user_id: user.id, fragment_id: fragmentId, chemin_stockage: chemin, largeur_px: width, hauteur_px: height })
    .select("id, created_at")
    .single();

  if (erreurInsertion || !photo) {
    await supabase.storage.from("photos").remove([chemin]);
    return NextResponse.json({ error: "Échec de l'enregistrement. Réessayez." }, { status: 500 });
  }

  const { data: url } = await supabase.storage.from("photos").createSignedUrl(chemin, 3600);
  return NextResponse.json({ photo: { id: photo.id, fragment_id: fragmentId, url: url?.signedUrl ?? null, created_at: photo.created_at } });
}
