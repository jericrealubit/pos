import { getStoresForSuperAdmin, signupsByWeek } from "@/lib/dal/super-admin"
import { StoresDataList } from "@/components/stores-data-list"
import { getBillingState } from "@/lib/billing"

export default async function SuperAdminPage() {
  const stores = await getStoresForSuperAdmin()
  const weeks = signupsByWeek(stores, 6)

  // A Free store is a valid, working tier under freemium — not "lapsed" or
  // broken — so it's tracked as its own count rather than folded into an
  // alarm-coloured "lapsed" KPI.
  const premium = stores.filter((s) => getBillingState(s).tier === "PREMIUM").length
  const trialing = stores.filter((s) => getBillingState(s).tier === "TRIAL").length
  const free = stores.filter((s) => getBillingState(s).tier === "FREE").length
  const dueSoon = stores.filter((s) => {
    const { premiumActive, daysRemaining } = getBillingState(s)
    return premiumActive && daysRemaining <= 14
  }).length

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-5">
        <div className="rounded-lg border p-4">
          <div className="text-xs text-muted-foreground">Stores</div>
          <div className="mt-1 text-2xl font-semibold">{stores.length}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-xs text-muted-foreground">Premium</div>
          <div className="mt-1 text-2xl font-semibold">{premium}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-xs text-muted-foreground">Trialing</div>
          <div className="mt-1 text-2xl font-semibold">{trialing}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-xs text-muted-foreground">Free</div>
          <div className="mt-1 text-2xl font-semibold">{free}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-xs text-muted-foreground">Due within 14 days</div>
          <div className="mt-1 text-2xl font-semibold">{dueSoon}</div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium">Signups by week</h2>
        {weeks.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No signups yet.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-1">
            {weeks.map((week) => (
              <div
                key={week.weekStart}
                className="flex items-baseline justify-between gap-3 rounded-md border px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">
                  week of {new Date(week.weekStart).toLocaleDateString()}
                </span>
                <span className="flex items-baseline gap-3">
                  <span className="text-xs text-muted-foreground">
                    {Object.entries(week.byCountry)
                      .sort((a, b) => b[1] - a[1])
                      .map(([country, n]) => `${country} ${n}`)
                      .join(" · ")}
                  </span>
                  <span className="font-medium">{week.total}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-xl font-semibold">Stores</h1>
        <div className="mt-4">
          <StoresDataList stores={stores} />
        </div>
      </div>
    </div>
  )
}
