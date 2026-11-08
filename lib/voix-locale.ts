// Enregistrements en attente de choix, gardés SUR L'APPAREIL (IndexedDB),
// jamais envoyés au serveur sans le choix et le consentement du narrateur
// (chantier VOIX-CHOISIE).
//
// Test vocal du 31/10/2026 : Chrome recharge un onglet laissé en arrière-plan
// (téléphone posé, autre application) ; les enregistrements, gardés jusque-là
// dans la seule mémoire de la page, étaient perdus sans que le narrateur le
// sache. Ils sont désormais aussi rangés ici : liés à la séance pendant
// l'entretien, puis au passage composé ; effacés dès que le narrateur a
// gardé un extrait ou choisi « Ne rien garder », et au plus tard après
// CONSERVATION_MS (appareil partagé).
//
// Tout échec (navigation privée, stockage plein ou bloqué) est silencieux :
// la séance continue comme avant, seule la reprise après rechargement est
// perdue.

import type { Enregistrement } from "@/app/components/ChoixVoix";

const BASE = "racontez-moi-voix";
const MAGASIN = "en-attente";
const CONSERVATION_MS = 7 * 24 * 60 * 60 * 1000;

type Ligne = {
  id?: number;
  sessionId: string;
  fragmentId: string | null;
  userId: string | null;
  etape: Enregistrement["etape"];
  blob: Blob;
  creeLe: number;
};

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const requete = indexedDB.open(BASE, 1);
    requete.onupgradeneeded = () => {
      requete.result.createObjectStore(MAGASIN, { keyPath: "id", autoIncrement: true });
    };
    requete.onsuccess = () => resolve(requete.result);
    requete.onerror = () => reject(requete.error);
  });
}

// Parcourt le magasin : `garder` décide de chaque ligne (true = conservée
// telle quelle, false = effacée, objet = remplacée). Les lignes expirées
// sont toujours effacées au passage.
async function parcourir(garder: (ligne: Ligne) => boolean | Ligne): Promise<Ligne[]> {
  const db = await ouvrir();
  try {
    return await new Promise((resolve, reject) => {
      const conservees: Ligne[] = [];
      const transaction = db.transaction(MAGASIN, "readwrite");
      const curseur = transaction.objectStore(MAGASIN).openCursor();
      curseur.onsuccess = () => {
        const c = curseur.result;
        if (!c) return;
        const ligne = c.value as Ligne;
        const decision = Date.now() - ligne.creeLe > CONSERVATION_MS ? false : garder(ligne);
        if (decision === false) c.delete();
        else if (decision === true) conservees.push(ligne);
        else {
          c.update(decision);
          conservees.push(decision);
        }
        c.continue();
      };
      transaction.oncomplete = () => resolve(conservees);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

async function silencieux<T>(action: () => Promise<T>, parDefaut: T): Promise<T> {
  try {
    if (typeof indexedDB === "undefined") return parDefaut;
    return await action();
  } catch {
    return parDefaut;
  }
}

export function rangerEnregistrement(sessionId: string, enregistrement: Enregistrement): Promise<void> {
  return silencieux(async () => {
    const db = await ouvrir();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(MAGASIN, "readwrite");
        const ligne: Ligne = { sessionId, fragmentId: null, userId: null, ...enregistrement, creeLe: Date.now() };
        transaction.objectStore(MAGASIN).add(ligne);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  }, undefined);
}

// Le passage est composé : ses enregistrements lui sont rattachés.
export function lierAuPassage(sessionId: string, fragmentId: string, userId: string | null): Promise<void> {
  return silencieux(async () => {
    await parcourir((l) => (l.sessionId === sessionId ? { ...l, fragmentId, userId } : true));
  }, undefined);
}

export function enregistrementsEnAttente(fragmentId: string): Promise<Enregistrement[]> {
  return silencieux(async () => {
    const lignes = await parcourir(() => true);
    return lignes.filter((l) => l.fragmentId === fragmentId).map(({ blob, etape }) => ({ blob, etape }));
  }, []);
}

// Y a-t-il, pour ce compte, un passage dont la voix n'a pas encore été choisie ?
export function choixEnAttente(userId: string): Promise<boolean> {
  return silencieux(async () => {
    const lignes = await parcourir(() => true);
    return lignes.some((l) => l.userId === userId && l.fragmentId !== null);
  }, false);
}

export function oublierPassage(fragmentId: string): Promise<void> {
  return silencieux(async () => {
    await parcourir((l) => l.fragmentId !== fragmentId);
  }, undefined);
}
