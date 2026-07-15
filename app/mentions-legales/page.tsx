import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales & CGV — Racontez-moi",
  description: "Identité de l'éditeur, hébergement, propriété intellectuelle et conditions générales de vente.",
};

export default function MentionsLegales() {
  return (
    <main className="min-h-screen bg-blanc">
      {/* ─── EN-TÊTE ───────────────────────────────────────────────── */}
      <header className="px-6 py-8 bg-sauge shadow-[0_1px_3px_rgba(28,25,23,0.08)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-display italic text-xl text-encre hover:text-grege transition-colors"
          >
            Racontez-moi
          </Link>
          <Link
            href="/#premiere-question"
            className="font-sans text-sm text-encre hover:text-petrole transition-colors"
          >
            Commencer mon histoire →
          </Link>
        </div>
      </header>

      <article className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 id="mentions-legales" className="font-display font-normal text-4xl md:text-5xl text-encre mb-10 leading-[1.2]">
            Mentions légales
          </h1>

          <div className="space-y-7 font-serif text-lg leading-[1.85] text-encre">
            <p>
              Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la
              confiance en l&apos;économie numérique, il est précisé aux utilisateurs du site
              Racontez-moi l&apos;identité des différents intervenants dans le cadre de sa
              réalisation et de son suivi.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">
              Édition du site
            </h2>
            <p>
              Le présent site, accessible à l&apos;URL racontez-moi.vercel.app (le « Site »),
              est édité par :
            </p>
            <p>
              CohérenceLab
              <br />
              Entreprise individuelle
              <br />
              SIRET : 995 356 656 00018
              <br />
              Activité : rédaction de contenus et conseil en communication
              <br />
              Ville : Montpellier (34)
            </p>
            <p>
              Le Site est édité conformément aux dispositions du Code civil et du Code de
              la propriété intellectuelle, ainsi qu&apos;à la loi n° 78-17 du 6 janvier 1978
              relative à l&apos;informatique, aux fichiers et aux libertés.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">
              Directeur de la publication
            </h2>
            <p>CohérenceLab.</p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">
              Hébergement
            </h2>
            <p>
              Le Site est hébergé par la société Vercel Inc., dont le siège social est
              situé au 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis, joignable à
              l&apos;adresse privacy@vercel.com.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">
              Propriété intellectuelle
            </h2>
            <p>
              L&apos;ensemble des éléments présents sur le Site (textes, méthode éditoriale,
              identité visuelle, structure) est la propriété exclusive de CohérenceLab,
              sauf mention contraire. Toute reproduction, représentation, modification,
              publication ou adaptation de tout ou partie des éléments du Site, quel que
              soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite
              préalable.
            </p>
            <p>
              Les récits, fragments et manuscrits produits par chaque narrateur via le
              Site demeurent la propriété exclusive de ce narrateur, conformément à la
              politique de{" "}
              <Link href="/confidentialite" className="text-petrole hover:text-encre transition-colors">
                confidentialité
              </Link>{" "}
              du Site.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">
              Données personnelles
            </h2>
            <p>
              Le traitement des données personnelles des utilisateurs du Site est décrit
              en détail sur la page{" "}
              <Link href="/confidentialite" className="text-petrole hover:text-encre transition-colors">
                Confidentialité
              </Link>
              , accessible depuis le pied de page du Site. Conformément au Règlement (UE)
              2016/679 (RGPD) et à la loi Informatique et Libertés du 6 janvier 1978
              modifiée, chaque utilisateur dispose d&apos;un droit d&apos;accès, de
              rectification, de suppression, de limitation, de portabilité et
              d&apos;opposition au traitement de ses données, exerçable via la page{" "}
              <Link href="/contact" className="text-petrole hover:text-encre transition-colors">
                Contact
              </Link>{" "}
              du Site.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">
              Cookies
            </h2>
            <p>
              Le Site utilise uniquement les cookies strictement nécessaires à son
              fonctionnement (maintien de session de connexion). Aucun cookie de suivi
              publicitaire ou de profilage tiers n&apos;est déposé sans consentement préalable.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">
              Médiation de la consommation
            </h2>
            <p>
              Conformément aux articles L.616-1 et R.616-1 du Code de la consommation,
              tout consommateur a le droit de recourir gratuitement à un service de
              médiation de la consommation en vue de la résolution amiable d&apos;un litige
              relatif à l&apos;exécution d&apos;un contrat conclu avec l&apos;éditeur du Site. Les
              coordonnées du médiateur compétent seront communiquées avant l&apos;ouverture
              des inscriptions payantes.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">
              Limitation de responsabilité
            </h2>
            <p>
              L&apos;éditeur s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des
              informations diffusées sur le Site, mais ne saurait garantir l&apos;exhaustivité
              ou l&apos;absence de modification des informations mises à disposition.
              L&apos;éditeur ne pourra être tenu responsable des dommages directs ou indirects
              résultant de l&apos;accès ou de l&apos;utilisation du Site.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">
              Droit applicable
            </h2>
            <p>
              Les présentes mentions légales sont soumises au droit français. En cas de
              litige et à défaut d&apos;accord amiable, les tribunaux français seront seuls
              compétents.
            </p>

            <h1 id="cgv" className="font-display font-normal text-4xl md:text-5xl text-encre mt-20 mb-10 leading-[1.2]">
              Conditions générales de vente
            </h1>
            <p>
              Cette section sera complétée avant l&apos;ouverture des inscriptions payantes
              du Parcours. À ce jour, le Site propose uniquement une première séance
              d&apos;essai, gratuite et sans engagement, sans collecte de moyen de paiement.
              Aucune vente n&apos;est effectuée sur le Site en l&apos;état.
            </p>
            <p>
              Les conditions générales de vente applicables au Parcours (tarifs,
              modalités de paiement, durée d&apos;engagement, droit de rétractation,
              modalités de résiliation) seront publiées à cet emplacement avant toute
              mise en place d&apos;un paiement réel.
            </p>
          </div>
        </div>
      </article>

      {/* ─── FOOTER ───────────────────────────────────────────────── */}
      <footer className="py-10 px-6 bg-encre">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-sans text-sm text-papier/70 hover:text-petrole transition-colors"
          >
            ← Retour à l&apos;accueil
          </Link>
          <p className="font-display italic text-papier text-lg">
            Racontez-moi
          </p>
        </div>
      </footer>
    </main>
  );
}
