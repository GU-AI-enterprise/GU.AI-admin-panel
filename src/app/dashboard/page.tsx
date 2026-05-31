"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, Activity, ShieldAlert, Sparkles, TrendingUp, ShieldCheck, Zap, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface FashnCredits {
  total: number;
  subscription: number;
  onDemand: number;
}

export default function DashboardPage() {
  const { session } = useAuth();

  const [credits, setCredits] = useState<FashnCredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [creditsError, setCreditsError] = useState<string | null>(null);

  const fetchCredits = async () => {
    setCreditsLoading(true);
    setCreditsError(null);
    try {
      const res = await fetch(`${API_URL}/api/ai/credits`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      setCredits(json.data);
    } catch (err: any) {
      setCreditsError(err.message || "Không thể kết nối Fashn.ai");
    } finally {
      setCreditsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.access_token) fetchCredits();
  }, [session?.access_token]);

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

      {/* Fashn.ai Credits Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2.5 bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Fashn.ai Credits</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Số dư tài khoản API</p>
            </div>
          </div>
          <button
            onClick={fetchCredits}
            disabled={creditsLoading}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${creditsLoading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>

        {creditsError ? (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{creditsError}</span>
          </div>
        ) : creditsLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl bg-slate-100 dark:bg-slate-800 h-20 animate-pulse" />
            ))}
          </div>
        ) : credits ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-violet-50 dark:bg-violet-950/30 p-4 text-center">
              <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">{credits.total.toLocaleString()}</p>
              <p className="text-xs text-violet-500 dark:text-violet-400 mt-1 font-medium">Tổng cộng</p>
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-4 text-center">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{credits.subscription.toLocaleString()}</p>
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 font-medium">Gói tháng</p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{credits.onDemand.toLocaleString()}</p>
              <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1 font-medium">Mua thêm</p>
            </div>
          </div>
        ) : null}

        {credits && (
          <div className="mt-4 flex items-center gap-1.5">
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.min((credits.total / Math.max(credits.total + 100, 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
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
