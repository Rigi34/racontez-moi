import { NextResponse } from "next/server";
import epubGenMemory from "epub-gen-memory";
import { createClient } from "@/utils/supabase/server";

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

  const { data: fragments } = await supabase
    .from("fragments")
    .select("texte")
    .eq("user_id", user.id)
    .neq("statut", "a_revoir")
    .order("created_at", { ascending: true });

  if (!fragments?.length) {
    return NextResponse.json({ error: "Aucun fragment à assembler pour l'instant." }, { status: 400 });
  }

  try {
    const chapitres = fragments.map((f, i) => ({
      title: `Souvenir ${i + 1}`,
      content: fragmentVersHtml(f.texte),
    }));

    const buffer = await epub({ title: "Mes Mémoires", lang: "fr" }, chapitres);

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
