import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import Seance from "../components/Seance"

export default async function SeancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/sign-in")

  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle()

  if (abonnement?.status !== "active") redirect("/parcours")

  return (
    <div className="min-h-screen bg-papier flex flex-col">
      <Seance />
    </div>
  )
}
