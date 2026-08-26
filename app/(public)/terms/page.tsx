import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Privacy — Counter",
  description: "Terms of service and privacy policy for Counter, operated by WA AI Digital.",
}

export default function TermsPage() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-10 py-8">
      <div>
        <h1 className="text-3xl font-semibold">Terms & Privacy</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Counter is operated by WA AI Digital (ABN 85 436 177 620), an Australian business.
          These terms and this privacy policy apply to your use of Counter and the cpos.au
          website.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Terms of Service</h2>
        <div className="mt-4 flex flex-col gap-4 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">The service.</span> Counter is a point
            of sale and pay-later book for small retail stores: scanning and ringing up sales,
            tracking unpaid customer balances, and managing products, categories, and stock
            through an admin dashboard.
          </p>
          <p>
            <span className="font-medium text-foreground">Accounts.</span> You&apos;re
            responsible for keeping your account credentials secure and for the accuracy of the
            store, product, sale, and customer data you enter. Every sale is stamped with the
            name of the person signed in at the till, so accounts shouldn&apos;t be shared between
            staff.
          </p>
          <p>
            <span className="font-medium text-foreground">Acceptable use.</span> Counter is meant
            for legitimate retail sales and customer account tracking. Don&apos;t use it to record
            fraudulent transactions or to store data you don&apos;t have the right to hold.
          </p>
          <p>
            <span className="font-medium text-foreground">Free trial.</span> Every new store
            starts with a 90-day free trial. No payment details are required to begin it and
            nothing is charged during it. We&apos;ll contact you before it ends.
          </p>
          <p>
            <span className="font-medium text-foreground">Fees.</span> After the trial, Counter
            is charged per store, yearly or monthly, at the price shown on our{" "}
            <a href="/pricing" className="font-medium text-primary hover:text-primary/80">
              pricing page
            </a>{" "}
            for the country your store is registered in, in that country&apos;s currency. Prices
            are inclusive of GST where it applies. We&apos;ll always tell you the price before it
            applies, and give you at least 30 days&apos; notice in writing before changing what
            you pay for an existing store.
          </p>
          <p>
            <span className="font-medium text-foreground">Cancellation and refunds.</span> There
            is no lock-in contract and no cancellation fee. Monthly plans can be stopped at the
            end of any month; yearly plans run to the end of the period you paid for. Tell us you
            want to stop and we won&apos;t invoice you again. If you cancel a yearly plan within
            14 days of paying and haven&apos;t meaningfully used it in that period, we&apos;ll
            refund it in full. Beyond that we don&apos;t refund unused time, but you keep access
            until the period ends. Nothing here limits your rights under the Australian Consumer
            Law, the New Zealand Consumer Guarantees Act, or the equivalent consumer protections
            where you live.
          </p>
          <p>
            <span className="font-medium text-foreground">If you stop paying.</span> When a
            subscription lapses, your store drops to the Free plan — the till keeps ringing up
            sales, forever, at no cost. The only thing that pauses is starting{" "}
            <em>new</em> pay-later tabs and other Premium features like reports and emailed
            receipts; existing
            tabs stay readable and can still be settled. Your products, sales history and customer
            balances stay readable and exportable the whole time — we don&apos;t lock you out of
            your own records to collect payment. Contact us any time to switch Premium back on.
          </p>
          <p>
            <span className="font-medium text-foreground">Availability.</span> Counter is
            provided on a reasonable-efforts basis. As an early-stage product, we don&apos;t
            currently guarantee a specific uptime level, though we aim to keep disruption to a
            minimum.
          </p>
          <p>
            <span className="font-medium text-foreground">Termination.</span> You can stop using
            Counter at any time. We may suspend or terminate an account that breaches these
            terms. If you&apos;d like your data exported or deleted when you leave, get in touch
            and we&apos;ll arrange it.
          </p>
          <p>
            <span className="font-medium text-foreground">Liability.</span> To the extent
            permitted by law, WA AI Digital isn&apos;t liable for indirect or consequential
            losses arising from your use of Counter. Nothing here excludes any guarantee,
            warranty, or right you have under the Australian Consumer Law that can&apos;t
            lawfully be excluded.
          </p>
          <p>
            <span className="font-medium text-foreground">Governing law.</span> These terms are
            governed by the laws of Western Australia, Australia.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Privacy Policy</h2>
        <div className="mt-4 flex flex-col gap-4 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">What we collect.</span> Your account
            details (name, email) via Supabase Auth, and the store data you enter to run
            Counter — products, categories, sales, and the names and balances of your own
            customers. If you invite a staff member, we collect the email address you enter for
            them; if you email a receipt to a customer, we collect the address you send it to.
          </p>
          <p>
            <span className="font-medium text-foreground">How it&apos;s used.</span> Solely to
            provide the service: authenticating you, scoping every store&apos;s data to that store
            so it&apos;s never visible to another store on the platform, and sending the specific
            email you asked us to send (a staff invite or a receipt).
          </p>
          <p>
            <span className="font-medium text-foreground">Where it&apos;s stored.</span> In a
            Supabase-hosted Postgres database, with the application itself running on Cloudflare
            Workers. Emails (staff invites and receipts) are sent through Resend, which briefly
            processes the recipient&apos;s address and the email content on our behalf. We
            don&apos;t sell your data or your customers&apos; data to third parties.
          </p>
          <p>
            <span className="font-medium text-foreground">Your customers&apos; data.</span> If
            you use the pay-later book, you&apos;re responsible for the names and balances you
            record about your own customers — Counter stores that data on your behalf as the
            store operator.
          </p>
          <p>
            <span className="font-medium text-foreground">Cookies.</span> Counter uses a session
            cookie to keep you signed in. That&apos;s the only cookie use on the site.
          </p>
          <p>
            <span className="font-medium text-foreground">Deleting your data.</span> To close
            your account or request deletion of your data, contact us using the details below.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Contact</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Questions about these terms or your data can be sent to WA AI Digital by email at{" "}
          <a
            href="mailto:hello@waai.au"
            className="font-medium text-primary hover:text-primary/80"
          >
            hello@waai.au
          </a>{" "}
          or by phone/WhatsApp at{" "}
          <a
            href="tel:+61491098073"
            className="font-medium text-primary hover:text-primary/80"
          >
            +61 491 098 073
          </a>
          , or via{" "}
          <a
            href="https://www.linkedin.com/in/jericrealubit"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:text-primary/80"
          >
            LinkedIn
          </a>
          .
        </p>
      </div>
    </div>
  )
}
