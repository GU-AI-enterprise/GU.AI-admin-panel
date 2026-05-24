"use client";

import { Users, UserCheck, Activity, ShieldAlert, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const stats = [
    { label: "Tổng người dùng", value: "12,840", change: "+12.5%", trend: "up", icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400" },
    { label: "Người dùng hoạt động", value: "8,421", change: "+8.2%", trend: "up", icon: UserCheck, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400" },
    { label: "Lượng truy cập hôm nay", value: "2,316", change: "+18.4%", trend: "up", icon: Activity, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400" },
    { label: "Báo cáo lỗi hệ thống", value: "0", change: "Ổn định", trend: "stable", icon: ShieldAlert, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-8 text-white shadow-lg shadow-blue-600/10">
        <div className="max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            Hệ thống ổn định
          </div>
          <h2 className="text-2xl font-bold md:text-3xl">Chào mừng quay trở lại, Admin!</h2>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Đây là giao diện quản trị điều hành của GU.AI. Bạn có thể giám sát tất cả các tài khoản, cấp quyền và quản lý hệ thống thuận tiện nhất.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
              <div className={`rounded-xl p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-500">{stat.change}</span>
                <span className="text-xs text-slate-400">so với tháng trước</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation shortcuts */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lối tắt thao tác nhanh</h3>
          <p className="text-slate-500 text-sm mt-1">Truy cập nhanh các phân hệ thiết yếu</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Link href="/dashboard/users" className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 text-center hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800 dark:hover:text-white">
              <Users className="h-6 w-6 mb-2" />
              <span className="text-xs font-semibold">Danh sách User</span>
            </Link>
            <Link href="/dashboard/roles" className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 text-center hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800 dark:hover:text-white">
              <ShieldCheck className="h-6 w-6 mb-2" />
              <span className="text-xs font-semibold">Cấu hình Quyền</span>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nhật ký hệ thống</h3>
          <p className="text-slate-500 text-sm mt-1">Các hành động mới nhất của quản trị viên</p>
          <div className="space-y-3.5 mt-4">
            <div className="flex gap-3 text-sm">
              <span className="text-slate-400 font-medium shrink-0">15:30</span>
              <p className="text-slate-600 dark:text-slate-300">Khóa tài khoản hoạt động bất thường <span className="font-semibold text-slate-950 dark:text-white">haidang@example.com</span></p>
            </div>
            <div className="flex gap-3 text-sm">
              <span className="text-slate-400 font-medium shrink-0">14:12</span>
              <p className="text-slate-600 dark:text-slate-300">Nâng cấp phân quyền cho <span className="font-semibold text-slate-950 dark:text-white">quochuy@example.com</span> lên Manager</p>
            </div>
            <div className="flex gap-3 text-sm">
              <span className="text-slate-400 font-medium shrink-0">11:05</span>
              <p className="text-slate-600 dark:text-slate-300">Xuất báo cáo tài chính tháng 5/2026 dạng CSV</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
