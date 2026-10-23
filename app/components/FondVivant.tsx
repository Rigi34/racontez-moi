// Fond « plus vivant » (23/10/2026) : taches floues qui dérivent lentement,
// définies dans app/globals.css (.fond-vivant, .tache--*). Le parent doit être
// en position relative. `entete` limite le fond au haut de page (pages de
// lecture : le texte long reste sur fond calme). `fixe` garde les couleurs
// sans mouvement (espace personnel : rien qui distrait).
export default function FondVivant({ entete = false, fixe = false }: { entete?: boolean; fixe?: boolean }) {
  const classes = ["fond-vivant", entete && "fond-vivant--entete", fixe && "fond-vivant--fixe"]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} aria-hidden="true">
      <div className="tache tache--ambre" />
      <div className="tache tache--sauge" />
      <div className="tache tache--petrole" />
      <div className="tache tache--ambre-bas" />
    </div>
  );
}
