"use client"

import { useTransition } from "react"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { DataList } from "@/components/data-list"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { Spinner } from "@/components/ui/spinner"
import { storeSetPaused, storeExtendBilling } from "@/app/actions/super-admin"
import type { SuperAdminStoreRow } from "@/lib/dal/super-admin"
import { getBillingState } from "@/lib/billing"
import { Button } from "@/components/ui/button"

function PauseToggle({ store }: { store: SuperAdminStoreRow }) {
  const [isPending, startTransition] = useTransition()

  function toggle(checked: boolean) {
    startTransition(async () => {
      const result = await storeSetPaused(store.store_id, !checked)
      if (!result.ok) {
        toast.add({ title: result.formError ?? "Could not update the store.", type: "error" })
        return
      }
      toast.add({
        title: checked ? `${store.store_name} access resumed` : `${store.store_name} access paused`,
        type: "success",
      })
    })
  }

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Switch
        checked={!store.is_paused}
        onCheckedChange={toggle}
        disabled={isPending}
        aria-label={store.is_paused ? "Resume access" : "Pause access"}
      />
      {isPending && <Spinner className="size-3.5" />}
      <Badge variant={store.is_paused ? "destructive" : "outline"}>
        {store.is_paused ? "Paused" : "Active"}
      </Badge>
    </div>
  )
}

/**
 * The billing system in v1: what each store owes and when, and a
 * one-click way to record that they paid. Sort by this column to see
 * who needs chasing this week.
 */
function BillingCell({ store }: { store: SuperAdminStoreRow }) {
  const [isPending, startTransition] = useTransition()
  const { tier, daysRemaining, inGrace } = getBillingState(store)

  function extend(interval: "1 month" | "1 year") {
    startTransition(async () => {
      const note = window.prompt(
        `Payment note for ${store.store_name} (how it was paid, reference):`,
        store.billing_note ?? ""
      )
      // Cancelling the prompt cancels the extension — this writes money
      // state, so an accidental click shouldn't go through.
      if (note === null) return

      const result = await storeExtendBilling(store.store_id, interval, note)
      if (!result.ok) {
        toast.add({ title: result.formError ?? "Could not extend the store.", type: "error" })
        return
      }
      toast.add({
        title: `${store.store_name} paid until ${new Date(result.data.paidUntil).toLocaleDateString("en-US")}`,
        type: "success",
      })
    })
  }

  // A Free store isn't "lapsed/broken" under freemium — it's a valid,
  // working tier — so it gets a neutral badge, not the destructive one.
  const label = tier === "FREE" ? "Free" : inGrace ? "In grace" : `${daysRemaining}d`
  const tierLabel = tier === "TRIAL" ? "Trial" : tier === "PREMIUM" ? "Premium" : "Free"

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Badge variant={tier === "FREE" ? "secondary" : inGrace ? "outline" : "secondary"}>
        {tierLabel}
        {tier !== "FREE" && ` · ${label}`}
      </Badge>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => extend("1 month")}>
        +1m
      </Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => extend("1 year")}>
        +1y
      </Button>
      {isPending && <Spinner className="size-3.5" />}
    </div>
  )
}

export function StoresDataList({ stores }: { stores: SuperAdminStoreRow[] }) {
  const columns: LegacyColumnDef<SuperAdminStoreRow>[] = [
    {
      id: "store_name",
      accessorFn: (s) => s.store_name,
      header: "Store",
      cell: ({ row }) => row.original.store_name,
    },
    {
      id: "owner",
      accessorFn: (s) => `${s.owner_first_name ?? ""} ${s.owner_last_name ?? ""}`.trim(),
      header: "Owner",
      cell: ({ row }) =>
        `${row.original.owner_first_name ?? ""} ${row.original.owner_last_name ?? ""}`.trim() || "—",
    },
    {
      id: "owner_email",
      accessorFn: (s) => s.owner_email ?? "",
      header: "Email",
      cell: ({ row }) => row.original.owner_email ?? "—",
    },
    {
      id: "created_at",
      accessorFn: (s) => s.created_at,
      header: "Created",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("en-US"),
    },
    {
      id: "billing",
      accessorFn: (s) => getBillingState(s).daysRemaining,
      header: "Billing",
      cell: ({ row }) => <BillingCell store={row.original} />,
    },
    {
      id: "country",
      accessorFn: (s) => s.country ?? "",
      header: "Country",
      cell: ({ row }) => row.original.country ?? "—",
    },
    {
      id: "status",
      accessorFn: (s) => (s.is_paused ? "paused" : "active"),
      header: "Access",
      cell: ({ row }) => <PauseToggle store={row.original} />,
    },
  ]

  return (
    <DataList
      columns={columns}
      data={stores}
      searchKeys={["store_name", "owner_first_name", "owner_last_name", "owner_email"]}
      getRowId={(s) => s.store_id}
      renderCard={(s) => (
        <div key={s.store_id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="min-w-0">
            <div className="truncate font-medium">{s.store_name}</div>
            <div className="truncate text-sm text-muted-foreground">
              {`${s.owner_first_name ?? ""} ${s.owner_last_name ?? ""}`.trim() || "—"}
            </div>
            <div className="truncate text-sm text-muted-foreground">{s.owner_email ?? "—"}</div>
            <div className="mt-2">
              <BillingCell store={s} />
            </div>
          </div>
          <PauseToggle store={s} />
        </div>
      )}
      emptyState={
        <div className="p-8 text-center text-sm text-muted-foreground">No stores yet.</div>
      }
    />
  )
}
