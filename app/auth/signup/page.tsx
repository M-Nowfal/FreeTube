import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
  return (
    <div className="bg-background flex min-h-[90vh] flex-col items-center justify-center gap-6">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  )
}
