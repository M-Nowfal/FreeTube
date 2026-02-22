"use client";

import { JSX } from "react";
import { Header } from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SideBar } from "@/components/layout/sidebar";
import { usePathname } from "next/navigation";
import BottomBar from "./bottom-bar";

export function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        {(pathname !== "/auth/login" && pathname !== "/auth/signup") && <Header />}
        <div className="flex flex-1">
          <SideBar />
          <main className="flex-1 pb-12">
            {children}
          </main>
        </div>
        {(pathname !== "/auth/login" && pathname !== "/auth/signup") && <BottomBar />}
      </div>
    </SidebarProvider>
  );
}