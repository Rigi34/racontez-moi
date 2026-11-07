import { NextRequest, NextResponse } from "next/server";
import { envoyerAlerteRegis, echapperHtml } from "@/lib/alerte";
import { signatureWebhookLuluValide, statutsProblemeLulu, type PrintJobLulu } from "@/lib/lulu";

// Alerte en cas de problème sur une commande d'impression (07/11/2026, audit
// Lulu du 04/10) : jusqu'ici, après l'envoi à Lulu, la commande restait
// « confirmée » côté Racontez-moi même si Lulu la rejetait ensuite — personne
// n'était prévenu. Lulu notifie chaque changement de statut (sujet
// PRINT_JOB_STATUS_CHANGED, corps = données complètes du print job) ; cette
// route ne fait qu'envoyer un e-mail à Régis quand le statut signale un
// problème. Elle n'écrit rien en base : la reprise reste manuelle.
//
// L'abonnement à ces notifications se déclare auprès de Lulu (POST
// /webhooks/ avec l'URL https://racontez-moi.com/api/lulu/webhook) — action
// manuelle, à faire avec le compte Lulu de production.
export async function POST(req: NextRequest) {
  const corps = await req.text();
  if (!signatureWebhookLuluValide(corps, req.headers.get("lulu-hmac-sha256"))) {
    console.error("Signature webhook Lulu invalide.");
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }

  let charge: { topic?: string; data?: PrintJobLulu };
  try {
    charge = JSON.parse(corps);
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (charge.topic !== "PRINT_JOB_STATUS_CHANGED" || !charge.data) {
    return NextResponse.json({ ok: true });
  }

  const job = charge.data;
  const problemes = statutsProblemeLulu(job);
  console.log("Lulu : print job", job.id, "statut", job.status?.name);
  if (problemes.length === 0) return NextResponse.json({ ok: true });

  const details = JSON.stringify(
    { statut: job.status, lignes: (job.line_items ?? []).map((l) => l.status) },
    null,
    2
  );
  const envoye = await envoyerAlerteRegis(
    `⚠️ Lulu : commande d'impression ${job.id} ${problemes.join(", ")}`,
    `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #242220; line-height: 1.75;">
          <p>Lulu signale un problème sur une commande d'impression. Le livre ne sera pas imprimé tant que ce n'est pas réglé.</p>
          <p><strong>Commande Lulu :</strong> ${echapperHtml(String(job.id ?? "?"))}<br />
          <strong>Statut :</strong> ${echapperHtml(problemes.join(", "))}</p>
          <p>Retrouver le narrateur : table <code>commandes_livre</code>, colonne <code>lulu_print_job_id</code>.</p>
          <pre style="white-space: pre-wrap; font-size: 12px; background: #f4f1ec; padding: 12px;">${echapperHtml(details)}</pre>
        </div>
      `
  );

  if (!envoye) {
    // 500 : Lulu retentera l'envoi (5 essais), l'alerte n'est pas perdue.
    return NextResponse.json({ error: "Alerte non envoyée." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
