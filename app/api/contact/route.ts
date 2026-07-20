import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: { nom?: string; email?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { nom, email, message } = body;
  if (!nom?.trim() || !email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message?.trim()) {
    return NextResponse.json({ error: "Merci de remplir tous les champs avec une adresse email valide." }, { status: 400 });
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Racontez-moi — Contact", email: "regis@coherencelab.fr" },
      to: [{ email: "regis@coherencelab.fr" }],
      replyTo: { email, name: nom },
      subject: `Contact racontez-moi.com — ${nom}`,
      htmlContent: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #242220; line-height: 1.75;">
          <p><strong>Nom :</strong> ${nom}</p>
          <p><strong>Email :</strong> ${email}</p>
          <p style="margin-top: 1.5em; white-space: pre-line;">${message}</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    console.error("Brevo contact error:", await res.text());
    return NextResponse.json({ error: "Erreur lors de l'envoi. Réessayez." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
