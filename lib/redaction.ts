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
};

function formaterTours(tours: Tour[]): string {
  return tours
    .map((t, i) => (i === 0 ? `Question : ${t.question}\n\nRéponse initiale : ${t.reponse}` : `Relance ("${t.question}") et réponse : ${t.reponse}`))
    .join("\n\n");
}

export async function composerFragment(client: Anthropic, echange: EchangeBrut): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 700,
    system: SYSTEM_FRAGMENT,
    messages: [
      {
        role: "user",
        content: `${formaterTours(echange.tours)}${echange.contexteMemoire ?? ""}`,
      },
    ],
  });
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
