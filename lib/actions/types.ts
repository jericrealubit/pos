export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false
      formError?: string
      fieldErrors?: Record<string, string[]>
      /**
       * Machine-readable error kind for cases the UI must handle specially.
       * "UPGRADE" — the action needs a premium subscription; the caller
       * should surface an upsell (link to /billing) rather than a plain error.
       */
      code?: "UPGRADE"
    }
