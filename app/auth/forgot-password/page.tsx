"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import axios from "axios";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error("Please enter your username");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/forgot-password", { username, email });
      setSubmitted(true);
      toast.success("If an account matches, a reset link has been sent!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-[90vh] flex-col items-center justify-center gap-6">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Enter your username and email to receive a password reset link.
          </p>
        </div>

        {submitted ? (
          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 dark:text-green-400 text-2xl">✓</span>
            </div>
            <h2 className="text-lg font-semibold mb-2">Check your email</h2>
            <p className="text-muted-foreground text-sm">
              If an account matches your credentials, a password reset link has been sent to your email address.
            </p>
            <Link href="/auth/login">
              <Button variant="link" className="mt-4">
                Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <FieldDescription className="mt-2">
                  Enter the email address associated with your account.
                </FieldDescription>
              </Field>

              <Field>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      Sending
                      <Loader className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        )}
      </div>
    </div>
  );
}
