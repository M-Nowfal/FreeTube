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
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "sonner";
import { Loader } from "../ui/loader";
import { useUserStore } from "@/store/useUserStore";
import { useRouter } from "next/navigation";

type FormData = {
  username: string;
  password: string;
};

export function LoginForm({
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
  } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    await mutate("/auth/login", data);
  }

  useEffect(() => {
    if (error) toast.error(error.error);
    if (data && !error) {
      setUser(data.user);
      toast.success(data.message);
      router.replace("/");
    };
  }, [data, error]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Welcome back to FreeTube.</h1>
            <FieldDescription>
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" replace>
                Sign up
              </Link>
            </FieldDescription>
          </div>

          {/* Username */}
          <Field>
            <FieldLabel htmlFor="username">UserName</FieldLabel>
            <Input
              id="username"
              placeholder="User Name"
              {...register("username", {
                required: "Username is required",
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
            <Input
              id="password"
              type="password"
              placeholder="******"
              {...register("password", {
                required: "Password is required",
              })}
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
          </Field>

          {/* Submit */}
          <Field>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  Logging
                  <Loader className="ml-2 h-4 w-4" />
                </>
              ) : (
                "Login"
              )}
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
