"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { PasswordConfirmDialog } from "@/components/others/password-confirm-dialog";
import { useUserStore } from "@/store/useUserStore";

export default function SettingsPage() {
  const { isAuth, loading: authLoading } = useAuth();
  const router = useRouter();
  const { setUser } = useUserStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuth) {
      router.replace("/auth/login");
    }
  }, [authLoading, isAuth, router]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader size={50} />
      </div>
    );
  }

  if (!isAuth) {
    return null;
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword) {
      setError("Current password is required");
      return;
    }

    if (!newPassword) {
      setError("New password is required");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        "/api/auth/password",
        { currentPassword, newPassword },
        { withCredentials: true }
      );
      toast.success(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to change password";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignout = async (password: string) => {
    setSigningOut(true);
    try {
      const { data } = await axios.delete("/api/auth/signout", {
        data: { password },
        withCredentials: true,
      });
      setUser(null);
      toast.success(data.message || "Account deleted successfully");
      router.replace("/");
      window.location.reload();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to delete account";
      toast.error(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setSigningOut(false);
    }
  };

  const handleForgotPassword = async () => {
    setSendingReset(true);
    try {
      const { data } = await axios.post(
        "/api/auth/send-reset-link",
        {},
        { withCredentials: true }
      );
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send reset link");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="currentPassword" className="text-sm font-medium">
                Current Password
              </label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader className="mr-2 h-4 w-4" /> : null}
              Change Password
            </Button>

            <div className="flex items-center justify-center pt-2">
              <Button
                type="button"
                variant="link"
                onClick={handleForgotPassword}
                disabled={sendingReset}
                className="text-sm text-muted-foreground"
              >
                {sendingReset ? (
                  <>
                    <Loader className="mr-2 h-3 w-3" />
                    Sending...
                  </>
                ) : (
                  "Forgot Password? Send reset link to email"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6 border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordConfirmDialog
            trigger={
              <Button variant="destructive" className="w-full sm:w-auto">
                Delete Account
              </Button>
            }
            title="Delete Account"
            description="Are you sure you want to delete your account? All your data will be permanently deleted. This action cannot be undone."
            onConfirm={handleSignout}
            confirmText="Delete"
            loading={signingOut}
          />
        </CardContent>
      </Card>
    </div>
  );
}
