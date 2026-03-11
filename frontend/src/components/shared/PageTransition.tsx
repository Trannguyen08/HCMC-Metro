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
  const pathname = usePathname();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(false);
    const t = window.setTimeout(() => setVisible(true), 10);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return (
    <div
      className={cn(
        "transition-opacity duration-300 ease-smooth",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

