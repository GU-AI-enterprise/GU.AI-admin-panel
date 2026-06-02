"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Users, Activity, ShieldCheck, Zap, RefreshCw,
  AlertCircle, CheckCircle2, XCircle, Clock, Wifi, WifiOff,
  ChevronDown, CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const SOCKET_URL = API_URL.replace(/\/api$/, "");

interface FashnCredits { total: number; subscription: number; onDemand: number; }

interface AdminEvent {
  id: string;
  type: "job_created" | "job_completed" | "job_failed" | "user_action" | "system";
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

interface DayStats {
  total: number;
  job_created: number;
  job_completed: number;
  job_failed: number;
}

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const LIMIT = 20;

export default function DashboardPage() {
  const { session } = useAuth();

  // Credits
  const [credits, setCredits] = useState<FashnCredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [creditsError, setCreditsError] = useState<string | null>(null);

  // Event log
  const [selectedDate, setSelectedDate] = useState<string>(todayLocal());
  const [events, setEvents]         = useState<AdminEvent[]>([]);
  const [stats, setStats]           = useState<DayStats>({ total: 0, job_created: 0, job_completed: 0, job_failed: 0 });
  const [hasMore, setHasMore]       = useState(false);
  const [offset, setOffset]         = useState(0);
  const [logLoading, setLogLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Socket
  const [connected, setConnected]   = useState(false);
  const socketRef                   = useRef<Socket | null>(null);

  // ── Credits ────────────────────────────────────────────────────────────────

  const fetchCredits = useCallback(async () => {
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
  }, [session?.access_token]);

  useEffect(() => { if (session?.access_token) fetchCredits(); }, [fetchCredits]);

  // ── Event log fetch ────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async (date: string, newOffset: number, append: boolean) => {
    if (!session?.access_token) return;
    if (append) setLoadingMore(true); else setLogLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/events?date=${date}&limit=${LIMIT}&offset=${newOffset}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const json = await res.json();
      const result = json.data;
      if (append) {
        setEvents(prev => [...prev, ...(result.events ?? [])]);
      } else {
        setEvents(result.events ?? []);
      }
      setStats(result.stats ?? { total: 0, job_created: 0, job_completed: 0, job_failed: 0 });
      setHasMore(result.hasMore ?? false);
      setOffset(newOffset + (result.events?.length ?? 0));
    } catch {
      // silent
    } finally {
      setLogLoading(false);
      setLoadingMore(false);
    }
  }, [session?.access_token]);

  // Fetch when date changes
  useEffect(() => {
    setOffset(0);
    fetchEvents(selectedDate, 0, false);
  }, [selectedDate, fetchEvents]);

  // ── Socket.IO realtime ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!session?.access_token) return;

    const socket = io(SOCKET_URL, {
      auth: { token: session.access_token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect",    () => { setConnected(true); socket.emit("join-admin"); });
    socket.on("disconnect", () => setConnected(false));

    socket.on("admin_event", (event: AdminEvent) => {
      // Only prepend to list if it belongs to the selected date
      const evDate = event.timestamp.slice(0, 10);
      if (evDate === selectedDate) {
        setEvents(prev => [event, ...prev]);
        setStats(prev => ({
          ...prev,
          total: prev.total + 1,
          [event.type]: (prev[event.type as keyof DayStats] as number) + 1,
        }));
      }
    });

    return () => { socket.disconnect(); socketRef.current = null; setConnected(false); };
  }, [session?.access_token, selectedDate]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const isToday = selectedDate === todayLocal();

  return (
    <div className="h-[calc(100vh-5rem)] flex gap-5 animate-fade-in">

      {/* ── LEFT: Event Log (70%) ── */}
      <div className="flex-1 min-w-0 rounded-xl border border-border bg-card flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0 gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-foreground">Nhật ký hệ thống</h2>
            {connected ? (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <Wifi className="size-2.5" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
                <WifiOff className="size-2.5" /> Offline
              </span>
            )}
          </div>

          {/* Date picker */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <CalendarDays className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                max={todayLocal()}
                onChange={e => setSelectedDate(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:border-primary focus:outline-none cursor-pointer"
              />
            </div>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(todayLocal())}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
              >
                Hôm nay
              </button>
            )}
            <button
              onClick={() => { setOffset(0); fetchEvents(selectedDate, 0, false); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <RefreshCw className={cn("size-3.5", logLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Stats bar for selected day */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-b border-border/60 bg-muted/20 shrink-0">
          <span className="text-[11px] text-muted-foreground">
            {isToday ? "Hôm nay" : new Date(selectedDate + "T12:00:00").toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
            {" · "}<span className="font-medium text-foreground">{stats.total} sự kiện</span>
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <StatChip value={stats.job_created}   label="Tạo mới"    color="text-blue-600"    dot="bg-blue-500" />
            <StatChip value={stats.job_completed} label="Thành công" color="text-emerald-600" dot="bg-emerald-500" />
            <StatChip value={stats.job_failed}    label="Thất bại"   color="text-red-600"     dot="bg-red-500" />
          </div>
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-y-auto">
          {logLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <Clock className="size-8 opacity-30" />
              <p className="text-sm">Không có sự kiện nào</p>
              <p className="text-xs opacity-60">
                {isToday ? "Sự kiện sẽ xuất hiện khi có AI job chạy" : "Ngày này không có log"}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border/40">
                {events.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3 px-5 py-3 hover:bg-accent/30 transition-colors">
                    <div className="shrink-0 mt-0.5">
                      {ev.type === "job_completed" && <CheckCircle2 className="size-4 text-emerald-500" />}
                      {ev.type === "job_failed"    && <XCircle      className="size-4 text-red-500" />}
                      {ev.type === "job_created"   && <Clock        className="size-4 text-blue-500" />}
                      {(ev.type === "user_action" || ev.type === "system") && <Activity className="size-4 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{ev.message}</p>
                      {ev.userId && (
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">uid: {ev.userId}</p>
                      )}
                      {ev.metadata?.jobId && (
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">job: {ev.metadata.jobId}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={cn(
                        "inline-block text-[10px] font-medium px-2 py-0.5 rounded-full",
                        ev.type === "job_completed" && "bg-emerald-50 text-emerald-700 border border-emerald-100",
                        ev.type === "job_failed"    && "bg-red-50 text-red-700 border border-red-100",
                        ev.type === "job_created"   && "bg-blue-50 text-blue-700 border border-blue-100",
                        (ev.type === "user_action" || ev.type === "system") && "bg-amber-50 text-amber-700 border border-amber-100",
                      )}>
                        {ev.type.replace(/_/g, " ")}
                      </span>
                      <p className="font-mono text-[10px] text-muted-foreground mt-1">
                        {new Date(ev.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center p-4">
                  <button
                    onClick={() => fetchEvents(selectedDate, offset, true)}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 hover:bg-accent transition-all disabled:opacity-50"
                  >
                    {loadingMore
                      ? <><RefreshCw className="size-3.5 animate-spin" /> Đang tải...</>
                      : <><ChevronDown className="size-3.5" /> Tải thêm ({stats.total - events.length} còn lại)</>
                    }
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT: Metrics Sidebar (30%) ── */}
      <div className="w-[30%] shrink-0 flex flex-col gap-4 overflow-y-auto">

        {/* Fashn.ai Credits */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-violet-50 p-2 ring-1 ring-violet-100">
                <Zap className="size-3.5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-foreground">Fashn.ai Credits</h3>
                <p className="text-[10px] text-muted-foreground">Số dư API</p>
              </div>
            </div>
            <button onClick={fetchCredits} disabled={creditsLoading} className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 transition-colors">
              <RefreshCw className={cn("size-3.5", creditsLoading && "animate-spin")} />
            </button>
          </div>

          {creditsError ? (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/8 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" /> {creditsError}
            </div>
          ) : creditsLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)}
            </div>
          ) : credits ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <CreditBox value={credits.total}        label="Tổng"      accent="violet" />
                <CreditBox value={credits.subscription} label="Gói tháng" accent="blue" />
                <CreditBox value={credits.onDemand}     label="Mua thêm"  accent="emerald" />
              </div>
              <div className="mt-3">
                <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-primary transition-all duration-700"
                    style={{ width: `${Math.min((credits.subscription / Math.max(credits.total, 1)) * 100, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-[10px] text-muted-foreground">
                  {credits.total > 0 ? Math.round((credits.subscription / credits.total) * 100) : 0}% gói tháng
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Quick links */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Lối tắt</h3>
          <div className="grid grid-cols-2 gap-2">
            <QuickLink href="/dashboard/users"   icon={Users}       label="Users" />
            <QuickLink href="/dashboard/support" icon={Activity}    label="Support" />
            <QuickLink href="/dashboard/roles"   icon={ShieldCheck} label="Quyền" />
            <QuickLink href="/dashboard"         icon={Zap}         label="Credits" />
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function StatChip({ value, label, color, dot }: { value: number; label: string; color: string; dot: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px]">
      <span className={cn("size-1.5 rounded-full shrink-0", dot)} />
      <span className={cn("font-semibold", color)}>{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

function CreditBox({ value, label, accent }: { value: number; label: string; accent: string }) {
  const styles: Record<string, string> = {
    violet: "bg-violet-50 ring-violet-100 text-violet-700",
    blue:   "bg-blue-50 ring-blue-100 text-blue-700",
    emerald:"bg-emerald-50 ring-emerald-100 text-emerald-700",
  };
  const sub: Record<string, string> = { violet: "text-violet-500", blue: "text-blue-500", emerald: "text-emerald-500" };
  return (
    <div className={cn("rounded-lg p-2.5 text-center ring-1", styles[accent])}>
      <p className="text-lg font-bold">{value.toLocaleString()}</p>
      <p className={cn("text-[10px] font-medium mt-0.5", sub[accent])}>{label}</p>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
      <Icon className="size-3.5 transition-colors group-hover:text-primary" />
      {label}
    </Link>
  );
}
