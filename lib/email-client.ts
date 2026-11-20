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

Pour revenir plus tard, depuis n'importe quel appareil : https://racontez-moi.com/sign-in, avec cette adresse e-mail et votre mot de passe. Mot de passe oublié ? Le lien « Mot de passe oublié » vous permet d'en choisir un nouveau.

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

// Échappe le texte, puis rend cliquables les adresses racontez-moi.com.
function texteVersHtml(texte: string): string {
  const echappe = texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const avecLiens = echappe.replace(
    /https:\/\/racontez-moi\.com[^\s,;)]*/g,
    (url) => `<a href="${url}">${url}</a>`
  );
  const paragraphes = avecLiens.split("\n\n").map((bloc) => `<p>${bloc.replace(/\n/g, "<br>")}</p>`);
  return `<div style="font-family: Georgia, serif; font-size: 17px; line-height: 1.6; color: #222; max-width: 560px;">${paragraphes.join("")}</div>`;
}

// Renvoie false sans lever d'erreur : un e-mail manqué ne doit jamais faire
// échouer l'activation de l'accès (le webhook Stripe renverrait 5xx et
// Stripe rejouerait l'événement).
async function envoyer(destinataire: string, sujet: string, texte: string, quoi: string): Promise<boolean> {
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
        subject: sujet,
        textContent: texte,
        htmlContent: texteVersHtml(texte),
      }),
    });
    if (!res.ok) console.error(`${quoi} (Brevo) échoué:`, res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error(`${quoi} (Brevo) échoué:`, e);
    return false;
  }
}

export async function envoyerEmailBienvenuePaiement(destinataire: string): Promise<boolean> {
  return envoyer(destinataire, SUJET_BIENVENUE, TEXTE_BIENVENUE, "E-mail de bienvenue");
}

// Après l'activation d'un cadeau (passe de bout en bout du 20/11/2026) : la
// personne qui reçoit n'a rien payé, pas de relevé ni de remboursement.
const TEXTE_BIENVENUE_CADEAU = `Bonjour,

Votre cadeau est activé : votre accès complet à Racontez-moi est ouvert.

Vous pouvez commencer ou reprendre vos séances quand vous le souhaitez, depuis votre tableau de bord :
https://racontez-moi.com/tableau-de-bord

Pour revenir plus tard, depuis n'importe quel appareil : https://racontez-moi.com/sign-in, avec cette adresse e-mail et votre mot de passe. Mot de passe oublié ? Le lien « Mot de passe oublié » vous permet d'en choisir un nouveau.

Quelques repères pour la suite :
- Racontez à votre rythme : une séance de temps en temps suffit.
- Chaque passage peut être relu, modifié ou recomposé avant l'impression.
- Votre livre ne part à l'impression que lorsque vous le validez vous-même.

Une question ? Il suffit de répondre à ce message.

Belle écriture,
Régis
Racontez-moi`;

export async function envoyerEmailBienvenueCadeau(destinataire: string): Promise<boolean> {
  return envoyer(destinataire, SUJET_BIENVENUE, TEXTE_BIENVENUE_CADEAU, "E-mail de bienvenue (cadeau)");
}

// À l'acheteur d'un cadeau (passe de bout en bout du 20/11/2026) : le code
// n'était visible que sur /offrir/merci — onglet fermé, plus de certificat.
export function texteCodeCadeau(code: string, prenom: string): string {
  const pour = prenom.trim() || "la personne à qui vous l'offrez";
  return `Bonjour,

Merci pour votre cadeau. Votre paiement est bien enregistré.

Voici le code d'activation pour ${pour} : ${code}

Le certificat, à imprimer ou à transmettre vous-même :
- à imprimer (PDF) : https://racontez-moi.com/api/cadeau/certificat/${code}/pdf
- à envoyer par message (image) : https://racontez-moi.com/api/cadeau/certificat/${code}/image

Pour commencer, il suffit d'aller sur https://racontez-moi.com/activer, de créer son espace et de saisir ce code.

Gardez ce message : il vous permet de retrouver le certificat à tout moment.

Une question ? Il suffit de répondre à ce message.

Régis
Racontez-moi`;
}

export async function envoyerEmailCodeCadeau(destinataire: string, code: string, prenom: string): Promise<boolean> {
  return envoyer(destinataire, "Votre cadeau Racontez-moi : le code d'activation", texteCodeCadeau(code, prenom), "E-mail du code cadeau");
}
