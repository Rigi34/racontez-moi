import { NextResponse } from "next/server";
import epubGenMemory from "epub-gen-memory";
import { createClient } from "@/utils/supabase/server";
import { lirePersonnalisationLivre } from "@/lib/profil-narrateur";

// Interop CJS/ESM du package vérifié explicitement en Node pur (pas
// seulement via la coquille esModuleInterop de tsc) : le module exporte à
// la fois `exports.default` (la fonction) et d'autres exports nommés
// (EPub, chapterDefaults...) — sans ce filet, l'import par défaut résout
// vers l'objet CJS complet plutôt que vers la fonction appelable.
const epub = (epubGenMemory as unknown as { default: typeof import("epub-gen-memory").default }).default ?? epubGenMemory;

// Export EPUB — inclus sans surcoût dans l'offre tout-compris (décision du
// 23 juillet 2026). Génération en pur JS (epub-gen-memory, zéro dépendance
// binaire externe) plutôt que pandoc : un exécutable système n'a aucune
// garantie de présence sur le runtime serverless de Vercel, alors que cette
// librairie ne fait que manipuler du HTML/XML en mémoire, comme
// @myriaddreamin/typst-ts-node-compiler pour le PDF. Même source de
// contenu que le PDF (les fragments validés), pas de pipeline de rendu
// séparé lourd — l'EPUB est en reflow par nature, aucune des contraintes
// de mise en page de l'intérieur imprimé (gouttière, veuves/orphelines).
function fragmentVersHtml(texte: string): string {
  return texte
    .split("\n\n")
    .map((paragraphe) => `<p>${echapperHtml(paragraphe)}</p>`)
    .join("\n");
}

function echapperHtml(texte: string): string {
  return texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  // Trou trouvé le 11/09/2026 : cette route ne vérifiait que
  // l'authentification, pas le paiement — n'importe quel compte pouvait
  // télécharger un EPUB complet sans avoir payé Le Parcours.
  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (abonnement?.status !== "active") {
    return NextResponse.json({ error: "Le Parcours n'est pas actif sur ce compte." }, { status: 403 });
  }

  const { data: fragments } = await supabase
    .from("fragments")
    .select("texte")
    .eq("user_id", user.id)
    .neq("statut", "a_revoir")
    .order("created_at", { ascending: true });

  if (!fragments?.length) {
    return NextResponse.json({ error: "Aucun fragment à assembler pour l'instant." }, { status: 400 });
  }

  // Garantie (décision de Régis, 11/09/2026) : mention textuelle en début de
  // chaque chapitre tant que la commande d'impression n'a pas été validée —
  // pas de filigrane graphique, inadapté au texte fluide de l'EPUB. Une fois
  // commandé, le narrateur a droit au fichier définitif, sans mention.
  const { data: commandeExistante } = await supabase
    .from("commandes_livre")
    .select("id")
    .eq("user_id", user.id)
    .in("statut", ["en_cours", "confirmee"])
    .maybeSingle();
  const mentionApercu = commandeExistante
    ? ""
    : `<p><em>Aperçu — ce contenu devient votre livre définitif une fois la commande passée.</em></p>`;

  try {
    const chapitres = fragments.map((f, i) => ({
      title: `Souvenir ${i + 1}`,
      content: mentionApercu + fragmentVersHtml(f.texte),
    }));

    const { titre } = await lirePersonnalisationLivre(supabase, user.id);
    const buffer = await epub({ title: titre, lang: "fr" }, chapitres);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": "attachment; filename=mes-memoires.epub",
      },
    });
  } catch (error) {
    console.error("Génération EPUB échouée:", error);
    return NextResponse.json(
      { error: "Échec de la génération de l'EPUB.", details: String(error) },
      { status: 500 }
    );
  }
}
