// Alerte interne par e-mail à Régis (Brevo, même compte et même adresse que
// le formulaire de contact). Jamais envoyée à un client.
export async function envoyerAlerteRegis(sujet: string, htmlContent: string): Promise<boolean> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Racontez-moi — Alerte", email: "regis@coherencelab.fr" },
      to: [{ email: "regis@coherencelab.fr" }],
      subject: sujet,
      htmlContent,
    }),
  });
  if (!res.ok) console.error("Alerte Brevo échouée:", await res.text());
  return res.ok;
}

export function echapperHtml(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
