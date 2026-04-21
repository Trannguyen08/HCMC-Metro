"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export function PageTransition({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("min-w-0", className)}>{children}</div>;
}
