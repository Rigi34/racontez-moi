import Link from "next/link";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Le webhook Stripe génère le code de façon asynchrone (cf.
// app/api/stripe/webhook) — cette page peut s'afficher avant qu'il ait eu
// le temps de s'exécuter. Quelques tentatives espacées suffisent dans
// l'immense majorité des cas (le webhook répond en général en quelques
// centaines de ms), sans bloquer indéfiniment si jamais il échouait.
async function attendreCode(sessionId: string, tentatives = 6): Promise<string | null> {
  for (let i = 0; i < tentatives; i++) {
    const { data } = await supabase
      .from("codes_cadeau")
      .select("code")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();
    if (data) return data.code;
    await new Promise((r) => setTimeout(r, 800));
  }
  return null;
}

export default async function OffrirMerciPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <PageMessage titre="Paiement introuvable">
        Aucune session de paiement n&apos;a été trouvée. Si vous venez d&apos;offrir un Parcours,
        contactez-nous depuis la page <Link href="/contact" className="underline text-petrole">contact</Link>.
      </PageMessage>
    );
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid" || session.metadata?.type !== "cadeau") {
    return (
      <PageMessage titre="Paiement introuvable">
        Ce paiement n&apos;a pas pu être confirmé. Contactez-nous depuis la page{" "}
        <Link href="/contact" className="underline text-petrole">contact</Link> si le prélèvement a bien eu lieu.
      </PageMessage>
    );
  }

  const code = await attendreCode(sessionId);
  const destinataire = session.metadata.destinataire_prenom;

  if (!code) {
    return (
      <PageMessage titre="Un instant...">
        Votre paiement est confirmé, mais la génération du certificat prend un peu plus de temps
        que prévu. Rafraîchissez cette page dans une minute, ou contactez-nous depuis la page{" "}
        <Link href="/contact" className="underline text-petrole">contact</Link> si le problème persiste.
      </PageMessage>
    );
  }

  return (
    <main className="min-h-screen bg-papier flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="max-w-lg w-full space-y-8">
        <div className="space-y-3">
          <p className="font-display italic text-lg text-petrole">Racontez-moi</p>
          <h1 className="font-display text-3xl text-encre">Merci pour ce cadeau.</h1>
          <p className="font-serif text-lg text-grege leading-relaxed">
            Le certificat pour {destinataire} est prêt — imprimez-le ou envoyez-le directement.
          </p>
        </div>

        <div className="bg-blanc border border-grege p-6 space-y-2">
          <p className="font-sans text-xs text-grege tracking-widest uppercase">Code d&apos;activation</p>
          <p className="font-display text-2xl text-petrole tracking-wide">{code}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={`/api/cadeau/certificat/${code}/pdf`}
            target="_blank"
            className="font-sans text-sm bg-encre text-blanc rounded-full px-6 py-3 hover:bg-[#3A3632] transition-colors"
          >
            Télécharger le PDF à imprimer →
          </a>
          <a
            href={`/api/cadeau/certificat/${code}/image`}
            target="_blank"
            className="font-sans text-sm border border-grege bg-blanc text-encre rounded-full px-6 py-3 hover:border-encre transition-colors"
          >
            Télécharger l&apos;image à envoyer →
          </a>
        </div>

        <p className="font-sans text-sm text-grege">
          {destinataire} pourra activer son Parcours en saisissant ce code sur{" "}
          <Link href="/activer" className="underline text-petrole">racontez-moi.com/activer</Link>.
        </p>
      </div>
    </main>
  );
}

function PageMessage({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-papier flex items-center justify-center px-6 py-20 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="font-display text-2xl text-encre">{titre}</h1>
        <p className="font-sans text-base text-grege leading-relaxed">{children}</p>
      </div>
    </main>
  );
}
