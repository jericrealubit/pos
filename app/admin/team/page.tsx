import { requireAdmin, hasPremium } from "@/lib/dal"
import { getStaffForStore, getPendingInvites } from "@/lib/dal/staff"
import { TeamManager } from "@/components/team-manager"

export default async function TeamPage() {
  const profile = await requireAdmin()
  const isPremium = hasPremium(profile)

  const [staff, invites] = await Promise.all([getStaffForStore(), getPendingInvites()])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Team</h1>
      <TeamManager
        staff={staff}
        invites={invites}
        currentUserId={profile.id}
        isPremium={isPremium}
      />
    </div>
  )
}
