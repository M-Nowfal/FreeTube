"use client";

import { JSX } from "react";
import { Header } from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SideBar } from "@/components/layout/sidebar";
import { usePathname } from "next/navigation";
import BottomBar from "./bottom-bar";
import { useAuth } from "@/hooks/useAuth";

export function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  const pathname = usePathname();
  const { isAuth } = useAuth();

  const isShortsPage = pathname.startsWith("/shorts");
  const isAuthPage = pathname.startsWith("/auth");
  const showBottomBar = isAuth && !isAuthPage && !isShortsPage;
  const showSideBar = !isAuthPage && !isShortsPage;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        {!isAuthPage && !isShortsPage && <Header />}

        <div className="flex flex-1">
          {showSideBar && <SideBar />}
          <main className={`flex flex-col flex-1 ${showBottomBar ? "pb-12" : "pb-0"}`}>
            {children}
          </main>
        </div>

        {showBottomBar && <BottomBar />}
      </div>
    </SidebarProvider>
  );
}