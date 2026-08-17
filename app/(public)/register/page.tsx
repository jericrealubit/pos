import Image from "next/image"

import { RegisterForm } from "@/components/register-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function RegisterPage() {
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
        <RegisterForm />
      </CardContent>
    </Card>
  )
}
