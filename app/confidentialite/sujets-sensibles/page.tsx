import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sujets sensibles et données de santé — Racontez-moi",
  description: "Quelles catégories particulières de données (RGPD art. 9) peuvent être concernées, à quel titre, et ce que vous restez libre de refuser.",
};

// Contenu final rédigé par Régis (30/07/2026), suite à la demande de
// validation juridique du 30/07/2026 — reprend l'annexe de consentement de
// app/sign-in/page.tsx mot pour mot (section "Annexe" ci-dessous). Toute
// modification de ce texte doit être répercutée dans les deux endroits.
export default function SujetsSensibles() {
  return (
    <main className="min-h-screen bg-blanc">
      {/* ─── EN-TÊTE ───────────────────────────────────────────────── */}
      <header className="px-6 py-8 bg-sauge shadow-[0_1px_3px_rgba(28,25,23,0.08)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-display italic text-xl text-encre hover:text-grege transition-colors">
            Racontez-moi
          </Link>
          <Link href="/#premiere-question" className="font-sans text-sm text-encre hover:text-petrole transition-colors">
            Commencer mon histoire →
          </Link>
        </div>
      </header>

      <article className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display font-normal text-4xl md:text-5xl text-encre mb-3 leading-[1.2]">
            Sujets sensibles et données de santé
          </h1>
          <p className="font-sans text-sm text-grege mb-14">Dernière mise à jour : 30 juillet 2026</p>

          <div className="space-y-7 font-serif text-lg leading-[1.85] text-encre">
            <h2 className="font-display font-normal text-2xl text-encre mt-4 mb-4">1. Pourquoi cette page existe</h2>
            <p>
              Raconter sa vie, c&apos;est parler de son corps, de ses convictions, de ses amours. Le règlement
              général sur la protection des données (RGPD) qualifie ces informations de « catégories
              particulières de données » et en interdit le traitement par principe, sauf exception. Cette page
              vous explique lesquelles peuvent être concernées chez nous, à quel titre nous les traitons, où
              elles circulent, et ce que vous restez libre de refuser.
            </p>
            <p>
              Le responsable du traitement est <strong>CohérenceLab</strong>, entreprise individuelle
              immatriculée sous le SIRET 995 356 656 00018, Montpellier (34). Pour toute question relative à
              vos données&nbsp;: <strong>regis@coherencelab.fr</strong>, ou via notre{" "}
              <Link href="/contact" className="text-petrole hover:text-encre transition-colors">
                page Contact
              </Link>
              .
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">2. Les informations concernées</h2>
            <p>Certaines questions posées au fil des séances portent sur des informations susceptibles de révéler&nbsp;:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>votre état de santé</strong> : votre condition physique, le vieillissement, votre rapport à la maladie et à la mortalité ;</li>
              <li><strong>vos convictions religieuses ou philosophiques</strong> : votre foi, votre morale, ce qui donne sens à votre vie ;</li>
              <li><strong>votre vie affective et intime</strong> : vos amours, votre couple, votre mariage.</li>
            </ul>
            <p>
              Ces sujets peuvent être abordés au cours des séances, parce qu&apos;ils font partie de ce
              qu&apos;une vie contient. Nous préférons vous le dire ici plutôt que de vous le laisser découvrir
              en séance. Vous décidez, question par question, de ce que vous racontez et de ce que vous gardez
              pour vous.
            </p>
            <p>
              Il se peut aussi qu&apos;en racontant librement, vous évoquiez de votre propre initiative un
              souvenir touchant à l&apos;un de ces sujets, dans une section qui ne le sollicitait pas — ou
              qu&apos;un récit apparemment anodin en révèle indirectement quelque chose. Notre engagement porte
              donc sur <strong>tout sujet personnel que vous choisissez d&apos;aborder</strong>, à quelque
              moment du parcours qu&apos;il survienne.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">3. Ce que nous en faisons</h2>
            <p>
              Ces informations sont recueillies dans un seul but&nbsp;: transcrire vos séances, composer votre
              récit et fabriquer votre livre dans les formats prévus par votre offre.
            </p>
            <p>
              Elles ne servent pas à établir un profil de votre personne. Elles ne sont pas exploitées à des
              fins publicitaires, ni pour de la prospection. Elles ne sont ni vendues, ni louées, ni
              communiquées à des tiers en dehors des prestataires nécessaires à la fabrication du livre (section
              6). Elles ne font l&apos;objet d&apos;aucune décision automatisée produisant des effets juridiques
              à votre égard. Elles ne sont pas utilisées pour entraîner les modèles d&apos;intelligence
              artificielle de nos prestataires&nbsp;: nous utilisons ces services dans des conditions
              contractuelles qui excluent cet usage.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">4. Sur quelle base nous les traitons</h2>
            <p>
              Le traitement de ces informations repose sur votre <strong>consentement explicite</strong>, au
              sens de l&apos;article 9 §2 a) du RGPD. Aucune autre base légale n&apos;est invoquée.
            </p>
            <p>
              Ce consentement est <strong>libre</strong>. Il vous est demandé à la création de votre compte,
              avant votre première séance, par une case à cocher distincte, non pré-cochée, qui nomme les trois
              catégories ci-dessus et renvoie à la présente page.
            </p>
            <p>
              Le service reste pleinement accessible si vous ne souhaitez pas aborder ces sujets&nbsp;: vous
              pouvez mener l&apos;intégralité de votre projet et recevoir votre livre en laissant de côté toute
              question qui touche à votre santé, à vos convictions ou à votre vie intime. Votre refus
              n&apos;entraîne ni surcoût, ni interruption, ni dégradation du service.
            </p>
            <p>
              Pour que nous puissions justifier de ce consentement, nous en conservons la date et l&apos;heure
              exactes, ainsi que la version précise du texte que vous avez accepté ce jour-là.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">5. Votre accord ne vous engage à rien</h2>
            <p>
              Consentir, c&apos;est nous autoriser à traiter ces sujets <strong>s&apos;ils viennent</strong>. Ce
              n&apos;est pas s&apos;engager à les aborder.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Vous pouvez refuser de répondre à n&apos;importe quelle question, sans avoir à la justifier et sans conséquence sur la suite de votre projet.</li>
              <li>Vous pouvez demander qu&apos;un passage déjà enregistré ou déjà rédigé soit retiré de votre récit, avant comme après l&apos;assemblage du livre.</li>
              <li>
                Vous pouvez retirer votre consentement à tout moment, aussi facilement que vous l&apos;avez
                donné, en nous écrivant à <strong>regis@coherencelab.fr</strong>. Nous donnons suite sans délai
                injustifié, et au plus tard dans un délai d&apos;un mois.
              </li>
            </ul>
            <p>
              Le retrait de votre consentement met fin au traitement de ces catégories d&apos;informations pour
              l&apos;avenir. Il ne remet pas en cause la licéité des traitements effectués avant ce retrait,
              conformément à l&apos;article 7 §3 du RGPD. Si vous le souhaitez, ce retrait peut
              s&apos;accompagner de la suppression des passages concernés dans votre récit&nbsp;: il suffit de
              nous le préciser.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">6. Qui y a accès, et où elles circulent</h2>
            <p>
              Vos enregistrements, vos transcriptions et vos textes ne sont accessibles qu&apos;à vous-même et
              aux seules personnes qui interviennent sur la fabrication de votre livre, dans la limite de ce que
              leur mission exige.
            </p>
            <p>
              Nous faisons appel à des prestataires techniques qui agissent en qualité de sous-traitants&nbsp;:
              sur nos instructions, dans le cadre d&apos;un contrat conforme à l&apos;article 28 du RGPD, et
              sans aucun droit d&apos;usage propre sur votre récit.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-base border-collapse">
                <thead>
                  <tr className="border-b border-grege text-left">
                    <th className="py-2 pr-4 font-sans font-semibold">Fonction</th>
                    <th className="py-2 pr-4 font-sans font-semibold">Prestataire</th>
                    <th className="py-2 font-sans font-semibold">Lieu de traitement</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-base">
                  <tr className="border-b border-grege/40">
                    <td className="py-2 pr-4">Hébergement du site</td>
                    <td className="py-2 pr-4">Vercel Inc.</td>
                    <td className="py-2">États-Unis</td>
                  </tr>
                  <tr className="border-b border-grege/40">
                    <td className="py-2 pr-4">Base de données et comptes</td>
                    <td className="py-2 pr-4">Supabase</td>
                    <td className="py-2">Union européenne</td>
                  </tr>
                  <tr className="border-b border-grege/40">
                    <td className="py-2 pr-4">Transcription de votre voix</td>
                    <td className="py-2 pr-4">Groq Inc.</td>
                    <td className="py-2">États-Unis</td>
                  </tr>
                  <tr className="border-b border-grege/40">
                    <td className="py-2 pr-4">Composition du récit (relances et mise en texte)</td>
                    <td className="py-2 pr-4">Anthropic PBC</td>
                    <td className="py-2">États-Unis</td>
                  </tr>
                  <tr className="border-b border-grege/40">
                    <td className="py-2 pr-4">Envoi des emails du service</td>
                    <td className="py-2 pr-4">Brevo (Sendinblue)</td>
                    <td className="py-2">France (UE)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Impression et expédition du livre</td>
                    <td className="py-2 pr-4">Lulu Press, Inc.</td>
                    <td className="py-2">États-Unis</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Cette liste est tenue à jour ; vous pouvez nous en demander le détail à tout moment.</p>

            <h3 className="font-display font-normal text-xl text-encre mt-8 mb-3">Transferts en dehors de l&apos;Union européenne</h3>
            <p>
              Une partie de ces traitements a lieu aux États-Unis. Concrètement, l&apos;hébergement du site, la
              transcription de votre voix et la composition de votre récit sont assurés par des sociétés
              américaines&nbsp;: vos enregistrements et vos textes, y compris les passages sensibles que vous
              choisissez d&apos;aborder, sont donc transférés hors de l&apos;Union européenne.
            </p>
            <p>
              Ces transferts sont encadrés par les garanties appropriées prévues aux articles 44 et suivants du
              RGPD, en particulier les <strong>clauses contractuelles types</strong> adoptées par la Commission
              européenne, intégrées au contrat de sous-traitance conclu avec chacun de ces prestataires. Nous
              conservons ces contrats et vous les communiquons sur demande.
            </p>
            <p>
              Nous vous devons cependant une précision&nbsp;: malgré ces garanties contractuelles, un transfert
              vers les États-Unis reste soumis à un cadre juridique différent du cadre européen, notamment en
              matière d&apos;accès des autorités publiques aux données. Nous préférons vous le dire plutôt que
              de le taire.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">7. Combien de temps nous les conservons</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Enregistrements audio</strong> : conservés jusqu&apos;à la validation de votre manuscrit, puis douze mois après la livraison de votre livre, afin de pouvoir vérifier ou corriger un passage. Ils sont ensuite supprimés.</li>
              <li><strong>Transcriptions et texte de votre récit</strong> : conservés pendant toute la durée de votre projet, puis trois ans après la livraison de votre livre, afin de pouvoir rééditer, compléter ou réimprimer l&apos;ouvrage à votre demande. Ils sont ensuite supprimés.</li>
              <li><strong>Preuve de votre consentement</strong> : conservée cinq ans à compter de son recueil, pour répondre à une éventuelle demande de justification.</li>
              <li><strong>Documents comptables liés à votre commande</strong> : conservés dix ans, en application des obligations légales de conservation.</li>
            </ul>
            <p>Vous pouvez à tout moment demander la suppression anticipée de vos données, sans attendre l&apos;expiration de ces durées.</p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">8. Comment nous les protégeons</h2>
            <p>
              Vos données circulent et sont stockées sous forme chiffrée. L&apos;accès à votre compte est
              protégé par authentification, et les accès internes sont limités aux personnes dont la mission le
              nécessite. Nous nous engageons à vous informer sans délai injustifié en cas de violation de
              données susceptible d&apos;engendrer un risque élevé pour vos droits et libertés.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">9. Vos droits</h2>
            <p>Conformément aux articles 15 à 22 du RGPD, vous disposez&nbsp;:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>d&apos;un <strong>droit d&apos;accès</strong> à vos données et d&apos;obtention d&apos;une copie ;</li>
              <li>d&apos;un <strong>droit de rectification</strong> des informations inexactes ;</li>
              <li>d&apos;un <strong>droit à l&apos;effacement</strong> de vos données ;</li>
              <li>d&apos;un <strong>droit à la limitation</strong> du traitement ;</li>
              <li>d&apos;un <strong>droit d&apos;opposition</strong> ;</li>
              <li>d&apos;un <strong>droit à la portabilité</strong> de vos données, dans un format lisible et réutilisable ;</li>
              <li>d&apos;un <strong>droit de retirer votre consentement</strong> à tout moment, dans les conditions décrites en section 5.</li>
            </ul>
            <p>
              Vous pouvez également, en application de l&apos;article 85 de la loi Informatique et Libertés,{" "}
              <strong>définir des directives post-mortem</strong> relatives au sort de vos données et de votre
              récit après votre décès, et désigner la personne chargée de les faire respecter. Il vous suffit de
              nous les transmettre par écrit.
            </p>
            <p>
              Ces demandes s&apos;exercent auprès de <strong>regis@coherencelab.fr</strong> (ou via notre{" "}
              <Link href="/contact" className="text-petrole hover:text-encre transition-colors">
                page Contact
              </Link>
              ) et reçoivent une réponse dans un délai d&apos;un mois, prolongeable de deux mois en cas de
              demande complexe, auquel cas vous en êtes informé.
            </p>
            <p>
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation
              auprès de la Commission nationale de l&apos;informatique et des libertés&nbsp;: CNIL, 3 place de
              Fontenoy, TSA 80715, 75334 Paris Cedex 07 —{" "}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-petrole hover:text-encre transition-colors">
                cnil.fr
              </a>
              .
            </p>
          </div>
        </div>
      </article>

      {/* ─── FOOTER ───────────────────────────────────────────────── */}
      <footer className="py-10 px-6 bg-encre">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/confidentialite" className="font-sans text-sm text-papier/70 hover:text-petrole transition-colors">
            ← Retour à Confidentialité
          </Link>
          <p className="font-display italic text-papier text-lg">Racontez-moi</p>
        </div>
      </footer>
    </main>
  );
}
