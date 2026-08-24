import Image from "next/image"
import { headers } from "next/headers"

import { RegisterForm } from "@/components/register-form"
import { isKnownCountry } from "@/lib/countries"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function RegisterPage() {
  // Cloudflare sets CF-IPCountry on every request at the edge, so the
  // common case needs no thought from the person signing up. It is only
  // a default — the select stays editable, which matters for anyone on
  // a VPN or setting a store up from another country.
  const detected = (await headers()).get("CF-IPCountry")
  const defaultCountry = isKnownCountry(detected) ? detected.toUpperCase() : ""

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <Image src="/logo-mark.png" alt="" width={40} height={40} className="mb-2" />
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Every sale is stamped with the name of the person at the till.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm defaultCountry={defaultCountry} />
      </CardContent>
    </Card>
  )
}
