"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, isAuthenticated } = useAuth();
  
  // Tabs configuration with trailing slashes
  const tabs = [
    { href: "/profile/", label: "Thông tin cá nhân" },
    { href: "/profile/tickets/", label: "Lịch sử vé" },
    { href: "/profile/active-tickets/", label: "Vé đang hoạt động" },
    { href: "/profile/feedback/", label: "Góp ý & Khiếu nại" },
    { href: "/profile/security/", label: "Bảo mật" },
  ];

  if (!isAuthenticated) {
    return <div className="mx-auto max-w-2xl pt-10">{children}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-sm text-muted-foreground">Quản lý thông tin tài khoản và lịch sử giao dịch của bạn tại HCMC Metro.</p>
        </div>
        <Button variant="outline" onClick={logout}>
          Đăng xuất
        </Button>
      </div>

      <div className="space-y-6">
        <div className="w-full overflow-x-auto">
          <nav className="flex w-max min-w-full items-center gap-1 rounded-xl bg-metro-blue p-1.5 text-white/80 md:w-full md:justify-start">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  prefetch={true}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                    isActive
                      ? "bg-white !text-black shadow-md scale-[1.02]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}


