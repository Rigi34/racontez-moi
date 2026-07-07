import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Rate limit simple par IP — compteur en mémoire (suffisant pour MVP)
const ipCounts = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry || now > entry.reset) {
    ipCounts.set(ip, { count: 1, reset: now + 3600_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

const SYSTEM_RELANCE = `Tu es un interlocuteur mémorial délicat.
Le visiteur vient de répondre à la question "Quelle est la première maison dont vous vous souvenez ?".
Ta seule mission : poser UNE relance sensorielle courte (max 20 mots) qui approfondit ce souvenir.
Choisis un détail sensoriel (odeur, lumière, son, texture) mentionné ou probable.
Ne pose qu'une seule question. Pas de commentaire, pas d'analyse, juste la question.
Vouvoie l'interlocuteur. Ton délicat, chaleureux, patient.`;

const SYSTEM_FRAGMENT = `Tu es un écrivain qui compose des fragments de mémoire.
À partir de ce que la personne a partagé, compose un fragment littéraire à la première personne.
Règles absolues :
- Longueur adaptative : 150 à 400 mots selon la richesse du matériau partagé. Ne compresse pas artificiellement une séance riche — laisse le fragment respirer.
- Si la personne a clairement évoqué deux souvenirs distincts (deux lieux, deux époques, deux scènes sans lien), compose deux fragments séparés, chacun complet, séparés par une ligne vide et un tiret cadratin (—).
- Première personne (je)
- Temps du récit : imparfait ou passé simple
- Prose narrative, jamais de liste
- N'invente aucun détail absent des réponses
- Conserve les aspérités, les hésitations de la voix — c'est elle qui fait le style
- Commence par un détail concret, pas une généralité
- Dernier mot : ouvre vers quelque chose, ne clôture pas
- Aucune formule d'introduction ("Voici votre fragment", etc.) — commence directement
Résultat : uniquement le texte du ou des fragments.`;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Limite atteinte. Revenez dans une heure." },
      { status: 429 }
    );
  }

  let body: { step: string; reponse?: string; reponseRelance?: string; email?: string; fragment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { step } = body;

  if (step === "relance") {
    const { reponse } = body;
    if (!reponse?.trim()) {
      return NextResponse.json({ error: "Réponse manquante." }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 80,
      system: SYSTEM_RELANCE,
      messages: [{ role: "user", content: reponse }],
    });

    const relance = (message.content[0] as { type: string; text: string }).text.trim();
    return NextResponse.json({ relance });
  }

  if (step === "fragment") {
    const { reponse, reponseRelance } = body;
    if (!reponse?.trim() || !reponseRelance?.trim()) {
      return NextResponse.json({ error: "Réponses manquantes." }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      system: SYSTEM_FRAGMENT,
      messages: [
        {
          role: "user",
          content: `Question : Quelle est la première maison dont vous vous souvenez ?\n\nRéponse initiale : ${reponse}\n\nRelance et réponse : ${reponseRelance}`,
        },
      ],
    });

    const fragment = (message.content[0] as { type: string; text: string }).text.trim();
    return NextResponse.json({ fragment });
  }

  if (step === "email") {
    // Ici : intégration Brevo future. Pour MVP, on log simplement.
    const { email, fragment } = body;
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email manquant." }, { status: 400 });
    }
    // TODO: envoyer via Brevo avec le fragment en PDF
    console.log(`[lead] ${email} — fragment: ${fragment?.slice(0, 60)}…`);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Étape inconnue." }, { status: 400 });
}
