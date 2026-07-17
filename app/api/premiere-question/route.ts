import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { construireSystemRelance, SYSTEM_FRAGMENT } from "@/lib/prompts";

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
      system: construireSystemRelance([]),
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
    const { email, fragment } = body;
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }
    if (!fragment?.trim()) {
      return NextResponse.json({ error: "Fragment manquant." }, { status: 400 });
    }

    const fragmentHtml = fragment
      .split("\n\n")
      .map((p) => `<p style="margin: 0 0 1.2em;">${p.replace(/\n/g, "<br>")}</p>`)
      .join("");

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Régis — Racontez-moi", email: "regis@coherencelab.fr" },
        to: [{ email }],
        subject: "Votre premier fragment — Racontez-moi",
        htmlContent: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #242220; line-height: 1.75;">
            <p style="font-style: italic; color: #6B6660;">Voici ce que ce souvenir pourrait devenir.</p>
            <div style="border-left: 2px solid #D9CFA9; padding-left: 1.5em; margin: 1.5em 0;">
              ${fragmentHtml}
            </div>
            <p>Il reste toute une vie à raconter.</p>
            <p style="margin-top: 2em;">
              <a href="https://racontez-moi.com/sign-in" style="background: #242220; color: #FFFEFB; padding: 12px 24px; text-decoration: none; border-radius: 999px; display: inline-block;">
                Commencer mon histoire →
              </a>
            </p>
            <p style="margin-top: 2.5em;">À bientôt,<br><strong>Régis</strong><br>Racontez-moi</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 2rem 0;">
            <p style="font-size: 0.8rem; color: #888;">Ce fragment vous appartient. Il ne servira jamais à entraîner une IA.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error("Brevo email error:", await res.text());
      return NextResponse.json({ error: "Erreur lors de l'envoi. Réessayez." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Étape inconnue." }, { status: 400 });
}
