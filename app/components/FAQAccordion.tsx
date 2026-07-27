"use client";

import { useState } from "react";

type Item = { question: string; reponse: string };

export default function FAQAccordion({ items }: { items: Item[] }) {
  const [ouvert, setOuvert] = useState<number | null>(null);

  return (
    <div className="divide-y divide-grege/30">
      {items.map((item, i) => {
        const estOuvert = ouvert === i;
        return (
          <div key={item.question}>
            <button
              onClick={() => setOuvert(estOuvert ? null : i)}
              aria-expanded={estOuvert}
              className="w-full flex items-center justify-between gap-4 py-5 text-left font-display text-lg text-encre hover:text-petrole transition-colors"
            >
              <span>{item.question}</span>
              <span className="font-sans text-xl text-grege shrink-0" aria-hidden="true">
                {estOuvert ? "−" : "+"}
              </span>
            </button>
            {estOuvert && (
              <p className="pb-5 font-serif text-base leading-relaxed text-encre/80">{item.reponse}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
