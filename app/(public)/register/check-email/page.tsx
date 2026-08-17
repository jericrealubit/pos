import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"

export default async function CheckEmailPage(
  props: PageProps<"/register/check-email">
) {
  const { email } = await props.searchParams

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Check your email</CardTitle>
        <CardDescription>
          {email
            ? `We sent a confirmation link to ${email}.`
            : "We sent you a confirmation link."}{" "}
          Open it to finish creating your store.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="ghost"
          className="w-full gap-1.5"
          nativeButton={false}
          render={<Link href="/signin" />}
        >
          Back to sign in
          <LinkPendingIndicator />
        </Button>
      </CardContent>
    </Card>
  )
}
