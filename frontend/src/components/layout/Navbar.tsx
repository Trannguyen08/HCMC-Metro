"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
  ChevronDown,
  CircleUser,
  LogOut,
  Menu,
  Ticket,
  TrainFront
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/#uu-dai", label: "Ưu đãi" },
  { href: "/lo-trinh", label: "Tra cứu Lộ trình" },
  { href: "/tien-ich", label: "Tiện ích quanh Ga" },
  { href: "/ban-do-so", label: "Bản đồ số" }
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setOpenMobile(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition duration-300 ease-smooth",
        scrolled ? "bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60" : "bg-background"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl metro-gradient text-white shadow-sm">
            <TrainFront className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-heading text-sm font-extrabold tracking-tight sm:text-base">
              HCMC METRO
            </div>
            <div className="text-[11px] text-muted-foreground sm:text-xs">
              ĐƯỜNG SẮT ĐÔ THỊ (MRT)
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((l) => {
            const active = l.href !== "/#uu-dai" && pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "text-sm font-medium transition-colors duration-300 ease-smooth hover:text-foreground",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {!isAuthenticated ? (
            <>
              <Button variant="outline" asChild>
                <Link href="/login">Đăng nhập</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Đăng ký</Link>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>
                      {user?.name?.slice(0, 1)?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[140px] truncate text-sm">{user?.name}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="gap-2">
                    <CircleUser className="h-4 w-4" />
                    Hồ sơ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/lo-trinh" className="gap-2">
                    <Ticket className="h-4 w-4" />
                    Đặt vé
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-rose-600 focus:text-rose-600"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={() => setOpenMobile((v) => !v)}
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div
        className={cn(
          "lg:hidden overflow-hidden border-t bg-background transition-[max-height] duration-300 ease-smooth",
          openMobile ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors duration-300 ease-smooth hover:bg-accent",
                  pathname === l.href ? "bg-accent text-foreground" : "text-muted-foreground"
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            {!isAuthenticated ? (
              <>
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button className="flex-1" asChild>
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/profile">Hồ sơ</Link>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-rose-600"
                  onClick={logout}
                >
                  Đăng xuất
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

