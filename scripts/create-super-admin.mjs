// One-off admin utility: ensures a Supabase auth user with the given email
// exists (creating one if needed, or resetting the password on an existing
// one) and marks them as a super admin (counter.super_admins). Requires the
// service role key, since minting/managing auth users isn't something the
// anon-key app client can do.
//
// Usage:
//   node --env-file=.env.local scripts/create-super-admin.mjs <email> <password>

import { createClient } from "@supabase/supabase-js"

const [, , email, password] = process.argv

if (!email || !password) {
  console.error("Usage: node --env-file=.env.local scripts/create-super-admin.mjs <email> <password>")
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserByEmail(targetEmail) {
  let page = 1
  const perPage = 200
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const found = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase())
    if (found) return found
    if (data.users.length < perPage) return null
    page += 1
  }
}

let userId

const existing = await findUserByEmail(email)

if (existing) {
  const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  })
  if (updateError) {
    console.error("Failed to update existing user:", updateError.message)
    process.exit(1)
  }
  userId = updated.user.id
  console.log(`Existing user found, password updated: ${email} (${userId})`)
} else {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createError) {
    console.error("Failed to create user:", createError.message)
    process.exit(1)
  }
  userId = created.user.id
  console.log(`User created: ${email} (${userId})`)
}

const { error: insertError } = await supabase
  .schema("counter")
  .from("super_admins")
  .upsert({ id: userId })

if (insertError) {
  console.error("User ready, but failed to grant super admin:", insertError.message)
  process.exit(1)
}

console.log(`Super admin granted: ${email} (${userId})`)
