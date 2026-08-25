import "server-only"

// Transactional email via Resend's raw HTTP API. We deliberately avoid the
// Node SDK: a plain fetch is the cleanest fit for the Cloudflare Workers
// runtime (nodejs_compat + global_fetch_strictly_public are already enabled),
// and it keeps the dependency surface small.

const RESEND_ENDPOINT = "https://api.resend.com/emails"

export type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  attachments?: { filename: string; content: string }[]
}

export type SendEmailResult = { ok: true; id?: string } | { ok: false; error: string }

function getEmailEnv(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  // Not configured is a normal state (e.g. local dev, or before jeric sets up
  // Resend). Callers must treat this as a soft failure, not an error — the
  // feature that triggered the email should still succeed.
  if (!apiKey || !from) return null
  return { apiKey, from }
}

export function isEmailConfigured(): boolean {
  return getEmailEnv() !== null
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const env = getEmailEnv()
  if (!env) return { ok: false, error: "email_not_configured" }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.apiKey}`,
        "Content-Type": "application/json",
        // Mandatory for direct HTTP calls — without it Resend returns 403 /
        // error 1010. The SDKs add this automatically.
        "User-Agent": "counter-pos",
      },
      body: JSON.stringify({
        from: env.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
        attachments: input.attachments,
      }),
    })

    if (!res.ok) {
      let message = `Resend responded ${res.status}`
      try {
        const body = (await res.json()) as { message?: string }
        if (body?.message) message = body.message
      } catch {
        // non-JSON error body — keep the status-code message
      }
      return { ok: false, error: message }
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string }
    return { ok: true, id: data.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "email_send_failed" }
  }
}
