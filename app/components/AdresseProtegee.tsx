"use client";

import { useSyncExternalStore } from "react";

// Adresse de contact légale (16/11/2026) : affichée seulement dans le
// navigateur, elle n'apparaît pas telle quelle dans le HTML que lisent les
// robots collecteurs d'adresses. Un visiteur la voit et peut cliquer dessus.
const sAbonner = () => () => {};

export default function AdresseProtegee() {
  const dansLeNavigateur = useSyncExternalStore(sAbonner, () => true, () => false);
  if (!dansLeNavigateur) return <span>bonjour [arobase] racontez-moi.com</span>;
  const adresse = ["bonjour", "racontez-moi.com"].join("@");
  return <a href={`mailto:${adresse}`} className="text-petrole hover:text-encre transition-colors">{adresse}</a>;
}
