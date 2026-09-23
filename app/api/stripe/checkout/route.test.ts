import { describe, it, expect, vi, beforeEach } from "vitest";

const { getUserMock, sessionsCreateMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  sessionsCreateMock: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
  })),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: { checkout: { sessions: { create: sessionsCreateMock } } },
}));

const { POST } = await import("./route");

function requete() {
  return new Request("http://localhost/api/stripe/checkout", {
    method: "POST",
    headers: { origin: "http://localhost:3100" },
  }) as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionsCreateMock.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test_xyz" });
});

describe("POST /api/stripe/checkout", () => {
  it("refuse sans authentification, sans appeler Stripe", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const res = await POST(requete());

    expect(res.status).toBe(401);
    expect(sessionsCreateMock).not.toHaveBeenCalled();
  });

  it("crée la session en mode payment avec customer_creation always et client_reference_id", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-123", email: "narrateur@example.com" } } });

    await POST(requete());

    expect(sessionsCreateMock).toHaveBeenCalledTimes(1);
    expect(sessionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        customer_creation: "always",
        client_reference_id: "user-123",
      })
    );
  });

  it("inclut customer_email quand l'utilisateur en a un", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-123", email: "narrateur@example.com" } } });

    await POST(requete());

    expect(sessionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ customer_email: "narrateur@example.com" })
    );
  });

  it("n'envoie pas customer_email quand l'utilisateur n'en a pas (compte anonyme non converti)", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-123", email: undefined } } });

    await POST(requete());

    const payload = sessionsCreateMock.mock.calls[0][0];
    expect(payload).not.toHaveProperty("customer_email");
  });

  it("retourne l'URL de la session Stripe", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-123", email: "narrateur@example.com" } } });

    const res = await POST(requete());
    const body = await res.json();

    expect(body).toEqual({ url: "https://checkout.stripe.com/c/pay/cs_test_xyz" });
  });
});
