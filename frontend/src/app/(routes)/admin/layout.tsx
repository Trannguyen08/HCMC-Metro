"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Store,
  Ticket,
  Train,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/use-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated === false) {
      router.replace("/login");
    } else if (user && !user.is_admin) {
      router.replace("/");
    }
  }, [user, isAuthenticated, router]);

  if (!user || !user.is_admin) {
    return null;
  }

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Nguoi dung", icon: Users },
    { href: "/admin/metro", label: "He thong Metro", icon: Train },
    { href: "/admin/amenities", label: "Amenity", icon: Store },
    { href: "/admin/tickets", label: "Ve va Doanh thu", icon: Ticket },
    { href: "/admin/news", label: "Tin tuc", icon: Newspaper },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
        <div className="flex h-full flex-col px-3 py-4">
          <Link href="/" className="mb-8 flex items-center px-4">
            <span className="font-heading text-xl font-bold tracking-tighter text-metro-blue">
              METRO ADMIN
            </span>
          </Link>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-metro-blue/10 text-metro-blue"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon
                    className={cn(
                      "mr-3 h-4 w-4",
                      active ? "text-metro-blue" : "text-muted-foreground",
                    )}
                  />
                  {item.label}
                  {active ? <ChevronRight className="ml-auto h-3 w-3" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t pt-4">
            <Link
              href="/"
              className="group flex items-center rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Quay lai client
            </Link>
          </div>
        </div>
      </aside>

      <main className="flex-1 pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-md">
          <div className="font-medium">He thong Quan tri HCMC Metro</div>
          <div className="ml-auto flex items-center gap-2">
            <div className="text-xs text-muted-foreground">Phien ban 1.0.0-beta</div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
