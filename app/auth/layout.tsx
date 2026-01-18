"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { JSX } from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  const router = useRouter();

  return (
    <div>
      <header className="absolute p-2 w-full flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Button variant="none" onClick={() => router.back()}>
            <ArrowLeft strokeWidth={3} />
          </Button>
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
        <ThemeToggle />
      </header>
      {children}
    </div>
  );
}