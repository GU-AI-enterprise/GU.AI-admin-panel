"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users,
  LayoutDashboard,
  ShieldCheck,
  Headphones,
  Settings,
  LogOut,
  Bell,
  Sparkles,
  Menu,
  X
} from "lucide-react";

interface UserInfo {
  name: string;
  email: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<UserInfo | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const userStr = localStorage.getItem("admin_user");
    if (!token || !userStr) {
      router.replace("/login");
    } else {
      setAdmin(JSON.parse(userStr));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.replace("/login");
  };

  const navItems = [
    { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
    { name: "Quản lý Người dùng", href: "/dashboard/users", icon: Users },
    { name: "Hỗ trợ người dùng", href: "/dashboard/support", icon: Headphones },
    { name: "Phân quyền & Vai trò", href: "/dashboard/roles", icon: ShieldCheck },
  ];

  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Mobile Topbar */}
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
            G
          </div>
          <span className="font-bold">GU.AI Panel</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      <div className="flex">
        {/* Sidebar desktop */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white p-6 transition-transform duration-300 md:static md:translate-x-0 dark:border-slate-800 dark:bg-slate-900 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="flex flex-col h-full justify-between">
            <div>
              {/* Logo */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-6 dark:border-slate-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black shadow-md shadow-blue-500/10">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-900 dark:text-white leading-tight">GU.AI</h1>
                  <span className="text-xs text-slate-400">Management Console</span>
                </div>
              </div>

              {/* Nav menu */}
              <nav className="mt-8 space-y-1">
                <span className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Hệ thống
                </span>
                <div className="space-y-1.5 mt-2">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                          isActive
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`} />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>

            {/* User Profile & Logout */}
            <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
              <div className="flex items-center gap-3 px-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {admin.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">{admin.name}</p>
                  <p className="text-xs text-slate-400 truncate">{admin.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-all"
              >
                <LogOut className="h-5 w-5" />
                Đăng xuất
              </button>
            </div>
          </div>
        </aside>

        {/* Content wrapper */}
        <div className="flex-1 min-h-screen flex flex-col overflow-x-hidden">
          {/* Header */}
          <header className="hidden h-16 items-center justify-between border-b border-slate-200 bg-white px-8 md:flex dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Hệ thống</span>
              <span>/</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {pathname === "/dashboard" ? "Tổng quan" : pathname === "/dashboard/users" ? "Quản lý Người dùng" : pathname === "/dashboard/support" ? "Hỗ trợ người dùng" : "Phân quyền"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-600"></span>
              </button>
              <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{admin.name}</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  Admin
                </span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
