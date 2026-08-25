// Receipt e-mail. Same inline-styled table-card convention as
// staff-invite.ts (email clients strip <style>/external CSS). No CTA button
// here — the receipt itself is the PDF attachment, not a link to follow.

import type { ReceiptData } from "@/lib/receipt"
import { TENDER_LABEL } from "@/lib/receipt"
import { formatMoney } from "@/lib/money"

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

export function receiptEmail(receipt: ReceiptData): { subject: string; html: string; text: string } {
  const storeName = escapeHtml(receipt.store.name)
  const currency = receipt.store.currency
  const itemCount = receipt.items.reduce((sum, item) => sum + item.quantity, 0)
  const date = new Date(receipt.createdAt).toLocaleString("en-US")

  const subject = `Your receipt from ${receipt.store.name} — ${formatMoney(receipt.totalCents, currency)}`

  const text = [
    `Thanks for shopping at ${receipt.store.name}!`,
    "",
    `Receipt ${receipt.reference} · ${date}`,
    `${itemCount} item${itemCount === 1 ? "" : "s"} · Total ${formatMoney(receipt.totalCents, currency)}`,
    receipt.status === "PAID" ? `Paid by ${TENDER_LABEL[receipt.tenderType]}` : "Added to account — not paid yet.",
    "",
    "Your itemized receipt is attached as a PDF.",
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
                <div style="font-size:13px;font-weight:600;letter-spacing:.04em;color:${BRAND};text-transform:uppercase;">${storeName}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px;">
                <h1 style="margin:8px 0 4px;font-size:20px;line-height:1.3;color:${INK};">Thanks for shopping with us!</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${MUTED};">
                  Receipt ${escapeHtml(receipt.reference)} · ${escapeHtml(date)}
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px dashed ${BORDER};border-bottom:1px dashed ${BORDER};padding:12px 0;margin-bottom:16px;">
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:${MUTED};">
                      ${itemCount} item${itemCount === 1 ? "" : "s"}
                    </td>
                    <td style="padding:4px 0;font-size:14px;color:${INK};text-align:right;font-weight:600;">
                      ${formatMoney(receipt.totalCents, currency)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:${MUTED};">
                      ${
                        receipt.status === "PAID"
                          ? `Paid by ${TENDER_LABEL[receipt.tenderType]}`
                          : "Added to account — not paid yet"
                      }
                    </td>
                    <td></td>
                  </tr>
                </table>
                <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:${MUTED};">
                  Your itemized receipt is attached as a PDF.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 24px;">
                <hr style="border:none;border-top:1px solid ${BORDER};margin:0 0 14px;" />
                <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">
                  If you weren't expecting this receipt, you can safely ignore this email.
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
