import { Suspense } from "react"
import Image from "next/image"

import { SigninForm } from "@/components/signin-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function SigninFormFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  )
}

export default function SigninPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <Image src="/logo-mark.png" alt="" width={40} height={40} className="mb-2" />
        <CardTitle className="text-xl">Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<SigninFormFallback />}>
          <SigninForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
