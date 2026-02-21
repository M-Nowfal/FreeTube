"use client";

import { Bookmark, Home, ListVideo, LogOut, Search, Settings } from "lucide-react";
import Image from "next/image";
import { JSX, useEffect } from "react";
import { SidebarTrigger } from "../ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "../ui/button";
import { ThemeToggle } from "../ui/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { Loader } from "../ui/loader";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert } from "../others/alert";
import { useMutate } from "@/hooks/useMutate";
import { toast } from "sonner";
import { useUserStore } from "@/store/useUserStore";

export function Header(): JSX.Element {
  const { isAuth, loading, setIsAuth } = useAuth();
  const { setUser } = useUserStore();
  const router = useRouter();
  const { data, error, mutate } = useMutate();

  useEffect(() => {
    if (data && !error) {
      setUser(null);
      setIsAuth(false);
      toast.success("Logged out successfully");
      router.replace("/");
    }
    if (error) {
      toast.error(error.error);
    }
  }, [data, error]);

  async function logout() {
    await mutate("/auth/logout");
  }

  const links = [
    { href: "/", icon: <Home size={20} />, label: "Home" },
    { href: "/playlist", icon: <ListVideo size={20} />, label: "PlayList" },
    { href: "/watchlater", icon: <Bookmark size={20} />, label: "Important" },
    { href: "/search", icon: <Search size={20} />, label: "Search" }
  ];

  return (
    <header className="p-2 w-full flex items-center justify-between sticky top-0 z-50 bg-background border-b dark:border-neutral-700">
      <div className="flex items-center gap-3">
        {isAuth && <SidebarTrigger className="mt-1 sm:hidden" />}

        <figure className="flex items-center gap-3">
          <Image
            src="/favicon.svg"
            alt="freetube"
            width={40}
            height={40}
            className="dark:invert"
          />
          <figcaption className="font-bold text-xl">
            FreeTube
          </figcaption>
        </figure>
      </div>

      <div className="flex items-center gap-5 xl:gap-8 text-lg font-medium">
        {isAuth &&
          <div className="hidden sm:flex items-center gap-5 xl:gap-8 text-lg font-medium">
            {links.map(link => (
              <Tooltip key={link.label}>
                <TooltipTrigger asChild>
                  <Link href={link.href} className="flex items-center gap-1 bg-accent p-2 md:py-1 md:px-3 rounded-full">
                    {link.icon} <span className="hidden md:inline-block text-sm">{link.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{link.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        }
      </div>

      <div className="flex items-center gap-5">
        {isAuth ? (
          <Alert
            trigger={
              <Button variant="secondary" className="not-sm:hidden bg-red-500/10 text-red-600 hover:bg-red-600/10">
                <LogOut />
                Logout
              </Button>
            }
            title="Confirm Logout"
            description="Are you sure you want to log out? You&apos;ll need to sign in again to access your account."
            onContinue={logout}
            loading={loading}
          />
        ) :
          (
            <Button variant="outline" onClick={() => router.push("/auth/login")} disabled={loading}>
              {loading ? <Loader /> : "Login"}
            </Button>
          )}
        <ThemeToggle />
      </div>
    </header>
  );
}
