// Script d'ingestion ponctuelle des 14 fiches de référence dans livres_reference.
// Exécution : npx tsx scripts/ingest-livres-reference.ts [--dry-run] [--only=Ledoux]
//
// Étapes : découpe chaque fiche par sections ##/###, fait classer chaque
// chunk par Claude Haiku (conserver ? tag_fonction ? tag_theme ?), embed les
// chunks conservés via embedText(), puis insère dans Supabase (service role,
// contourne RLS — la table est en lecture publique de toute façon).

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { embedText } from "../lib/embeddings";

const DOSSIER_FICHES = "/root/memoires-augmentees/05_OUVRAGES_DE_REFERENCE";
const DRY_RUN = process.argv.includes("--dry-run");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];

function chargerEnvLocal() {
  const contenu = readFileSync(join(__dirname, "..", ".env.local"), "utf-8");
  for (const ligne of contenu.split("\n")) {
    const m = ligne.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
}
chargerEnvLocal();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

type Chunk = { titre: string; texte: string };

function chunkerFiche(contenu: string): Chunk[] {
  const lignes = contenu.split("\n");
  const chunks: Chunk[] = [];
  let titreCourant = "en-tête";
  let buffer: string[] = [];

  const flush = () => {
    const texte = buffer.join("\n").trim();
    if (texte.length > 120) chunks.push({ titre: titreCourant, texte });
    buffer = [];
  };

  for (const ligne of lignes) {
    if (/^(## |### )/.test(ligne)) {
      flush();
      titreCourant = ligne.replace(/^#+\s*/, "").trim();
    }
    buffer.push(ligne);
  }
  flush();

  // Sections toujours méta (score du livre, copywriting marketing, biblio
  // interne) — jamais du contenu actionnable pour l'entretien IA.
  const TITRES_EXCLUS = /^(en-tête|SCORE ET JUSTIFICATION|.*FORMULATIONS COPYWRITING.*|CONNEXIONS AVEC LES AUTRES OUVRAGES.*)$/i;
  const sansEnTete = chunks.filter((c) => !TITRES_EXCLUS.test(c.titre));

  // Découpe supplémentaire des chunks trop longs, par paragraphes.
  const resultat: Chunk[] = [];
  for (const c of sansEnTete) {
    if (c.texte.length <= 1800) {
      resultat.push(c);
      continue;
    }
    const paragraphes = c.texte.split(/\n{2,}/);
    let sous: string[] = [];
    let longueur = 0;
    for (const p of paragraphes) {
      if (longueur + p.length > 1400 && sous.length) {
        resultat.push({ titre: c.titre, texte: sous.join("\n\n") });
        sous = [];
        longueur = 0;
      }
      sous.push(p);
      longueur += p.length;
    }
    if (sous.length) resultat.push({ titre: c.titre, texte: sous.join("\n\n") });
  }
  return resultat;
}

const SYSTEM_TAG = `Tu classes des extraits d'ouvrages sur l'écriture de mémoires/autobiographie pour alimenter une base de connaissances RAG utilisée par une IA qui mène des entretiens mémoriels avec des personnes de 55 à 75 ans, puis compose des fragments de mémoire littéraires.

Réponds UNIQUEMENT en JSON strict, rien d'autre :
{"conserver": true|false, "tag_fonction": "..."|null, "tag_theme": "..."|null}

conserver = true seulement si l'extrait contient une idée directement exploitable pendant un entretien ou la composition d'un fragment : une technique concrète, un principe de structure, un type de question, ou un signal à repérer chez le narrateur. conserver = false pour le contenu purement biographique, bibliographique, les scores d'utilité, les résumés généraux sans substance actionnable.

Si conserver = true, tag_fonction doit être EXACTEMENT une de ces 4 valeurs :
- "technique_sensorielle" : technique d'écriture ou d'évocation sensorielle/scénique (show don't tell, détail concret, scène vs résumé, déclencheurs mémoriels...)
- "structure_recit" : principe d'organisation du récit (fil conducteur, structure en actes, assemblage de fragments, arc narratif...)
- "type_question" : un type ou modèle de question à poser au narrateur
- "signal_hesitation" : un signal, une résistance, une esquive, un blocage à reconnaître chez le narrateur, et comment y réagir

tag_theme = un thème court en un ou deux mots en français (ex: enfance, resilience, silence, transmission, corps, deuil, identite, memoire_sensorielle...), ou null si non pertinent.`;

async function classer(texte: string): Promise<{ conserver: boolean; tag_fonction: string | null; tag_theme: string | null }> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    system: SYSTEM_TAG,
    messages: [{ role: "user", content: texte.slice(0, 1800) }],
  });
  const brut = (message.content[0] as { type: string; text: string }).text.trim();
  const nettoye = brut.replace(/^```json\s*|\s*```$/g, "");
  try {
    return JSON.parse(nettoye);
  } catch {
    console.warn("  ⚠ réponse non-JSON, chunk ignoré:", brut.slice(0, 80));
    return { conserver: false, tag_fonction: null, tag_theme: null };
  }
}

async function main() {
  const fichiers = readdirSync(DOSSIER_FICHES).filter((f) => f.startsWith("FICHE_") && f.endsWith(".md"));
  let totalConserves = 0;
  let totalRejetes = 0;

  for (const fichier of fichiers) {
    const ouvrage = fichier.replace(/^FICHE_/, "").replace(/\.md$/, "");
    if (ONLY && !ouvrage.includes(ONLY)) continue;

    const contenu = readFileSync(join(DOSSIER_FICHES, fichier), "utf-8");
    const auteurMatch = contenu.match(/\*\*Auteur\s*:\*\*\s*(.+)/);
    const auteur = auteurMatch ? auteurMatch[1].split("—")[0].trim() : "Inconnu";

    const chunks = chunkerFiche(contenu);
    console.log(`\n=== ${ouvrage} (${auteur}) — ${chunks.length} chunks candidats ===`);

    const lignesRetenues: {
      ouvrage: string;
      auteur: string;
      chunk_index: number;
      texte: string;
      tag_fonction: string;
      tag_theme: string | null;
      embedding: number[] | null;
    }[] = [];

    let index = 0;
    for (const chunk of chunks) {
      const classification = await classer(chunk.texte);
      if (!classification.conserver || !classification.tag_fonction) {
        totalRejetes++;
        continue;
      }
      const embedding = DRY_RUN ? null : await embedText(chunk.texte);
      lignesRetenues.push({
        ouvrage,
        auteur,
        chunk_index: index++,
        texte: chunk.texte,
        tag_fonction: classification.tag_fonction,
        tag_theme: classification.tag_theme,
        embedding,
      });
      totalConserves++;
      process.stdout.write(".");
    }
    console.log(`\n  → ${lignesRetenues.length} chunks retenus`);

    if (DRY_RUN) {
      console.log("  (dry-run — pas d'insertion)");
      for (const l of lignesRetenues) {
        console.log(`    [${l.tag_fonction}/${l.tag_theme}] ${l.texte.slice(0, 80).replace(/\n/g, " ")}...`);
      }
      continue;
    }

    if (lignesRetenues.length === 0) continue;

    await supabase.from("livres_reference").delete().eq("ouvrage", ouvrage);
    const { error } = await supabase.from("livres_reference").insert(lignesRetenues);
    if (error) console.error(`  ✗ erreur insertion ${ouvrage}:`, error.message);
    else console.log(`  ✓ inséré en base`);
  }

  console.log(`\nTotal : ${totalConserves} conservés, ${totalRejetes} rejetés.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
