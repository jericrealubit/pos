import "server-only"

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib"

import type { ReceiptData } from "@/lib/receipt"
import { TENDER_LABEL } from "@/lib/receipt"
import { formatMoney } from "@/lib/money"

const PAGE_WIDTH = 320
const MARGIN = 24
const LINE = 16
const INK = rgb(0.07, 0.09, 0.15)
const MUTED = rgb(0.42, 0.45, 0.5)

// The footer is store-configurable free text (up to 200 chars), unlike the
// rest of the receipt's fixed-width labels — wrap it so a long custom
// message doesn't run off the edge of the (narrow, 320pt) receipt page.
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : [text]
}

// Rough line-count estimate to size the page up front — pdf-lib pages are
// fixed-height, so we compute this before drawing rather than growing the
// page as we go.
function estimateLines(receipt: ReceiptData, footerLineCount: number): number {
  let lines = 6 // store name, address?, phone?, receipt ref/date, customer/cashier, divider
  lines += receipt.items.length * 2
  lines += 2 // divider + subtotal-or-total
  if (receipt.discountCents > 0) lines += 2 // subtotal row + discount row (total row counted above)
  if (receipt.status === "PAID") lines += 1
  if (receipt.status === "UNPAID") lines += 1
  lines += 2 + footerLineCount // spacing + footer message
  return lines
}

export async function buildReceiptPdf(receipt: ReceiptData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const footerSize = 9
  const footerLines = wrapText(
    receipt.footerMessage || "Thanks for your business!",
    font,
    footerSize,
    PAGE_WIDTH - MARGIN * 2
  )

  const height = Math.max(300, estimateLines(receipt, footerLines.length) * LINE + MARGIN * 2)
  const page = pdfDoc.addPage([PAGE_WIDTH, height])

  let y = height - MARGIN
  const currency = receipt.store.currency

  function center(text: string, size: number, useFont: PDFFont, color = INK) {
    const width = useFont.widthOfTextAtSize(text, size)
    page.drawText(text, { x: (PAGE_WIDTH - width) / 2, y, size, font: useFont, color })
    y -= LINE
  }

  function row(left: string, right: string, useFont: PDFFont = font, color = INK, size = 10) {
    page.drawText(left, { x: MARGIN, y, size, font: useFont, color })
    const width = useFont.widthOfTextAtSize(right, size)
    page.drawText(right, { x: PAGE_WIDTH - MARGIN - width, y, size, font: useFont, color })
    y -= LINE
  }

  function divider() {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: MUTED,
      dashArray: [2, 2],
    })
    y -= LINE * 0.75
  }

  center(receipt.store.name, 13, bold)
  if (receipt.store.address) center(receipt.store.address, 8, font, MUTED)
  if (receipt.store.phone) center(receipt.store.phone, 8, font, MUTED)

  y -= LINE * 0.25
  row(`Receipt ${receipt.reference}`, new Date(receipt.createdAt).toLocaleString("en-US"), font, MUTED, 8)
  if (receipt.customerName || receipt.cashierName) {
    row(
      receipt.customerName ? `Customer: ${receipt.customerName}` : "",
      receipt.cashierName ? `Cashier: ${receipt.cashierName}` : "",
      font,
      MUTED,
      8
    )
  }

  y -= LINE * 0.25
  divider()

  for (const item of receipt.items) {
    const label = item.size ? `${item.name} · ${item.size}` : item.name
    row(label, formatMoney(item.unitPriceCents * item.quantity, currency))
    row(`${item.quantity} × ${formatMoney(item.unitPriceCents, currency)}`, "", font, MUTED, 8)
  }

  divider()

  if (receipt.discountCents > 0) {
    row("Subtotal", formatMoney(receipt.subtotalCents, currency), font, MUTED)
    // A plain ASCII hyphen, not the Unicode minus sign (−) used in the HTML
    // receipt views — pdf-lib's standard fonts use WinAnsi encoding, which
    // doesn't include U+2212.
    row("Discount", `- ${formatMoney(receipt.discountCents, currency)}`, font, MUTED)
  }
  row("Total", formatMoney(receipt.totalCents, currency), bold, INK, 12)

  if (receipt.status === "PAID") {
    const tenderLine =
      receipt.tenderedCents !== null
        ? `Tendered ${formatMoney(receipt.tenderedCents, currency)} · Change ${formatMoney(receipt.tenderedCents - receipt.totalCents, currency)}`
        : ""
    row(`Paid by ${TENDER_LABEL[receipt.tenderType]}`, tenderLine, font, MUTED, 8)
  }
  if (receipt.status === "UNPAID") {
    center("Added to account — not paid yet.", 8, font, MUTED)
  }

  y -= LINE * 0.5
  for (const line of footerLines) {
    center(line, footerSize, font, MUTED)
  }

  return pdfDoc.save()
}
