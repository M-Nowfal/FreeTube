"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      setValidToken(true);
    } else {
      setValidToken(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword) {
      setError("Password is required");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", { token, newPassword });
      toast.success("Password reset successfully!");
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to reset password";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (validToken === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={40} />
      </div>
    );
  }

  if (validToken === false) {
    return (
      <div className="bg-card border rounded-lg p-6 text-center">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-600 dark:text-red-400 text-2xl">✕</span>
        </div>
        <h2 className="text-lg font-semibold mb-2">Invalid Reset Link</h2>
        <p className="text-muted-foreground text-sm mb-4">
          This password reset link is invalid or has expired.
        </p>
        <Link href="/auth/forgot-password">
          <Button>Request New Reset Link</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </Field>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <Field>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                Resetting Password
                <Loader className="ml-2 h-4 w-4" />
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="bg-background flex min-h-[90vh] flex-col items-center justify-center gap-6">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Enter your new password below.
          </p>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <Loader size={40} />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
