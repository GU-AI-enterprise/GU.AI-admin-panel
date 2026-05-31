"use client";

import { useEffect, useState } from "react";
import {
  Users, UserCheck, Activity, ShieldAlert, TrendingUp,
  ShieldCheck, Zap, RefreshCw, AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface FashnCredits { total: number; subscription: number; onDemand: number; }

const stats = [
  { label: "Tổng người dùng",       value: "12,840", change: "+12.5%", icon: Users,       accent: "text-blue-600 bg-blue-50 ring-blue-100" },
  { label: "Người dùng hoạt động",  value: "8,421",  change: "+8.2%",  icon: UserCheck,   accent: "text-emerald-600 bg-emerald-50 ring-emerald-100" },
  { label: "Lượt truy cập hôm nay", value: "2,316",  change: "+18.4%", icon: Activity,    accent: "text-amber-600 bg-amber-50 ring-amber-100" },
  { label: "Báo cáo lỗi hệ thống",  value: "0",      change: "Ổn định", icon: ShieldAlert, accent: "text-rose-500 bg-rose-50 ring-rose-100" },
];

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

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Welcome banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-background to-rose-50/60 p-6 md:p-8">
        {/* Decorative lotus */}
        <div className="pointer-events-none absolute -right-4 -top-4 opacity-[0.06]">
          <Image src="/lotus.svg" alt="" width={180} height={180} />
        </div>
        <div className="relative max-w-lg space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            Hệ thống hoạt động ổn định
          </div>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            Chào mừng quay trở lại! 👋
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Đây là giao diện quản trị GU.AI. Bạn có thể giám sát tài khoản, cấp quyền và điều hành hệ thống từ đây.
          </p>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
              <div className={cn("rounded-xl p-2.5 ring-1", s.accent)}>
                <s.icon className="size-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-foreground">{s.value}</h3>
              <div className="mt-1 flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600">{s.change}</span>
                <span className="text-xs text-muted-foreground">so với tháng trước</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Fashn.ai Credits Card ── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-2.5 ring-1 ring-violet-100">
              <Zap className="size-4 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Fashn.ai Credits</h3>
              <p className="text-xs text-muted-foreground">Số dư tài khoản API virtual try-on</p>
            </div>
          </div>
          <button
            onClick={fetchCredits}
            disabled={creditsLoading}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3.5", creditsLoading && "animate-spin")} />
            Làm mới
          </button>
        </div>

        {creditsError ? (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/8 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {creditsError}
          </div>
        ) : creditsLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        ) : credits ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              <CreditBox value={credits.total}        label="Tổng cộng" accent="violet" />
              <CreditBox value={credits.subscription} label="Gói tháng"  accent="blue" />
              <CreditBox value={credits.onDemand}     label="Mua thêm"   accent="emerald" />
            </div>
            <div className="mt-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-primary transition-all duration-700"
                  style={{ width: `${Math.min((credits.subscription / Math.max(credits.total, 1)) * 100, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-right text-[11px] text-muted-foreground">
                {credits.total > 0 ? Math.round((credits.subscription / credits.total) * 100) : 0}% gói tháng
              </p>
            </div>
          </>
        ) : null}
      </div>

      {/* ── Quick Links + Activity ── */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Quick links */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Lối tắt thao tác nhanh</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Truy cập nhanh các phân hệ thiết yếu</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <QuickLink href="/dashboard/users"   icon={Users}      label="Danh sách User" />
            <QuickLink href="/dashboard/support" icon={Activity}   label="Hỗ trợ người dùng" />
            <QuickLink href="/dashboard/roles"   icon={ShieldCheck} label="Cấu hình Quyền" />
            <QuickLink href="/dashboard"         icon={Zap}        label="API & Credits" />
          </div>
        </div>

        {/* Activity log */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Nhật ký hệ thống</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Các hành động gần nhất</p>
          <div className="mt-4 space-y-3.5">
            {[
              { time: "15:30", text: "Khóa tài khoản bất thường", user: "haidang@example.com" },
              { time: "14:12", text: "Nâng cấp phân quyền cho", user: "quochuy@example.com", suffix: "lên Staff" },
              { time: "11:05", text: "Xuất báo cáo tháng 5/2026 dạng CSV" },
            ].map((log, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 font-mono text-xs text-muted-foreground pt-0.5">{log.time}</span>
                <p className="text-muted-foreground leading-relaxed">
                  {log.text}{" "}
                  {log.user && <span className="font-semibold text-foreground">{log.user}</span>}
                  {log.suffix && ` ${log.suffix}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CreditBox({ value, label, accent }: { value: number; label: string; accent: string }) {
  const styles: Record<string, string> = {
    violet:  "bg-violet-50 ring-violet-100 text-violet-700",
    blue:    "bg-blue-50 ring-blue-100 text-blue-700",
    emerald: "bg-emerald-50 ring-emerald-100 text-emerald-700",
  };
  const subStyles: Record<string, string> = {
    violet:  "text-violet-500",
    blue:    "text-blue-500",
    emerald: "text-emerald-500",
  };
  return (
    <div className={cn("rounded-xl p-4 text-center ring-1", styles[accent])}>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      <p className={cn("mt-1 text-xs font-medium", subStyles[accent])}>{label}</p>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background p-4 text-center text-xs font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/6 hover:text-primary"
    >
      <Icon className="size-5 transition-colors group-hover:text-primary" />
      {label}
    </Link>
  );
}
