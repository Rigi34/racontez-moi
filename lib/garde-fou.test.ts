import { describe, it, expect } from "vitest";
import { estMessageSansSouvenir, estRelanceHorsCadre, relanceSure, RELANCE_NEUTRE } from "./garde-fou";

describe("estMessageSansSouvenir", () => {
  it("repère le message réel du 12/11/2026", () => {
    expect(
      estMessageSansSouvenir(
        "Il n'y a pas assez de matière narrative partagée pour composer un fragment de mémoire — aucun souvenir, lieu, sensation ou moment concret n'a encore été évoqué.\n\nDès que vous me confierez un premier détail — une image, une époque, une scène — je pourrai commencer à écrire."
      )
    ).toBe(true);
  });
  it("repère le signal convenu", () => {
    expect(estMessageSansSouvenir("MATIERE_INSUFFISANTE")).toBe(true);
    expect(estMessageSansSouvenir("  [MATIERE_INSUFFISANTE]\n")).toBe(true);
  });
  it("laisse passer un vrai souvenir", () => {
    expect(
      estMessageSansSouvenir(
        "Le sous-sol sentait le béton humide et l'ombre froide, mais les grandes ouvertures laissaient entrer une lumière naturelle. Je n'avais pas assez de mots, enfant, pour dire ce que j'y ressentais."
      )
    ).toBe(false);
  });
  it("laisse passer un souvenir qui parle d'écrire", () => {
    expect(estMessageSansSouvenir("Ma mère m'avait appris à écrire sur la table de la cuisine, à la lumière de la lampe.")).toBe(false);
  });
});

describe("estRelanceHorsCadre", () => {
  it("repère la relance réelle du 12/11/2026", () => {
    expect(
      estRelanceHorsCadre(
        "Je comprends. Je suis prêt à recevoir votre réponse à la question précédente. Pourriez-vous me la rappeler pour que je formule ma relance avec justesse ?"
      )
    ).toBe(true);
  });
  it("repère une demande de répéter", () => {
    expect(estRelanceHorsCadre("Pourriez-vous répéter, s'il vous plaît ?")).toBe(true);
    expect(estRelanceHorsCadre("Je n'ai pas bien compris votre réponse.")).toBe(true);
  });
  it("laisse passer une vraie relance sensorielle", () => {
    expect(estRelanceHorsCadre("Quelle odeur flottait dans ce garage quand vous y jouiez ?")).toBe(false);
    expect(estRelanceHorsCadre("Vous rappelez-vous la couleur des volets ?")).toBe(false);
  });
  it("relanceSure remplace seulement les relances hors cadre", () => {
    expect(relanceSure("Pourriez-vous me la rappeler ?")).toBe(RELANCE_NEUTRE);
    expect(relanceSure("Quel bruit faisait la porte ?")).toBe("Quel bruit faisait la porte ?");
    expect(relanceSure("")).toBe(RELANCE_NEUTRE);
  });
});

// Test réel de Régis, 19/11/2026 : acquiescement avant une bonne question.
describe("relanceSure — préambule", () => {
  const reelle =
    "Entendu. Je suis prêt à vous écouter simplement, sans surcharger. Pouvez-vous me parler d'un moment heureux de votre enfance — un lieu, une personne, une activité qui vous revient clairement ?";

  it("retire l'acquiescement et garde la vraie question", () => {
    expect(relanceSure(reelle)).toBe(
      "Pouvez-vous me parler d'un moment heureux de votre enfance — un lieu, une personne, une activité qui vous revient clairement ?"
    );
  });

  it("remplace par la relance neutre s'il ne reste rien d'utile", () => {
    expect(relanceSure("Entendu. Je suis prêt à vous écouter.")).toBe(RELANCE_NEUTRE);
  });

  it("ne touche pas une relance sans préambule", () => {
    expect(relanceSure("Quelle lumière entrait par la fenêtre de la cuisine ?")).toBe(
      "Quelle lumière entrait par la fenêtre de la cuisine ?"
    );
  });

  it("garde une phrase de récit qui commence par « Bien »", () => {
    const t = "Bien des années plus tard, vous êtes revenu dans cette maison. Qu'avez-vous ressenti en franchissant la porte ?";
    expect(relanceSure(t)).toBe(t);
  });

  it("garde la proposition d'en rester là (question nucléaire)", () => {
    const t = "On peut aussi en rester là pour aujourd'hui, si vous préférez. Sinon, quel visage vous revient ?";
    expect(relanceSure(t)).toBe(t);
  });
});
