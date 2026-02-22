"use client";

import { JSX, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { useTheme } from "next-themes";
import { Bookmark, Home, LogIn, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListVideo, Search, Settings } from "lucide-react";
import { Alert } from "../others/alert";
import { useMutate } from "@/hooks/useMutate";
import { useUserStore } from "@/store/useUserStore";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export function SideBar(): JSX.Element {
  const { user, setUser } = useUserStore();
  const { setIsAuth } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data, error, loading, mutate } = useMutate();
  const { toggleSidebar } = useSidebar();
  const router = useRouter();

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
    { href: user ? "/" : "", icon: <Home />, label: "Home" },
    { href: user ? "/playlist" : "", icon: <ListVideo />, label: "PlayList" },
    { href: user ? "/watchlater" : "", icon: <Bookmark />, label: "Watch Later" },
    { href: user ? "/search" : "", icon: <Search />, label: "Search" },
  ];

  return (
    <Sidebar className="z-50">
      <SidebarHeader className="flex flex-row items-center mt-2 p-2 gap-10">
        <SidebarTrigger />
        <figure className="flex items-center justify-center gap-2">
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
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="p-0" />
        {links.map((link, i) => (
          <Link
            key={i}
            href={link.href}
            onClick={toggleSidebar}
            className={`flex items-center gap-3 p-1 mx-2 rounded-md hover:bg-accent transition-all ${!user ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <Button variant="secondary" size="icon">
              {link.icon}
            </Button>
            <p className="font-medium">{link.label}</p>
          </Link>
        ))}
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter className="mb-4">
        {!user ? (
          <Link href="/auth/login" onClick={toggleSidebar} className="flex items-center text-emerald-500 gap-3 cursor-pointer p-1 rounded-md hover:bg-accent transition-all">
            <Button variant="secondary" size="icon" className="text-emerald-600">
              <LogIn />
            </Button>
            <span>LogIn</span>
          </Link>
        ) : (
          <Alert
            trigger={
              <div className="flex items-center text-red-500 gap-3 cursor-pointer p-1 rounded-md hover:bg-accent transition-all">
                <Button variant="secondary" className="text-red-600" size="icon">
                  <LogOut />
                </Button>
                <span>Logout</span>
              </div>
            }
            title="Confirm Logout"
            description="Are you sure you want to log out? You&apos;ll need to sign in again to access your account."
            onContinue={logout}
            loading={loading}
          />
        )}
        <div className="flex items-center gap-3 cursor-pointer p-1 rounded-md hover:bg-accent transition-all">
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-full">
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="icon">
                  <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
                <span className="capitalize" suppressHydrationWarning>{theme}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}