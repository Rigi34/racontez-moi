import { describe, it, expect, vi, beforeEach } from "vitest";

// Audit de clôture du 27/10/2026 (constats B-2 et I-2) : activation refusée
// pour un compte déjà payant ou un code remboursé ; échec d'écriture de
// l'abonnement signalé (500) et code remis en « paye ».
const { getUserMock, abonnementLuMock, activationMock, ligneExistanteMock, upsertMock, remiseEnPayeMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  abonnementLuMock: vi.fn(),
  activationMock: vi.fn(),
  ligneExistanteMock: vi.fn(),
  upsertMock: vi.fn(),
  remiseEnPayeMock: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({ auth: { getUser: getUserMock } })),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "abonnements") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: abonnementLuMock }) }),
          upsert: upsertMock,
        };
      }
      if (table === "codes_cadeau") {
        return {
          update: vi.fn((valeurs: { statut: string }) =>
            valeurs.statut === "active"
              ? { eq: () => ({ eq: () => ({ select: () => ({ maybeSingle: activationMock }) }) }) }
              : { eq: remiseEnPayeMock }
          ),
          select: () => ({ eq: () => ({ maybeSingle: ligneExistanteMock }) }),
        };
      }
      throw new Error(`Table inattendue dans le mock: ${table}`);
    }),
  })),
}));

const { POST } = await import("./route");

function requete(code = "abcd-efgh") {
  return new Request("http://localhost/api/cadeau/activer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code }),
  }) as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  abonnementLuMock.mockResolvedValue({ data: null, error: null });
  activationMock.mockResolvedValue({ data: { id: "code-1" }, error: null });
  upsertMock.mockResolvedValue({ error: null });
  remiseEnPayeMock.mockResolvedValue({ error: null });
});

describe("POST /api/cadeau/activer", () => {
  it("active le code et ouvre l'accès", async () => {
    const res = await POST(requete());

    expect(res.status).toBe(200);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", stripe_customer_id: "cadeau:ABCD-EFGH", status: "active" }),
      { onConflict: "user_id" }
    );
  });

  it("refuse un compte qui a déjà le Parcours, sans consommer le code", async () => {
    abonnementLuMock.mockResolvedValue({ data: { status: "active" }, error: null });

    const res = await POST(requete());

    expect(res.status).toBe(409);
    expect(activationMock).not.toHaveBeenCalled();
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("refuse un code remboursé avec un message dédié", async () => {
    activationMock.mockResolvedValue({ data: null, error: null });
    ligneExistanteMock.mockResolvedValue({ data: { statut: "rembourse" } });

    const res = await POST(requete());

    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/remboursé/);
  });

  it("répond 500 et remet le code en « paye » si l'abonnement n'a pas pu être écrit", async () => {
    upsertMock.mockResolvedValue({ error: { message: "connexion perdue" } });

    const res = await POST(requete());

    expect(res.status).toBe(500);
    expect(remiseEnPayeMock).toHaveBeenCalledWith("id", "code-1");
  });
});
