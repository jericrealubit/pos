"use client"

import { useTransition } from "react"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { DataList } from "@/components/data-list"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { Spinner } from "@/components/ui/spinner"
import { storeSetPaused } from "@/app/actions/super-admin"
import type { SuperAdminStoreRow } from "@/lib/dal/super-admin"

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
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
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
