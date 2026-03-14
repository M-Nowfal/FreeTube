import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-[90vh] flex-col items-center justify-center gap-6">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
