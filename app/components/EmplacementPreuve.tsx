// Emplacements réservés aux preuves concrètes du produit — 02/10/2026, étude
// « Racontez-moi face au marché », priorité 4. Règle absolue : aucun
// témoignage, avis, livre ou extrait inventé. Tant que le contenu réel n'est
// pas fourni, l'emplacement n'apparaît PAS en production : il n'est visible
// qu'en développement local, ou sur un déploiement où la variable
// NEXT_PUBLIC_AFFICHER_EMPLACEMENTS vaut "1" (pour relecture), afin de
// montrer où et comment le contenu s'insérera.
export const AFFICHER_EMPLACEMENTS =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_AFFICHER_EMPLACEMENTS === "1";

export default function EmplacementPreuve({
  titre,
  attendu,
  format = "min-h-56",
  sombre = false,
}: {
  titre: string;
  attendu: string;
  format?: string;
  sombre?: boolean;
}) {
  if (!AFFICHER_EMPLACEMENTS) return null;
  return (
    <div
      className={`${format} w-full min-w-0 border border-dashed flex flex-col items-center justify-center gap-2 p-6 text-center ${
        sombre ? "border-papier/40 text-papier/70" : "border-grege/60 text-grege bg-blanc/60"
      }`}
    >
      <p className="font-sans text-[11px] tracking-widest uppercase">Emplacement réservé · contenu réel à fournir</p>
      <p className={`font-display text-lg ${sombre ? "text-papier" : "text-encre"}`}>{titre}</p>
      <p className="font-sans text-xs leading-relaxed max-w-xs">{attendu}</p>
    </div>
  );
}
