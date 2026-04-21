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
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuth();

  React.useEffect(() => {
    if (!hasHydrated) return;

    if (isAuthenticated === false) {
      router.replace("/login");
    } else if (user && !user.is_admin) {
      router.replace("/");
    }
  }, [user, isAuthenticated, hasHydrated, router]);

  if (!hasHydrated) {
    return null;
  }

  if (!user || !user.is_admin) {
    return null;
  }

  const menuItems = [
    { href: "/admin", label: "Bảng điều khiển", icon: LayoutDashboard },
    { href: "/admin/users", label: "Người dùng", icon: Users },
    { href: "/admin/metro", label: "Hệ thống Metro", icon: Train },
    { href: "/admin/amenities", label: "Tiện ích", icon: Store },
    { href: "/admin/tickets", label: "Vé & Doanh thu", icon: Ticket },
    { href: "/admin/news", label: "Tin tức", icon: Newspaper },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="fixed left-0 top-0 z-40 h-screen w-72 border-r bg-metro-blue text-white">
        <div className="flex h-full flex-col px-3 py-4">
          <Link href="/" className="mb-8 flex items-center px-4">
            <span className="font-heading text-xl font-bold tracking-tighter text-white">
              HCMC METRO ADMIN
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
                      ? "bg-white/15 text-white"
                      : "text-white/85 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon
                    className={cn(
                      "mr-3 h-4 w-4",
                      active ? "text-white" : "text-white/80",
                    )}
                  />
                  {item.label}
                  {active ? <ChevronRight className="ml-auto h-3 w-3" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-white/15 pt-4">
            <Button
              type="button"
              className="w-full justify-start gap-2 bg-rose-600 text-white hover:bg-rose-700"
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 pl-72">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-5 backdrop-blur-md">
          <div className="font-medium">Hệ thống Quản trị HCMC Metro</div>
          <div className="ml-auto flex items-center gap-2">
            <div className="text-xs text-muted-foreground">Phiên bản 1.0.0-beta</div>
          </div>
        </header>
        <div className="px-5 py-5">{children}</div>
      </main>
    </div>
  );
}
