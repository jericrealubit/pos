import Image from "next/image"

import { SigninForm } from "@/components/signin-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SigninPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Image src="/logo-mark.png" alt="" width={40} height={40} className="mb-2" />
          <CardTitle className="text-xl">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <SigninForm />
        </CardContent>
      </Card>
    </div>
  )
}
