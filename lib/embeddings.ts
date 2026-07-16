// Embeddings via l'API Inference HuggingFace — même modèle que la Bibliothèque
// CohérenceLab (sentence-transformers/paraphrase-multilingual-mpnet-base-v2, 768 dims).
// Gratuit, multilingue, pas de clé Voyage/OpenAI nécessaire.
export async function embedText(texte: string): Promise<number[] | null> {
  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/paraphrase-multilingual-mpnet-base-v2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: texte, options: { wait_for_model: true } }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();

    let tokenEmbeddings: number[][];
    if (Array.isArray(data[0]) && Array.isArray(data[0][0])) {
      tokenEmbeddings = data[0]; // shape [seq_len, 768]
    } else if (Array.isArray(data[0]) && typeof data[0][0] === "number") {
      tokenEmbeddings = data; // déjà [seq_len, 768]
    } else {
      return null;
    }

    const dims = tokenEmbeddings[0].length;
    const pooled = new Array(dims).fill(0);
    for (const token of tokenEmbeddings) {
      for (let i = 0; i < dims; i++) pooled[i] += token[i];
    }
    const avg = pooled.map((v) => v / tokenEmbeddings.length);

    const norm = Math.sqrt(avg.reduce((s, v) => s + v * v, 0));
    return norm > 0 ? avg.map((v) => v / norm) : avg;
  } catch {
    return null;
  }
}
