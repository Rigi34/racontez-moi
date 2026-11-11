"use client";

import { useState, useEffect, useRef } from "react";
import { PHOTOS_MAX_PAR_FRAGMENT } from "@/lib/photos";
import { estHeif, convertirEnJpeg } from "@/lib/heic";

type Photo = { id: string; url: string | null; created_at: string };

const SEUIL_DETAIL_ECHECS = 3;

export default function PhotosFragment({ fragmentId }: { fragmentId: string }) {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [conversionEnCours, setConversionEnCours] = useState(false);
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

    for (const fichierChoisi of Array.from(fichiers)) {
      let fichier = fichierChoisi;
      try {
        if (await estHeif(fichierChoisi)) {
          setConversionEnCours(true);
          try {
            fichier = await convertirEnJpeg(fichierChoisi);
          } catch (e) {
            console.error("Conversion HEIC échouée:", e);
            echecs.push({
              nom: fichierChoisi.name,
              message:
                "cette photo d'iPhone n'a pas pu être préparée. Essayez de la choisir depuis la galerie Photos, ou de l'envoyer en JPG.",
            });
            continue;
          } finally {
            setConversionEnCours(false);
          }
        }
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

  // 27/10/2026 (retour de Régis) : retrait confirmé, et la photo revient à
  // l'écran avec un message si le serveur n'a pas pu la supprimer — avant,
  // elle disparaissait puis réapparaissait au rechargement sans explication.
  const supprimer = async (photo: Photo) => {
    if (!window.confirm("Retirer cette photo de votre livre ?")) return;
    setError("");
    setPhotos((prev) => (prev ?? []).filter((p) => p.id !== photo.id));
    let ok = false;
    try {
      ok = (await fetch(`/api/photos/${photo.id}`, { method: "DELETE" })).ok;
    } catch {}
    if (!ok) {
      setPhotos((prev) => [photo, ...(prev ?? [])]);
      setError("La photo n'a pas pu être retirée. Veuillez réessayer.");
    }
  };

  if (photos === null) return null;

  const complet = photos.length >= PHOTOS_MAX_PAR_FRAGMENT;

  return (
    <div className="space-y-2">
      <div className="flex gap-3 flex-wrap items-center pt-2">
        {photos.map((p) => (
          <div key={p.id} className="relative w-16 h-16">
            {p.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.url} alt="" className="w-16 h-16 object-cover border border-grege" />
            )}
            {/* Croix toujours visible : au survol seulement, elle restait
                introuvable sur téléphone (retour du 27/10/2026). */}
            <button
              onClick={() => supprimer(p)}
              className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-encre text-blanc text-sm leading-none rounded-full border-2 border-blanc shadow"
              aria-label="Retirer cette photo"
            >
              ×
            </button>
          </div>
        ))}
        {!complet && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={envoiEnCours}
            className="w-16 h-16 border border-dashed border-grege text-grege text-xs hover:border-encre hover:text-encre transition-colors disabled:opacity-40"
          >
            {envoiEnCours ? "…" : "+ Photo"}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          // image/* (11/11/2026) : laisse l'iPhone convertir lui-même ses
          // photos HEIC depuis la galerie, et rend les fichiers .heic visibles
          // dans le sélecteur d'un ordinateur. Le serveur reste strict.
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && envoyerFichiers(e.target.files)}
        />
      </div>
      <p className="font-sans text-xs text-grege">
        <span className="text-encre">
          {photos.length} / {PHOTOS_MAX_PAR_FRAGMENT} photos{complet ? " — maximum atteint pour ce souvenir" : ""}
        </span>{" "}
        · JPG, PNG, WebP ou HEIC (iPhone).
      </p>
      {conversionEnCours && (
        <p className="font-sans text-xs text-encre" role="status">
          Préparation de la photo…
        </p>
      )}
      {error && (
        <p ref={erreurRef} className="font-sans text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
