import { describe, it, expect, vi, beforeEach } from "vitest";
import type Stripe from "stripe";

// Le module route.ts crée son propre client Supabase et son propre client
// Stripe au chargement — on mocke les trois dépendances externes plutôt que
// de les injecter, pour tester la route telle qu'elle tourne réellement.
const { constructEventMock, creerCodeCadeauMock, maybeSingleMock, upsertMock } = vi.hoisted(() => ({
  constructEventMock: vi.fn(),
  creerCodeCadeauMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  upsertMock: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: { webhooks: { constructEvent: constructEventMock } },
}));

vi.mock("@/lib/codes-cadeau", () => ({
  creerCodeCadeau: creerCodeCadeauMock,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "codes_cadeau") {
        return { select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }) };
      }
      if (table === "abonnements") {
        return { upsert: upsertMock };
      }
      throw new Error(`Table inattendue dans le mock: ${table}`);
    }),
  })),
}));

const { POST } = await import("./route");

function requete(body: string) {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    body,
    headers: { "stripe-signature": "sig_test" },
  }) as unknown as Parameters<typeof POST>[0];
}

function sessionCompletedEvent(session: Partial<Stripe.Checkout.Session>): Stripe.Event {
  return {
    type: "checkout.session.completed",
    data: { object: { payment_status: "paid", ...session } },
  } as unknown as Stripe.Event;
}

beforeEach(() => {
  vi.clearAllMocks();
  upsertMock.mockResolvedValue({ error: null });
});

describe("POST /api/stripe/webhook", () => {
  it("rejette avec 400 si la signature est invalide, sans effet de bord", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("signature invalide");
    });

    const res = await POST(requete("{}"));

    expect(res.status).toBe(400);
    expect(creerCodeCadeauMock).not.toHaveBeenCalled();
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("ignore un paiement non confirmé (payment_status != paid)", async () => {
    constructEventMock.mockReturnValue(sessionCompletedEvent({ payment_status: "unpaid" }));

    const res = await POST(requete("{}"));

    expect(res.status).toBe(200);
    expect(creerCodeCadeauMock).not.toHaveBeenCalled();
    expect(upsertMock).not.toHaveBeenCalled();
  });

  describe("parcours cadeau", () => {
    const session = {
      id: "cs_test_cadeau_1",
      metadata: { type: "cadeau", destinataire_prenom: "Alice", offrant_nom: "Bob" },
    };

    it("crée le code cadeau au premier événement", async () => {
      constructEventMock.mockReturnValue(sessionCompletedEvent(session));
      maybeSingleMock.mockResolvedValue({ data: null });

      await POST(requete("{}"));

      expect(creerCodeCadeauMock).toHaveBeenCalledTimes(1);
      expect(creerCodeCadeauMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ stripe_session_id: "cs_test_cadeau_1" })
      );
    });

    it("ne recrée pas de code si l'événement est rejoué (idempotence)", async () => {
      constructEventMock.mockReturnValue(sessionCompletedEvent(session));
      // Un code existe déjà pour cette session — cas d'un webhook Stripe
      // renvoyé une deuxième fois pour le même paiement.
      maybeSingleMock.mockResolvedValue({ data: { id: "code-existant" } });

      const res = await POST(requete("{}"));

      expect(res.status).toBe(200);
      expect(creerCodeCadeauMock).not.toHaveBeenCalled();
    });
  });

  describe("parcours abonnement", () => {
    const session = { id: "cs_test_abo_1", client_reference_id: "user-123", customer: "cus_123" };

    it("active l'abonnement via upsert scopé sur user_id", async () => {
      constructEventMock.mockReturnValue(sessionCompletedEvent(session));

      await POST(requete("{}"));

      expect(upsertMock).toHaveBeenCalledTimes(1);
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: "user-123", status: "active" }),
        { onConflict: "user_id" }
      );
    });

    it("rejouer le même événement produit le même upsert, sans doublon ni erreur (idempotence)", async () => {
      constructEventMock.mockReturnValue(sessionCompletedEvent(session));

      await POST(requete("{}"));
      const res = await POST(requete("{}"));

      expect(res.status).toBe(200);
      expect(upsertMock).toHaveBeenCalledTimes(2);
      // `updated_at` varie légèrement entre les deux appels (new Date() à
      // chaque exécution, comportement voulu) — on vérifie séparément que
      // le reste de la charge utile et les options sont bien identiques.
      const [premierAppel, deuxiemeAppel] = upsertMock.mock.calls;
      for (const champ of ["user_id", "stripe_customer_id", "status"] as const) {
        expect(premierAppel[0][champ]).toBe(deuxiemeAppel[0][champ]);
      }
      expect(premierAppel[1]).toEqual(deuxiemeAppel[1]);
    });
  });
});
