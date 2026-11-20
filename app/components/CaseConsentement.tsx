// Case de consentement explicite (RGPD art. 9), la même partout où un compte
// se crée : inscription (/sign-in) et fin de séance d'essai (Seance,
// passe de bout en bout du 20/11/2026). Texte = VERSION_CONSENTEMENT.
export default function CaseConsentement({
  coche,
  onChange,
}: {
  coche: boolean;
  onChange: (valeur: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2.5 font-sans text-xs text-grege leading-relaxed text-left">
      <input
        type="checkbox"
        checked={coche}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
        required
      />
      <span>
        Je consens expressément à ce que mon récit, y compris les informations sensibles que je choisis
        d&apos;aborder — ma santé, mes convictions religieuses ou philosophiques, ma vie affective et
        intime — soit traité pour composer mon livre, y compris par des prestataires situés hors de
        l&apos;Union européenne. Je peux refuser toute question et retirer ce consentement à tout
        moment.{" "}
        <a href="/confidentialite/sujets-sensibles" target="_blank" className="text-petrole underline hover:text-encre">
          Sujets sensibles et données de santé
        </a>
        .
      </span>
    </label>
  );
}
