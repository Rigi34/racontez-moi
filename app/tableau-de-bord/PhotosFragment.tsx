"use client";

import { useState, useEffect, useRef } from "react";

type Photo = { id: string; url: string | null; created_at: string };

export default function PhotosFragment({ fragmentId }: { fragmentId: string }) {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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

  const envoyerFichiers = async (fichiers: FileList) => {
    setEnvoiEnCours(true);
    setError("");
    for (const fichier of Array.from(fichiers)) {
      try {
        const form = new FormData();
        form.append("fichier", fichier);
        form.append("fragment_id", fragmentId);
        const res = await fetch("/api/photos", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Une erreur s'est produite.");
          continue;
        }
        setPhotos((prev) => [data.photo, ...(prev ?? [])]);
      } catch {
        setError("Une erreur s'est produite. Veuillez réessayer.");
      }
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
      {error && <p className="font-sans text-xs text-red-700">{error}</p>}
    </div>
  );
}
