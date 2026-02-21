"use client";

import { Bookmark, Home, ListVideo, Search, Settings } from "lucide-react";
import Image from "next/image";
import { JSX } from "react";
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

export function Header(): JSX.Element {
  const { isAuth, loading } = useAuth();
  const router = useRouter();

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

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-5 xl:gap-8 text-lg font-medium">
          {isAuth ? (
            <div className="hidden sm:flex items-center gap-5 xl:gap-8 text-lg font-medium">
              {links.map(link => (
                <Tooltip key={link.label}>
                  <TooltipTrigger asChild>
                    <Link href={link.href}>
                      {link.icon}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{link.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : (
            <Button variant="outline" onClick={() => router.push("/auth/login")} disabled={loading}>
              {loading ? <Loader /> : "Login"}
            </Button>
          )}
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
