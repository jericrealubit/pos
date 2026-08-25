"use server"

import { requireStore, hasPremium, getProfile } from "@/lib/dal"
import { getSaleWithItems } from "@/lib/dal/sales"
import { buildReceiptData } from "@/lib/receipt"
import { buildReceiptPdf } from "@/lib/receipt-pdf"
import { sendEmail } from "@/lib/email/send"
import { receiptEmail } from "@/lib/email/templates/receipt"
import { emailReceiptSchema, type EmailReceiptInput } from "@/lib/schemas/receipt"
import type { ActionResult } from "@/lib/actions/types"

export async function emailReceipt(saleId: string, input: EmailReceiptInput): Promise<ActionResult> {
  const profile = await requireStore()
  // Emailing a receipt is the gated action — the till itself (and printing/
  // downloading your own receipt) stays free forever, same seam as the
  // pay-later book. Return a friendly upsell rather than redirecting, since
  // this runs from a dialog the cashier is mid-flow in.
  if (!hasPremium(profile)) {
    return { ok: false, code: "UPGRADE", formError: "Emailing receipts is a Premium feature." }
  }

  const parsed = emailReceiptSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const [sale, receiptProfile] = await Promise.all([getSaleWithItems(saleId), getProfile()])
  if (!sale || !receiptProfile) {
    return { ok: false, formError: "Could not find that sale." }
  }

  const receipt = buildReceiptData(sale, receiptProfile)
  const pdfBytes = await buildReceiptPdf(receipt)
  const { subject, html, text } = receiptEmail(receipt)

  const result = await sendEmail({
    to: parsed.data.email,
    subject,
    html,
    text,
    attachments: [
      {
        filename: `receipt-${receipt.reference}.pdf`,
        content: Buffer.from(pdfBytes).toString("base64"),
      },
    ],
  })

  if (!result.ok) {
    // Unlike the staff-invite email (best-effort, with a copy-link fallback
    // already on screen), sending the email IS the entire point of this
    // action — a failed/unconfigured send must surface as a real error.
    return {
      ok: false,
      formError:
        result.error === "email_not_configured"
          ? "Email isn't configured for this store yet."
          : "Could not send the receipt. Try again.",
    }
  }

  return { ok: true, data: undefined }
}
