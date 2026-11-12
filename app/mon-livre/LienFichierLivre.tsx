"use client";

import type { ReactNode } from "react";

// 12/11/2026 (retour de Régis) : sur tablette Android, « Voir le PDF »
// rouvrait un ancien aperçu gardé en mémoire — un titre modifié n'y
// apparaissait pas. Chaque clic ajoute une marque unique à l'adresse, pour
// que le navigateur demande toujours un fichier neuf au serveur.
export default function LienFichierLivre({
  href,
  nouvelOnglet = false,
  className,
  children,
}: {
  href: string;
  nouvelOnglet?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target={nouvelOnglet ? "_blank" : undefined}
      onClick={(e) => {
        e.currentTarget.href = `${href}?v=${Date.now()}`;
      }}
      className={className}
    >
      {children}
    </a>
  );
}
