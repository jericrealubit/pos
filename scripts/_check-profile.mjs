import { createClient } from "@supabase/supabase-js"
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: store } = await supabase.schema("counter").from("stores").select("id, name").limit(1).maybeSingle()
const { data: profiles } = await supabase.schema("counter").from("profiles").select("id, first_name, last_name, role, store_id").eq("store_id", store.id)

console.log("Store:", store)
console.log("Profiles:", profiles)

for (const p of profiles) {
  const { data, error } = await supabase.auth.admin.getUserById(p.id)
  if (error) {
    console.log(p.id, "-> error:", error.message)
  } else {
    console.log(p.id, "->", data.user.email, "confirmed:", !!data.user.email_confirmed_at)
  }
}
