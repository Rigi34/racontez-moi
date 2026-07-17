// Embeddings via l'API Inference HuggingFace — même modèle que la Bibliothèque
// CohérenceLab (sentence-transformers/paraphrase-multilingual-mpnet-base-v2, 768 dims).
// Gratuit, multilingue, pas de clé Voyage/OpenAI nécessaire.
//
// ATTENTION : l'ancien domaine api-inference.huggingface.co a été décommissionné
// par Hugging Face (migration vers router.huggingface.co, "Inference Providers").
// L'ancien domaine ne résout même plus en DNS — bug trouvé le 17 juillet 2026
// après que tous les embeddings de livres_reference (264 lignes) soient
// silencieusement restés NULL. embedText() échoue exprès en silence pour ne
// jamais casser l'appelant, donc on logge l'erreur ici pour ne pas reproduire
// ce piège (une régression HF resterait sinon invisible).
export async function embedText(texte: string): Promise<number[] | null> {
  try {
    const res = await fetch(
      "https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-mpnet-base-v2/pipeline/feature-extraction",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: texte, options: { wait_for_model: true } }),
      }
    );
    if (!res.ok) {
      console.error("embedText: HF Inference API error", res.status, await res.text());
      return null;
    }
    const data = await res.json();

    // Le nouveau router (contrairement à l'ancien api-inference) renvoie
    // directement l'embedding de phrase déjà poolé (tableau plat de 768
    // nombres) — plus besoin de mean pooling manuel token par token.
    let avg: number[];
    if (Array.isArray(data) && typeof data[0] === "number") {
      avg = data;
    } else if (Array.isArray(data[0]) && Array.isArray(data[0][0])) {
      const tokenEmbeddings: number[][] = data[0]; // shape [seq_len, 768]
      const dims = tokenEmbeddings[0].length;
      const pooled = new Array(dims).fill(0);
      for (const token of tokenEmbeddings) {
        for (let i = 0; i < dims; i++) pooled[i] += token[i];
      }
      avg = pooled.map((v) => v / tokenEmbeddings.length);
    } else if (Array.isArray(data[0]) && typeof data[0][0] === "number") {
      const tokenEmbeddings: number[][] = data; // déjà [seq_len, 768]
      const dims = tokenEmbeddings[0].length;
      const pooled = new Array(dims).fill(0);
      for (const token of tokenEmbeddings) {
        for (let i = 0; i < dims; i++) pooled[i] += token[i];
      }
      avg = pooled.map((v) => v / tokenEmbeddings.length);
    } else {
      console.error("embedText: forme de réponse HF inattendue", JSON.stringify(data).slice(0, 200));
      return null;
    }

    const norm = Math.sqrt(avg.reduce((s, v) => s + v * v, 0));
    return norm > 0 ? avg.map((v) => v / norm) : avg;
  } catch {
    return null;
  }
}
