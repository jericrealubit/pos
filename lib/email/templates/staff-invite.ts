// Staff invitation email. Kept as inline-styled HTML (email clients strip
// <style>/external CSS and don't share the app's Tailwind theme) with a
// plain-text fallback. Brand teal matches the app's default "tropical" theme.

type StaffInviteEmailInput = {
  storeName: string
  inviterName: string
  role: "ADMIN" | "CASHIER"
  joinUrl: string
  expiresAt: string
}

const BRAND = "#097c87"
const INK = "#111827"
const MUTED = "#6b7280"
const BORDER = "#e5e7eb"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function roleLabel(role: "ADMIN" | "CASHIER"): string {
  return role === "ADMIN" ? "an admin" : "a cashier"
}

export function staffInviteEmail(input: StaffInviteEmailInput): {
  subject: string
  html: string
  text: string
} {
  const { storeName, inviterName, role, joinUrl } = input
  const store = escapeHtml(storeName)
  const inviter = escapeHtml(inviterName)
  const expires = new Date(input.expiresAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const subject = `${inviterName} invited you to ${storeName} on Counter`

  const text = [
    `${inviterName} invited you to join ${storeName} as ${roleLabel(role)} on Counter.`,
    "",
    `Accept your invitation:`,
    joinUrl,
    "",
    `This link expires on ${expires}.`,
    `If you weren't expecting this, you can ignore this email.`,
  ].join("\n")

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px 8px;">
                <div style="font-size:13px;font-weight:600;letter-spacing:.04em;color:${BRAND};text-transform:uppercase;">Counter</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px;">
                <h1 style="margin:8px 0 4px;font-size:20px;line-height:1.3;color:${INK};">You've been invited to ${store}</h1>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${MUTED};">
                  ${inviter} invited you to join <strong style="color:${INK};">${store}</strong> as ${roleLabel(role)}.
                  Accept below to set up your account.
                </p>
                <a href="${joinUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:8px;">
                  Accept invitation
                </a>
                <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">
                  Or paste this link into your browser:<br />
                  <a href="${joinUrl}" style="color:${BRAND};word-break:break-all;">${escapeHtml(joinUrl)}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 24px;">
                <hr style="border:none;border-top:1px solid ${BORDER};margin:0 0 14px;" />
                <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">
                  This invitation expires on ${expires}. If you weren't expecting it, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject, html, text }
}
