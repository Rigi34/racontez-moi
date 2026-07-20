import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("stripe_subscription_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (abonnement?.stripe_subscription_id && abonnement.status === "active") {
    await stripe.subscriptions.cancel(abonnement.stripe_subscription_id).catch((e) =>
      console.error("Annulation abonnement Stripe échouée lors de la suppression de compte:", e)
    );
  }

  // Toutes les tables (sessions, fragments, tours_conversation,
  // profil_narrateur, abonnements) référencent auth.users avec ON DELETE
  // CASCADE — supprimer le compte suffit à tout effacer.
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { error } = await serviceClient.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Suppression de compte échouée:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
