"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useMutate } from "@/hooks/useMutate";
import { useEffect } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Loader } from "../ui/loader";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { data, loading, error, mutate } = useMutate();
  const { setUser } = useUserStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>();

  async function onSubmit(formData: FormData) {
    await mutate("/auth/register", formData);
  }

  useEffect(() => {
    if (error) toast.error(error);
    if (data && !error) {
      setUser(data.user);
      toast.success(data.message);
      router.replace("/");
    }
  }, [data, error]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">FreeTube Registration.</h1>
            <FieldDescription>
              Already have an account?{" "}
              <Link href="/auth/login" replace>
                Log in
              </Link>
            </FieldDescription>
          </div>

          {/* Username */}
          <Field>
            <FieldLabel htmlFor="username">UserName</FieldLabel>
            <Input
              id="username"
              placeholder="@username"
              {...register("username", {
                required: "Username is required",
                minLength: {
                  value: 3,
                  message: "Minimum 3 characters required",
                },
              })}
            />
            {errors.username && (
              <p className="text-xs text-red-500 mt-1">
                {errors.username.message}
              </p>
            )}
          </Field>

          {/* Email */}
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="example@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: "Enter a valid email address",
                },
              })}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </Field>

          {/* Password */}
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="******"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Minimum 6 characters required",
                },
              })}
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
          </Field>

          {/* Confirm Password */}
          <Field>
            <FieldLabel htmlFor="confirmPassword">
              Confirm Password
            </FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="******"
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === watch("password") ||
                  "Passwords do not match",
              })}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </Field>

          {/* Submit */}
          <Field>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating" : "Create Account"}
              {loading && <Loader className="ml-2 h-4 w-4" />}
            </Button>
          </Field>

          <FieldSeparator>Or</FieldSeparator>

          {/* Google */}
          <Field>
            <Button variant="outline" type="button" disabled>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="mr-2 h-4 w-4"
              >
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Continue with Google
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <a href="#">Terms of Service</a> and{" "}
        <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
