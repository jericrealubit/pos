"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CopyIcon, UserPlusIcon } from "lucide-react";

import {
  staffInviteCreate,
  staffInviteRevoke,
  staffRoleUpdate,
  staffSetDeactivated,
} from "@/app/actions/staff";
import { staffInviteSchema, type StaffInviteInput } from "@/lib/schemas/staff";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type StaffRow = {
  id: string;
  first_name: string;
  last_name: string;
  role: "OWNER" | "ADMIN" | "CASHIER";
  deactivated_at: string | null;
};

type PendingInvite = {
  id: string;
  email: string;
  role: "ADMIN" | "CASHIER";
  token: string;
  expires_at: string;
};

function StaffMemberRow({
  member,
  currentUserId,
}: {
  member: StaffRow;
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const isSelf = member.id === currentUserId;
  const isOwner = member.role === "OWNER";

  function changeRole(role: "ADMIN" | "CASHIER") {
    startTransition(async () => {
      const result = await staffRoleUpdate(member.id, role);
      if (!result.ok) {
        toast.add({
          title: result.formError ?? "Could not update role.",
          type: "error",
        });
      }
    });
  }

  function toggleDeactivated(active: boolean) {
    startTransition(async () => {
      const result = await staffSetDeactivated(member.id, !active);
      if (!result.ok) {
        toast.add({
          title: result.formError ?? "Could not update access.",
          type: "error",
        });
        return;
      }
      toast.add({
        title: active ? "Access restored" : "Access deactivated",
        type: "success",
      });
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0">
        <div className="truncate font-medium">
          {member.first_name} {member.last_name}
          {isSelf && (
            <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
          )}
        </div>
        {member.deactivated_at && (
          <Badge variant="destructive" className="mt-1">
            Deactivated
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isOwner ? (
          <Badge variant="secondary">Owner</Badge>
        ) : (
          <>
            <Select
              value={member.role}
              disabled={isPending}
              onValueChange={(v) => changeRole(v as "ADMIN" | "CASHIER")}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="CASHIER">Cashier</SelectItem>
              </SelectContent>
            </Select>
            {!isSelf && (
              <Switch
                checked={!member.deactivated_at}
                onCheckedChange={toggleDeactivated}
                disabled={isPending}
                aria-label={member.deactivated_at ? "Reactivate" : "Deactivate"}
              />
            )}
            {isPending && <Spinner className="size-3.5" />}
          </>
        )}
      </div>
    </div>
  );
}

function InviteRow({ invite }: { invite: PendingInvite }) {
  const [isPending, startTransition] = useTransition();

  function copyLink() {
    const url = `${window.location.origin}/join/${invite.token}`;
    navigator.clipboard.writeText(url);
    toast.add({ title: "Invite link copied", type: "success" });
  }

  function revoke() {
    startTransition(async () => {
      const result = await staffInviteRevoke(invite.id);
      if (!result.ok) {
        toast.add({
          title: result.formError ?? "Could not revoke the invite.",
          type: "error",
        });
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-3">
      <div className="min-w-0">
        <div className="truncate font-medium">{invite.email}</div>
        <div className="text-xs text-muted-foreground">
          {invite.role === "ADMIN" ? "Admin" : "Cashier"} · expires{" "}
          {/* Locale pinned (not the browser default) so server and client
              render identically — see lib/money.ts for the same rationale. */}
          {new Date(invite.expires_at).toLocaleDateString("en-US")}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={copyLink}
          className="gap-1"
        >
          <CopyIcon className="size-3.5" />
          Copy link
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={revoke}
        >
          Revoke
        </Button>
        {isPending && <Spinner className="size-3.5" />}
      </div>
    </div>
  );
}

function InviteForm() {
  const [isPending, startTransition] = useTransition();
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [emailed, setEmailed] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<StaffInviteInput>({
    resolver: zodResolver(staffInviteSchema),
    defaultValues: { email: "", role: "CASHIER" },
  });

  function onSubmit(values: StaffInviteInput) {
    setCreatedUrl(null);
    setEmailed(false);
    startTransition(async () => {
      const result = await staffInviteCreate(values);
      if (!result.ok) {
        toast.add({
          title: result.formError ?? "Could not create the invite.",
          type: "error",
        });
        return;
      }
      setCreatedUrl(result.data.joinUrl);
      setEmailed(result.data.emailed);
      toast.add({
        title: result.data.emailed
          ? `Invitation emailed to ${result.data.email}`
          : "Invite created",
        type: "success",
      });
      reset({ email: "", role: "CASHIER" });
    });
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm font-medium">Invite a teammate</div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <Field data-invalid={!!errors.email} className="flex-1">
          <FieldLabel htmlFor="inviteEmail">Email</FieldLabel>
          <FieldContent>
            <Input
              className="w-42"
              id="inviteEmail"
              type="email"
              placeholder="teammate@example.com"
              {...register("email")}
            />
            <FieldError errors={[errors.email]} />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel htmlFor="inviteRole">Role</FieldLabel>
          <FieldContent>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(String(v))}
                >
                  <SelectTrigger id="inviteRole" className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASHIER">Cashier</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FieldContent>
        </Field>
        <Button type="submit" loading={isPending} className="gap-1.5">
          {!isPending && <UserPlusIcon />}
          {isPending ? "Creating…" : "Create invite"}
        </Button>
      </form>

      {createdUrl && (
        <div className="mt-3 flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">
            {emailed
              ? "Emailed to your teammate. You can also share the link directly:"
              : "Email isn't configured — share this link with your teammate:"}
          </p>
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2 text-xs">
            <code className="min-w-0 flex-1 truncate">{createdUrl}</code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(createdUrl);
                toast.add({ title: "Invite link copied", type: "success" });
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TeamManager({
  staff,
  invites,
  currentUserId,
  isPremium,
}: {
  staff: StaffRow[];
  invites: PendingInvite[];
  currentUserId: string;
  isPremium: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">
          Active staff
        </h2>
        <div className="mt-2 flex flex-col gap-2">
          {staff.map((member) => (
            <StaffMemberRow
              key={member.id}
              member={member}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      </div>

      {isPremium ? (
        <>
          <InviteForm />
          {invites.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">
                Pending invites
              </h2>
              <div className="mt-2 flex flex-col gap-2">
                {invites.map((invite) => (
                  <InviteRow key={invite.id} invite={invite} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border p-6 text-center">
          <div className="text-sm font-medium">
            Staff accounts are a Premium feature
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Upgrade to invite ADMIN or CASHIER teammates to this store.
          </p>
          <Link href="/billing" className={cn(buttonVariants(), "mt-4")}>
            Upgrade to Premium
          </Link>
        </div>
      )}
    </div>
  );
}
