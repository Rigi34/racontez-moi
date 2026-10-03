import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { voixChoisieActive } from "@/lib/voix";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const [sessions, fragments, toursConversation, profilNarrateur, abonnement, adresseLivraison, commandesLivre, fragmentsHistorique] = await Promise.all([
    supabase.from("sessions").select("*").eq("user_id", user.id),
    supabase.from("fragments").select("id, session_id, texte, statut, created_at").eq("user_id", user.id),
    supabase.from("tours_conversation").select("*").eq("user_id", user.id),
    supabase.from("profil_narrateur").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("abonnements").select("status, created_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("adresses_livraison").select("nom, adresse, ville, code_postal, pays, telephone").eq("user_id", user.id).maybeSingle(),
    supabase.from("commandes_livre").select("id, statut, nombre_pages, created_at").eq("user_id", user.id),
    supabase.from("fragments_historique").select("id, fragment_id, texte, created_at").eq("user_id", user.id),
  ]);

  // Extraits de voix (chantier VOIX-CHOISIE) : métadonnées + lien de
  // téléchargement signé valable 7 jours, pour que l'export reste utile
  // une fois téléchargé. Absent tant que la fonction est coupée.
  let extraitsVoix: unknown[] | undefined;
  if (voixChoisieActive()) {
    const { data } = await supabase
      .from("extraits_voix")
      .select("id, fragment_id, chemin_stockage, type_mime, taille_octets, actif, consenti_le, version_consentement, created_at")
      .eq("user_id", user.id);
    extraitsVoix = await Promise.all(
      (data ?? []).map(async ({ chemin_stockage, ...e }) => {
        const { data: signe } = await supabase.storage.from("voix").createSignedUrl(chemin_stockage, 7 * 24 * 3600);
        return { ...e, telechargement: signe?.signedUrl ?? null };
      })
    );
  }

  const export_ = {
    exporte_le: new Date().toISOString(),
    compte: { email: user.email, cree_le: user.created_at },
    abonnement: abonnement.data,
    note_sur_les_fragments:
      "sessions[].transcript[] contient l'instantané figé de la composition d'origine (jamais modifié après coup, même après une édition ou une recomposition). fragments[].texte est la version actuelle et vivante du fragment — celle qui compte pour le livre, modifiable à tout moment depuis le tableau de bord. fragments_historique conserve chaque version remplacée (édition ou recomposition) avant son écrasement. Les trois peuvent donc légitimement différer.",
    sessions: sessions.data,
    fragments: fragments.data,
    fragments_historique: fragmentsHistorique.data,
    tours_conversation: toursConversation.data,
    profil_narrateur: profilNarrateur.data,
    adresse_livraison: adresseLivraison.data,
    commandes_livre: commandesLivre.data,
    ...(extraitsVoix ? { extraits_voix: extraitsVoix } : {}),
  };

  return new NextResponse(JSON.stringify(export_, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="racontez-moi-export-${user.id}.json"`,
    },
  });
}
