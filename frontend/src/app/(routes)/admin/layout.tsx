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
  const { user, isAuthenticated, hasHydrated, logout } = useAuth();

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
      <aside className="fixed left-0 top-0 z-40 h-screen w-72 border-r bg-white text-slate-900 shadow-sm">
        <div className="flex h-full flex-col px-3 py-6">
          <Link href="/" className="mb-2 flex items-center px-4">
            <span className="font-heading text-xl font-black tracking-tighter text-primary">
              HCMC METRO ADMIN
            </span>
          </Link>
          
          <div className="mx-4 mb-6 mt-4 h-px w-12 bg-slate-200" />

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 shadow-none",
                    active
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-slate-600 hover:bg-slate-50 hover:text-primary",
                  )}
                >
                  <Icon
                    className={cn(
                      "mr-3 h-4 w-4",
                      active ? "text-white" : "text-slate-400 group-hover:text-primary",
                    )}
                  />
                  {item.label}
                  {active ? <ChevronRight className="ml-auto h-3 w-3 animate-in fade-in slide-in-from-left-1 text-white" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-slate-100 pt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center gap-2 border-primary/20 bg-white font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
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
