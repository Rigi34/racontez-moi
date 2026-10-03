"use client";

import { useState, useEffect, useRef } from "react";

type Photo = { id: string; url: string | null; created_at: string };

const SEUIL_DETAIL_ECHECS = 3;

export default function PhotosFragment({ fragmentId }: { fragmentId: string }) {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const erreurRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/photos?fragment_id=${fragmentId}`);
        const data = await res.json();
        setPhotos(data.photos ?? []);
      } catch {
        setPhotos([]);
      }
    })();
  }, [fragmentId]);

  // B5 : ne scrolle que si le message n'est pas déjà visible — évite tout
  // mouvement de page inutile quand l'utilisateur a déjà la zone à l'écran.
  useEffect(() => {
    if (!error || !erreurRef.current) return;
    const rect = erreurRef.current.getBoundingClientRect();
    const dejaVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
    if (!dejaVisible) {
      erreurRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [error]);

  const envoyerFichiers = async (fichiers: FileList) => {
    setEnvoiEnCours(true);
    setError("");
    let succes = 0;
    const echecs: { nom: string; message: string }[] = [];

    for (const fichier of Array.from(fichiers)) {
      try {
        const form = new FormData();
        form.append("fichier", fichier);
        form.append("fragment_id", fragmentId);
        const res = await fetch("/api/photos", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) {
          echecs.push({ nom: fichier.name, message: data.error ?? "Une erreur s'est produite." });
          continue;
        }
        succes += 1;
        setPhotos((prev) => [data.photo, ...(prev ?? [])]);
      } catch {
        echecs.push({ nom: fichier.name, message: "Une erreur s'est produite. Veuillez réessayer." });
      }
    }

    // B4 : récapitulatif clair d'un envoi multiple — ne rien afficher si
    // tout a réussi (pas de bruit inutile), sinon dire combien ont réussi
    // et le détail des premiers échecs (au-delà d'un seuil, résumer).
    if (echecs.length > 0) {
      const partiel = succes > 0 ? `${succes} photo${succes > 1 ? "s" : ""} ajoutée${succes > 1 ? "s" : ""}, ` : "";
      const detail = echecs
        .slice(0, SEUIL_DETAIL_ECHECS)
        .map((e) => `${e.nom} : ${e.message}`)
        .join(" · ");
      const reste = echecs.length > SEUIL_DETAIL_ECHECS ? ` et ${echecs.length - SEUIL_DETAIL_ECHECS} autre${echecs.length - SEUIL_DETAIL_ECHECS > 1 ? "s" : ""}` : "";
      setError(`${partiel}${echecs.length} refusée${echecs.length > 1 ? "s" : ""} (${detail}${reste}).`);
    }

    setEnvoiEnCours(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const supprimer = async (id: string) => {
    setPhotos((prev) => (prev ?? []).filter((p) => p.id !== id));
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
  };

  if (photos === null) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap items-center">
        {photos.map((p) => (
          <div key={p.id} className="relative w-16 h-16 group">
            {p.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.url} alt="" className="w-16 h-16 object-cover border border-grege" />
            )}
            <button
              onClick={() => supprimer(p.id)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-encre text-blanc text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Supprimer cette photo"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={envoiEnCours}
          className="w-16 h-16 border border-dashed border-grege text-grege text-xs hover:border-encre hover:text-encre transition-colors disabled:opacity-40"
        >
          {envoiEnCours ? "…" : "+ Photo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && envoyerFichiers(e.target.files)}
        />
      </div>
      <p className="font-sans text-xs text-grege">
        JPG, PNG ou WebP · jusqu&apos;à 6 photos par souvenir. Les photos HEIC/HEIF (format par défaut sur
        certains iPhone) ne sont pas acceptées pour l&apos;instant.
      </p>
      {error && (
        <p ref={erreurRef} className="font-sans text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
