"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function PageTransition({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={cn(
        "transition-opacity duration-500 ease-out",
        mounted ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

