"use client";

import { JSX, useEffect } from "react";
import {
  Dialog, DialogClose, DialogContent,
  DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
  DialogTrigger
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserStore } from "@/store/useUserStore";
import { LogOut } from "lucide-react"
import { useMutate } from "@/hooks/useMutate";
import { toast } from "sonner";
import { Alert } from "./alert";
import { Separator } from "../ui/separator";
import { useAuth } from "@/hooks/useAuth";

export function UserMenu(): JSX.Element | null {
  const { setIsAuth } = useAuth();
  const { user, setUser } = useUserStore();
  const { data, error, loading, mutate } = useMutate();

  useEffect(() => {
    if (data && !error) {
      setUser(null);
      setIsAuth(false);
      toast.success("Logged out successfully");
    }
    if (error) {
      toast.error(error);
    }
  }, [data, error]);

  async function logout() {
    await mutate("/auth/logout");
  }

  if (!user) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Avatar className="w-9 h-9 cursor-pointer">
          <AvatarImage src={user.profile} />
          <AvatarFallback>
            {user.username.charAt(1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DialogTrigger>

      <DialogContent 
        className="sm:max-w-sm bg-card" 
        showCloseButton={!loading}
        onInteractOutside={(e) => loading && e.preventDefault()}
      >
        <DialogHeader className="items-center text-center space-y-2">

          <Avatar className="w-20 h-20">
            <AvatarImage src={user.profile} />
            <AvatarFallback className="text-4xl font-bold">
              {user.username.charAt(1).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <DialogTitle className="text-xl">
            {user.username}
          </DialogTitle>

          <DialogDescription>
            {user.email}
          </DialogDescription>
        </DialogHeader>

        {/* User Stats */}
        <div className="grid grid-cols-2 gap-4 text-center mt-4">
          <div className="rounded-lg border p-3">
            <p className="text-lg font-semibold">{user.playlist.length}</p>
            <p className="text-xs text-muted-foreground">Playlists</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-lg font-semibold">{user.videos.length}</p>
            <p className="text-xs text-muted-foreground">Videos</p>
          </div>
        </div>

        <Separator className="my-3" />

        <DialogFooter>
          <DialogClose asChild disabled={loading}>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Alert
            trigger={
              <Button
                variant="destructive"
                className="gap-2"
                disabled={loading}
              >
                <LogOut className="size-4" />
                Logout
              </Button>
            }
            title="Confirm Logout"
            description="Are you sure you want to log out? You&apos;ll need to sign in again to access your account."
            onContinue={logout}
            loading={loading}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}