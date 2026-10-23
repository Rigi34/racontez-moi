// Fond « plus vivant » (23/10/2026) : taches floues qui dérivent lentement,
// définies dans app/globals.css (.fond-vivant, .tache--*). Le parent doit être
// en position relative. `entete` limite le fond au haut de page (pages de
// lecture : le texte long reste sur fond calme).
export default function FondVivant({ entete = false }: { entete?: boolean }) {
  return (
    <div className={entete ? "fond-vivant fond-vivant--entete" : "fond-vivant"} aria-hidden="true">
      <div className="tache tache--ambre" />
      <div className="tache tache--sauge" />
      <div className="tache tache--petrole" />
      <div className="tache tache--ambre-bas" />
    </div>
  );
}
