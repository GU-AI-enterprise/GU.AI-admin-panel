"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Users, LayoutDashboard, ShieldCheck, Headphones,
  LogOut, Bell, Menu, X, ChevronRight, TrendingUp
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSidebar, setSidebarOpen } from "@/features/ui/uiSlice";
import { cn } from "@/lib/utils";

const ALL_NAV_ITEMS = [
  { name: "Tổng quan",  href: "/dashboard",         icon: LayoutDashboard, adminOnly: false },
  { name: "Người dùng", href: "/dashboard/users",   icon: Users,           adminOnly: false },
  { name: "Báo cáo",    href: "/dashboard/reports", icon: TrendingUp,      adminOnly: false },
  { name: "Hỗ trợ",     href: "/dashboard/support", icon: Headphones,      adminOnly: false },
  { name: "Phân quyền", href: "/dashboard/roles",   icon: ShieldCheck,     adminOnly: false },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isAdmin, loading, signOut, userRole } = useAuth();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);

  useEffect(() => {
    if (!loading && (!session || !isAdmin)) router.replace("/login");
  }, [loading, session, isAdmin, router]);

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  if (loading || !session || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Image src="/lotus.svg" alt="GU.AI" width={40} height={40} className="animate-pulse opacity-60" />
          <div className="h-1 w-24 overflow-hidden rounded-full bg-border">
            <div className="h-full w-1/2 animate-[shimmer_1.4s_infinite] rounded-full bg-primary/40" />
          </div>
        </div>
      </div>
    );
  }

  const displayName =
    session.user.user_metadata?.full_name ||
    session.user.user_metadata?.name ||
    session.user.email?.split("@")[0] ||
    "Admin";
  const email = session.user.email || "";

  const isStrictAdmin = userRole === "admin";
  const navItems = ALL_NAV_ITEMS.filter((n) => !n.adminOnly || isStrictAdmin);
  const breadcrumb = ALL_NAV_ITEMS.find((n) => n.href === pathname)?.name ?? "Tổng quan";

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-[var(--sidebar)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b px-6 py-5" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Image src="/lotus.svg" alt="GU.AI" width={22} height={22} className="drop-shadow-sm" />
          </div>
          <div className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight text-foreground">GU.AI</span>
            <span className="block text-[11px] text-muted-foreground">Management Console</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Hệ thống
          </p>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => dispatch(setSidebarOpen(false))}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary/10 text-primary shadow-[inset_3px_0_0_var(--color-primary)]"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span>{item.name}</span>
                {active && <ChevronRight className="ml-auto size-3.5 text-primary/60" />}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t px-4 py-4" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
              {userRole}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/8 hover:text-destructive"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent md:hidden"
            >
              {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            {/* Mobile logo */}
            <div className="flex items-center gap-2 md:hidden">
              <Image src="/lotus.svg" alt="GU.AI" width={20} height={20} />
              <span className="font-bold text-foreground">GU.AI</span>
            </div>

            {/* Breadcrumb (desktop) */}
            <nav className="hidden items-center gap-1.5 text-sm md:flex">
              <span className="text-muted-foreground">Hệ thống</span>
              <ChevronRight className="size-3.5 text-muted-foreground/50" />
              <span className="font-semibold text-foreground">{breadcrumb}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
            </button>

            <div className="h-5 w-px bg-border" />

            {/* Admin pill */}
            <div className="hidden items-center gap-2.5 md:flex">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-foreground">{displayName}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
