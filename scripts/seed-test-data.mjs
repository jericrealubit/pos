// One-off test-data seeder: creates 5 categories, 10 products (2 per
// category), 2 test customers, and 5 sales (2 PAID, 3 UNPAID) for the
// first store/admin found. Uses the service role key to bypass RLS,
// since counter.create_sale requires a real cashier session that a
// standalone script doesn't have — this mirrors that function's own
// insert logic (see supabase/migrations/0006_create_sale.sql) directly
// against the tables instead.
//
// Usage:
//   node --env-file=.env.local scripts/seed-test-data.mjs

import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
}).schema("counter")

function fail(label, error) {
  console.error(`${label}:`, error.message)
  process.exit(1)
}

const { data: store, error: storeError } = await supabase
  .from("stores")
  .select("id, name")
  .limit(1)
  .maybeSingle()
if (storeError) fail("Could not look up a store", storeError)
if (!store) {
  console.error("No store found. Sign up and create a store/admin account in the app first.")
  process.exit(1)
}

const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("id")
  .eq("store_id", store.id)
  .limit(1)
  .maybeSingle()
if (profileError) fail("Could not look up a cashier profile", profileError)
if (!profile) {
  console.error("No profile found for the store. Create an admin/cashier account in the app first.")
  process.exit(1)
}

console.log(`Seeding into store "${store.name}" (${store.id})`)

const categoryNames = ["Beverages", "Snacks", "Dairy", "Household", "Personal Care"]

const { data: categories, error: categoryError } = await supabase
  .from("categories")
  .upsert(
    categoryNames.map((name) => ({ store_id: store.id, name })),
    { onConflict: "store_id,name" }
  )
  .select("id, name")
if (categoryError) fail("Could not upsert categories", categoryError)

const categoryIdByName = Object.fromEntries(categories.map((c) => [c.name, c.id]))

const productDefs = [
  { name: "Cola 1.5L", size: "1.5 L", price_cents: 189, barcode: "SEED-BEV-001", category: "Beverages" },
  { name: "Orange Juice 1L", size: "1 L", price_cents: 249, barcode: "SEED-BEV-002", category: "Beverages" },
  { name: "Potato Chips", size: "150 g", price_cents: 299, barcode: "SEED-SNK-001", category: "Snacks" },
  { name: "Chocolate Bar", size: "50 g", price_cents: 149, barcode: "SEED-SNK-002", category: "Snacks" },
  { name: "Whole Milk", size: "1 L", price_cents: 219, barcode: "SEED-DAI-001", category: "Dairy" },
  { name: "Cheddar Cheese", size: "200 g", price_cents: 399, barcode: "SEED-DAI-002", category: "Dairy" },
  { name: "Dish Soap", size: "500 ml", price_cents: 329, barcode: "SEED-HOU-001", category: "Household" },
  { name: "Paper Towels", size: "2 pk", price_cents: 449, barcode: "SEED-HOU-002", category: "Household" },
  { name: "Toothpaste", size: "100 ml", price_cents: 279, barcode: "SEED-PER-001", category: "Personal Care" },
  { name: "Shampoo", size: "400 ml", price_cents: 599, barcode: "SEED-PER-002", category: "Personal Care" },
]

const { data: products, error: productError } = await supabase
  .from("products")
  .upsert(
    productDefs.map(({ category, ...p }) => ({
      store_id: store.id,
      name: p.name,
      size: p.size,
      price_cents: p.price_cents,
      barcode: p.barcode,
      category_id: categoryIdByName[category],
    })),
    { onConflict: "store_id,barcode" }
  )
  .select("id, name, size, price_cents, barcode")
if (productError) fail("Could not upsert products", productError)

const productByBarcode = Object.fromEntries(products.map((p) => [p.barcode, p]))

const customerNames = ["Test Customer A", "Test Customer B"]
const customers = []
for (const name of customerNames) {
  const { data: existing, error: findError } = await supabase
    .from("customers")
    .select("id, name")
    .eq("store_id", store.id)
    .eq("name", name)
    .maybeSingle()
  if (findError) fail(`Could not look up customer "${name}"`, findError)

  if (existing) {
    customers.push(existing)
    continue
  }

  const { data: created, error: createError } = await supabase
    .from("customers")
    .insert({ store_id: store.id, name })
    .select("id, name")
    .single()
  if (createError) fail(`Could not create customer "${name}"`, createError)
  customers.push(created)
}

async function insertSale({ status, customerId, lines }) {
  const items = lines.map(({ barcode, quantity }) => ({
    product: productByBarcode[barcode],
    quantity,
  }))
  const subtotalCents = items.reduce((sum, { product, quantity }) => sum + product.price_cents * quantity, 0)

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      store_id: store.id,
      cashier_id: profile.id,
      customer_id: customerId,
      status,
      subtotal_cents: subtotalCents,
    })
    .select("id")
    .single()
  if (saleError) fail("Could not insert sale", saleError)

  const { error: itemsError } = await supabase.from("sale_items").insert(
    items.map(({ product, quantity }) => ({
      sale_id: sale.id,
      product_id: product.id,
      name_snapshot: product.name,
      size_snapshot: product.size,
      unit_price_cents: product.price_cents,
      quantity,
    }))
  )
  if (itemsError) fail("Could not insert sale items", itemsError)

  return sale.id
}

const sales = [
  { status: "PAID", customerId: null, lines: [{ barcode: "SEED-BEV-001", quantity: 2 }, { barcode: "SEED-SNK-001", quantity: 1 }] },
  { status: "PAID", customerId: null, lines: [{ barcode: "SEED-DAI-001", quantity: 1 }] },
  { status: "UNPAID", customerId: customers[0].id, lines: [{ barcode: "SEED-HOU-001", quantity: 1 }, { barcode: "SEED-PER-001", quantity: 1 }] },
  { status: "UNPAID", customerId: customers[1].id, lines: [{ barcode: "SEED-SNK-002", quantity: 3 }] },
  { status: "UNPAID", customerId: customers[0].id, lines: [{ barcode: "SEED-PER-002", quantity: 1 }, { barcode: "SEED-DAI-002", quantity: 2 }] },
]

const saleIds = []
for (const sale of sales) {
  saleIds.push(await insertSale(sale))
}

console.log(`Created/updated ${categories.length} categories, ${products.length} products, ${customers.length} customers.`)
console.log(`Created ${saleIds.length} sales (2 PAID, 3 UNPAID): ${saleIds.join(", ")}`)
