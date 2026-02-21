"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useMutate } from "@/hooks/useMutate";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Loader } from "../ui/loader";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { Eye, EyeOff } from "lucide-react"; // Import icons for the toggle

interface FormData {
  username: string;
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

  // 1. Add state to track password visibility
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setError, // 2. Extract setError from useForm
  } = useForm<FormData>();

  async function onSubmit(formData: FormData) {
    await mutate("/auth/register", formData);
  }

  useEffect(() => {
    if (error) {
      toast.error(error.error);
      if (error.status === 401) {
        // 3. Use setError instead of directly mutating the errors object
        setError("username", {
          type: "server",
          message: "UserName already exists"
        });
      }
    }

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
            <FieldLabel htmlFor="username">Create UserName</FieldLabel>
            <Input
              id="username"
              placeholder="User Name"
              {...register("username", {
                required: "Username is required",
                pattern: {
                  value: /^[a-zA-Z]+[0-9]*$/,
                  message: "Username must start with letters and end with numbers. No spaces or special characters.",
                },
                minLength: {
                  value: 3,
                  message: "Minimum 3 characters required",
                }
              })}
            />
            {errors.username && (
              <p className="text-xs text-red-500 mt-1">
                {errors.username.message}
              </p>
            )}
          </Field>

          {/* Password */}
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            {/* 4. Wrap Input in a relative div to position the icon */}
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"} // Toggle type
                placeholder="******"
                className="pr-10" // Add right padding so text doesn't hide behind icon
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Minimum 6 characters required",
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
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
                  value === getValues("password") ||
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