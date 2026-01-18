"use client";

import { Bookmark, History, Home, ListVideo, Search, Settings } from "lucide-react";
import Image from "next/image";
import { JSX, useState } from "react";
import { SidebarTrigger } from "../ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ThemeToggle } from "../ui/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { Loader } from "../ui/loader";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "../others/usermenu";

export function Header(): JSX.Element {
  const { isAuth, loading } = useAuth();
  const router = useRouter();
  const [input, setInput] = useState<string>("");

  const links = [
    { href: "/", icon: <Home size={20} />, label: "Home" },
    { href: "/playlist", icon: <ListVideo size={20} />, label: "PlayList" },
    { href: "/watchlater", icon: <Bookmark size={20} />, label: "Watch Later" },
    { href: "/history", icon: <History size={20} />, label: "History" },
    { href: "/settings", icon: <Settings size={20} />, label: "Settings" },
  ];

  return (
    <header className="p-2 w-full flex items-center justify-between sticky top-0 z-50 bg-background border-b dark:border-neutral-700">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="mt-1 md:hidden" />

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

      <div className="
        hidden w-[40%] max-w-2xl
        border border-input
        rounded-full
        md:flex items-center
        transition
        focus-within:ring-2
        focus-within:ring-ring
        focus-within:ring-offset-2
        focus-within:ring-offset-background
      ">
        <Input
          placeholder="Search"
          type="search"
          className="border-none shadow-none rounded-l-full py-5 focus-visible:ring-0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" className="rounded-r-full py-5" onClick={() => router.push(`/search?search=${input}`)}>
              <Search />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Search</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden md:flex items-center md:gap-5 xl:gap-8 text-lg font-medium">
          {isAuth ? (
            <>
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
            </>
          ) : (
            <Button variant="outline" onClick={() => router.push("/auth/login")} disabled={loading}>
              {loading ? <Loader /> : "Login"}
            </Button>
          )}
          
          <ThemeToggle />
        </div>

        <Tooltip>
          <TooltipTrigger asChild className="md:hidden">
            <Link href="/search">
              <Search />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Search</p>
          </TooltipContent>
        </Tooltip>

        <UserMenu />
      </div>
    </header>
  );
}
