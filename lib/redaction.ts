// Couche de rédaction séparée : transforme un échange brut (transcript) en
// texte final littéraire. Volontairement isolée du moteur de questions
// (lib/prompts.ts / lib/profil-narrateur.ts, qui pilotent l'entretien en
// temps réel avec un autre modèle et un autre system prompt) pour pouvoir
// un jour la ré-exécuter indépendamment — nouvelle rédaction sans refaire
// l'entretien, changement de style, assemblage multi-séances pour le livre.

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_FRAGMENT } from "./prompts";

export type Tour = { question: string; reponse: string };

export type EchangeBrut = {
  tours: Tour[];
  contexteMemoire?: string;
  // Régénération ciblée (décision du 20 juillet 2026) : le narrateur peut
  // préciser ce qui ne sonne pas juste sans savoir corriger lui-même le
  // texte. Reste bordé par SYSTEM_FRAGMENT — n'autorise aucun ajout de
  // détail absent des tours d'origine, juste une nouvelle composition.
  instruction?: string;
};

function formaterTours(tours: Tour[]): string {
  return tours
    .map((t, i) => (i === 0 ? `Question : ${t.question}\n\nRéponse initiale : ${t.reponse}` : `Relance ("${t.question}") et réponse : ${t.reponse}`))
    .join("\n\n");
}

export async function composerFragment(client: Anthropic, echange: EchangeBrut): Promise<string> {
  const blocInstruction = echange.instruction?.trim()
    ? `\n\nLe narrateur a demandé à recomposer ce fragment avec cette précision (n'invente rien au-delà des tours ci-dessus, utilise-la seulement pour mieux cadrer la composition) : ${echange.instruction.trim()}`
    : "";

  const message = await client.messages.create({
    // 700 s'est avéré insuffisant dès qu'une séance couvre plusieurs
    // souvenirs enchaînés (le modèle peut légitimement vouloir composer deux
    // fragments distincts, ~400 mots chacun) — coupait le texte en plein
    // milieu de phrase, sans qu'aucune trace n'en reste dans les logs.
    max_tokens: 1600,
    model: "claude-sonnet-4-6",
    system: SYSTEM_FRAGMENT,
    messages: [
      {
        role: "user",
        content: `${formaterTours(echange.tours)}${echange.contexteMemoire ?? ""}${blocInstruction}`,
      },
    ],
  });
  if (message.stop_reason === "max_tokens") {
    console.error("composerFragment: réponse tronquée par max_tokens", { tours: echange.tours.length });
  }
  return (message.content[0] as { type: string; text: string }).text.trim();
}

const SYSTEM_RESUME_SESSION = `Tu résumes une séance d'entretien mémoriel en 2-3 phrases factuelles, à usage interne (jamais montrées au narrateur).
Objectif : qu'un interlocuteur qui reprend la conversation à la séance suivante sache immédiatement ce qui a déjà été raconté, sans avoir à tout relire — évite qu'une IA qui n'a "aucune mémoire" ne repose des questions déjà traitées.
Mentionne : la période de vie évoquée, le lieu ou l'événement central, un détail sensoriel marquant s'il y en a un.
Pas de jugement, pas d'analyse psychologique, uniquement des faits de contenu. Réponds uniquement par le résumé, sans préambule.`;

export async function genererResumeSession(client: Anthropic, echange: EchangeBrut): Promise<string> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 120,
    system: SYSTEM_RESUME_SESSION,
    messages: [
      {
        role: "user",
        content: formaterTours(echange.tours),
      },
    ],
  });
  return (message.content[0] as { type: string; text: string }).text.trim();
}
