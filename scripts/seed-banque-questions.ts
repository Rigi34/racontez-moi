// Ingestion ponctuelle de la banque de questions (chapitre 6, étude
// HÉRITAGE 2026, 205 questions verbatim + 7 questions ajoutées suite à l'audit
// 14 ouvrages, soit 212 au total) dans banque_questions.
// Source : scripts/data/banque-205-questions.md.
// Exécution : npx tsx scripts/seed-banque-questions.ts

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

function chargerEnvLocal() {
  const contenu = readFileSync(join(__dirname, "..", ".env.local"), "utf-8");
  for (const ligne of contenu.split("\n")) {
    const m = ligne.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
}
chargerEnvLocal();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const LIGNE_QUESTION = /^(\d+)\.\s\[([A-Q])\.\s([^\]]+)\]\s(?:\[N\]\s)?(.+)$/;

type LigneBanque = {
  numero: number;
  section: string;
  titre_section: string;
  texte: string;
  est_nucleaire: boolean;
};

function parser(contenu: string): LigneBanque[] {
  const lignes: LigneBanque[] = [];
  for (const ligne of contenu.split("\n")) {
    const m = ligne.match(LIGNE_QUESTION);
    if (!m) continue;
    const [, numero, section, titre_section, texte] = m;
    lignes.push({
      numero: Number(numero),
      section,
      titre_section: titre_section.trim(),
      texte: texte.trim(),
      est_nucleaire: ligne.includes("] [N] "),
    });
  }
  return lignes;
}

async function main() {
  const contenu = readFileSync(join(__dirname, "data", "banque-205-questions.md"), "utf-8");
  const questions = parser(contenu);

  console.log(`Questions parsées : ${questions.length} (attendu : 212)`);
  if (questions.length !== 212) {
    console.error("ÉCART détecté avec le total attendu — vérifier le fichier source avant d'insérer.");
    process.exit(1);
  }

  const { error } = await supabase.from("banque_questions").upsert(questions, { onConflict: "numero" });
  if (error) {
    console.error("Insertion échouée:", error.message);
    process.exit(1);
  }

  const parSection = new Map<string, number>();
  for (const q of questions) parSection.set(q.section, (parSection.get(q.section) ?? 0) + 1);
  console.log("Répartition par section :", Object.fromEntries(parSection));
  console.log(`${questions.length} questions insérées dans banque_questions.`);
}

main();
