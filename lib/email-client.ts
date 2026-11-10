// E-mails envoyés aux clients (Brevo, même compte et même clé que le
// formulaire de contact et les alertes). Domaine racontez-moi.com authentifié
// chez Brevo (SPF include:spf.brevo.com + DKIM brevo1._domainkey, vérifiés le
// 10/11/2026). Texte : modèle « Après un paiement » validé par Régis le
// 10/11/2026 (~/projets/racontez-moi-editorial/modeles-clients).

const EXPEDITEUR = { name: "Racontez-moi", email: "bonjour@racontez-moi.com" };

const SUJET_BIENVENUE = "Bienvenue dans Racontez-moi";

const TEXTE_BIENVENUE = `Bonjour,

Merci pour votre confiance. Votre paiement est bien enregistré et votre accès complet est ouvert.

Vous pouvez reprendre vos séances quand vous le souhaitez, depuis votre tableau de bord :
https://racontez-moi.com/tableau-de-bord

Quelques repères pour la suite :
- Racontez à votre rythme : une séance de temps en temps suffit.
- Chaque passage peut être relu, modifié ou recomposé avant l'impression.
- Votre livre ne part à l'impression que lorsque vous le validez vous-même.

Sur votre relevé bancaire, le paiement apparaît sous le libellé « COHÉRENCE* RACONTEZ ».

Si Racontez-moi ne vous convient pas, vous êtes remboursé intégralement, sans justification, dans les 30 jours qui suivent le paiement (tant que le livre n'est pas validé pour l'impression).

Une question ? Il suffit de répondre à ce message.

Belle écriture,
Régis
Racontez-moi`;

function texteVersHtml(texte: string): string {
  const echappe = texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const avecLien = echappe.replace(
    "https://racontez-moi.com/tableau-de-bord",
    '<a href="https://racontez-moi.com/tableau-de-bord">https://racontez-moi.com/tableau-de-bord</a>'
  );
  const paragraphes = avecLien.split("\n\n").map((bloc) => `<p>${bloc.replace(/\n/g, "<br>")}</p>`);
  return `<div style="font-family: Georgia, serif; font-size: 17px; line-height: 1.6; color: #222; max-width: 560px;">${paragraphes.join("")}</div>`;
}

// Renvoie false sans lever d'erreur : un e-mail manqué ne doit jamais faire
// échouer l'activation de l'accès (le webhook Stripe renverrait 5xx et
// Stripe rejouerait l'événement).
export async function envoyerEmailBienvenuePaiement(destinataire: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: EXPEDITEUR,
        replyTo: EXPEDITEUR,
        to: [{ email: destinataire }],
        subject: SUJET_BIENVENUE,
        textContent: TEXTE_BIENVENUE,
        htmlContent: texteVersHtml(TEXTE_BIENVENUE),
      }),
    });
    if (!res.ok) console.error("E-mail de bienvenue (Brevo) échoué:", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("E-mail de bienvenue (Brevo) échoué:", e);
    return false;
  }
}
