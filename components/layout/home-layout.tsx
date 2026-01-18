"use client";

import { JSX } from "react";
import { Header } from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SideBar } from "@/components/layout/sidebar";
import { usePathname } from "next/navigation";

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
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}