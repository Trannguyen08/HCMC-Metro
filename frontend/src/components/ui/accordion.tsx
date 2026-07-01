"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextType {
  openValue?: string;
  toggleValue: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextType | undefined>(undefined);

export function Accordion({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  type?: "single";
  collapsible?: boolean;
}) {
  const [openValue, setOpenValue] = React.useState<string | undefined>();

  const toggleValue = (value: string) => {
    setOpenValue((prev) => (prev === value ? undefined : value));
  };

  return (
    <AccordionContext.Provider value={{ openValue, toggleValue }}>
      <div className={cn("w-full space-y-1", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  children,
  value,
  className,
}: {
  children: React.ReactNode;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-slate-200 last:border-0", className)} data-value={value}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { value });
        }
        return child;
      })}
    </div>
  );
}

export function AccordionTrigger({
  children,
  className,
  value, // passed down from Item
}: {
  children: React.ReactNode;
  className?: string;
  value?: string;
}) {
  const context = React.useContext(AccordionContext);
  const isOpen = context?.openValue === value;

  return (
    <button
      onClick={() => value && context?.toggleValue(value)}
      className={cn(
        "flex w-full items-center justify-between py-4 text-left font-medium transition-all hover:text-metro-blue",
        className
      )}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
    </button>
  );
}

export function AccordionContent({
  children,
  className,
  value, // passed down from Item
}: {
  children: React.ReactNode;
  className?: string;
  value?: string;
}) {
  const context = React.useContext(AccordionContext);
  const isOpen = context?.openValue === value;

  if (!isOpen) return null;

  return (
    <div className={cn("overflow-hidden text-sm transition-all pb-4 animate-in fade-in slide-in-from-top-1", className)}>
      {children}
    </div>
  );
}
