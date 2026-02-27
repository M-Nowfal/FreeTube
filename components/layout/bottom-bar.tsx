"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListVideo, Bookmark, Search } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";

export default function BottomBar() {
  const pathname = usePathname();
  const { user } = useUserStore();

  // It is better to pass the Icon reference itself rather than the JSX <Icon />
  // This allows us to easily inject classes into it for the active state later!
  const links = [
    { href: user ? "/" : "/auth/login", icon: Home, label: "Home" },
    { href: user ? "/playlist" : "/auth/login", icon: ListVideo, label: "PlayList" },
    { href: user ? "/watchlater" : "/auth/login", icon: Bookmark, label: "Watch Later" },
    { href: user ? "/search" : "/auth/login", icon: Search, label: "Search" },
  ];

  // Optional: Hide the bottom bar if the user is on the login/signup screens
  if (pathname.startsWith("/auth")) return null;

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full h-12 bg-background border-t border-border flex items-center justify-around sm:hidden">
      {links.map((link) => {
        const Icon = link.icon;
        
        // Check if the current route matches the link
        const isActive = 
          pathname === link.href || 
          (link.href !== "/" && pathname.startsWith(link.href));

        return (
          <Link
            key={link.label}
            href={link.href}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              isActive 
                ? "text-foreground font-medium" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon 
              className={`h-5 w-5 transition-all ${
                isActive ? "" : "fill-transparent"
              }`} 
              strokeWidth={isActive ? 3 : 2} 
            />
            <span className="text-[10px]">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}