"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Users, Activity, ShieldCheck, Zap, RefreshCw, AlertCircle,
  CheckCircle2, XCircle, Clock, Wifi, WifiOff,
  CalendarDays, Briefcase, CreditCard, Coins, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

import type { AdminEvent, DayStats, FashnCredits, Tab, Transaction, TxStats } from "./_types";
import { API_URL, SOCKET_URL, LIMIT, getJobCfg, getTxCfg, todayLocal } from "./_config";
import { EmptyState, LoadMoreButton, StatChip, CreditBox, QuickLink } from "./_ui";
import { LogDetailSheet }     from "./_log-detail-sheet";
import { PaymentDetailSheet } from "./_payment-detail-sheet";

export default function DashboardPage() {
  const { session } = useAuth();

  const [tab, setTab] = useState<Tab>("jobs");

  // Fashn credits
  const [credits,        setCredits]        = useState<FashnCredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [creditsError,   setCreditsError]   = useState<string | null>(null);

  // AI event log
  const [selectedDate,    setSelectedDate]    = useState(todayLocal());
  const [events,          setEvents]          = useState<AdminEvent[]>([]);
  const [stats,           setStats]           = useState<DayStats>({ total:0, job_created:0, job_completed:0, job_failed:0 });
  const [hasMoreEvents,   setHasMoreEvents]   = useState(false);
  const [eventOffset,     setEventOffset]     = useState(0);
  const [logLoading,      setLogLoading]      = useState(false);
  const [logLoadingMore,  setLogLoadingMore]  = useState(false);

  // Payment log
  const [transactions,    setTransactions]    = useState<Transaction[]>([]);
  const [txStats,         setTxStats]         = useState<TxStats>({ totalRevenue:0, successCount:0, pendingCount:0, failedCount:0 });
  const [txTotal,         setTxTotal]         = useState(0);
  const [hasMoreTx,       setHasMoreTx]       = useState(false);
  const [txOffset,        setTxOffset]        = useState(0);
  const [txLoading,       setTxLoading]       = useState(false);
  const [txLoadingMore,   setTxLoadingMore]   = useState(false);
  const [txStatusFilter,  setTxStatusFilter]  = useState("all");

  // Socket
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Detail sheets
  const [detailEvent, setDetailEvent] = useState<AdminEvent | null>(null);
  const [detailTx,    setDetailTx]    = useState<Transaction | null>(null);

  const hdrs = useCallback(() => ({
    Authorization: `Bearer ${session?.access_token}`,
  }), [session?.access_token]);

  // ── Fashn Credits ───────────────────────────────────────────────────────────

  const fetchCredits = useCallback(async () => {
    setCreditsLoading(true); setCreditsError(null);
    try {
      const r = await fetch(`${API_URL}/api/ai/credits`, { headers: hdrs() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || `HTTP ${r.status}`);
      setCredits(j.data);
    } catch (e: any) {
      setCreditsError(e.message || "Không thể kết nối Fashn.ai");
    } finally { setCreditsLoading(false); }
  }, [hdrs]);

  useEffect(() => { if (session?.access_token) fetchCredits(); }, [fetchCredits]);

  // ── Event log ───────────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async (date: string, off: number, append: boolean) => {
    if (!session?.access_token) return;
    if (append) setLogLoadingMore(true); else setLogLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/admin/events?date=${date}&limit=${LIMIT}&offset=${off}`, { headers: hdrs() });
      const j = await r.json(); const d = j.data;
      if (append) setEvents(p => [...p, ...(d.events ?? [])]);
      else        setEvents(d.events ?? []);
      setStats(d.stats ?? { total:0, job_created:0, job_completed:0, job_failed:0 });
      setHasMoreEvents(d.hasMore ?? false);
      setEventOffset(off + (d.events?.length ?? 0));
    } catch {} finally { setLogLoading(false); setLogLoadingMore(false); }
  }, [session?.access_token, hdrs]);

  useEffect(() => { setEventOffset(0); fetchEvents(selectedDate, 0, false); }, [selectedDate, fetchEvents]);

  // ── Transactions ────────────────────────────────────────────────────────────

  const fetchTransactions = useCallback(async (off: number, append: boolean, statusFilter = txStatusFilter) => {
    if (!session?.access_token) return;
    if (append) setTxLoadingMore(true); else setTxLoading(true);
    try {
      const qs = new URLSearchParams({ limit: String(LIMIT), offset: String(off), status: statusFilter });
      const r  = await fetch(`${API_URL}/api/admin/transactions?${qs}`, { headers: hdrs() });
      const j  = await r.json(); const d = j.data;
      if (append) setTransactions(p => [...p, ...(d.transactions ?? [])]);
      else        setTransactions(d.transactions ?? []);
      setTxStats(d.stats ?? { totalRevenue:0, successCount:0, pendingCount:0, failedCount:0 });
      setTxTotal(d.total ?? 0);
      setHasMoreTx(d.hasMore ?? false);
      setTxOffset(off + (d.transactions?.length ?? 0));
    } catch {} finally { setTxLoading(false); setTxLoadingMore(false); }
  }, [session?.access_token, hdrs, txStatusFilter]);

  useEffect(() => {
    if (tab === "payments") { setTxOffset(0); fetchTransactions(0, false); }
  }, [tab, txStatusFilter]); // eslint-disable-line

  // Stable refs — socket handler always sees latest values without re-connecting
  const fetchTransactionsRef  = useRef(fetchTransactions);
  const txStatusFilterRef     = useRef(txStatusFilter);
  useEffect(() => { fetchTransactionsRef.current = fetchTransactions; }, [fetchTransactions]);
  useEffect(() => { txStatusFilterRef.current    = txStatusFilter;    }, [txStatusFilter]);

  // ── Socket.IO ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!session?.access_token) return;
    const s = io(SOCKET_URL, {
      auth: { token: session.access_token },
      transports: ["websocket"],   // polling disabled — avoids JSON.parse errors on HTTP error pages
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = s;
    s.on("connect",       () => { setConnected(true); s.emit("join-admin"); });
    s.on("disconnect",    () => setConnected(false));
    s.on("connect_error", (err) => { console.warn("[Socket] connect_error:", err.message); });
    s.on("admin_event", (ev: AdminEvent) => {
      // ── AI Jobs tab — exclude payment events ────────────────────────────────
      if (ev.type !== "payment_created" && ev.type !== "payment_updated") {
        if (ev.timestamp.slice(0,10) === selectedDate) {
          setEvents(p => [ev, ...p]);
          setStats(p => ({ ...p, total: p.total+1, [ev.type]: ((p as any)[ev.type]||0)+1 }));
        }
      }

      // ── New pending transaction ─────────────────────────────────────────────
      if (ev.type === "payment_created" && ev.metadata?.transaction) {
        const newTx = ev.metadata.transaction as Transaction;
        const filter = txStatusFilterRef.current;
        if (filter === "all" || filter === "pending") {
          setTransactions(p => [newTx, ...p]);
          setTxTotal(p => p + 1);
        }
        setTxStats(p => ({ ...p, pendingCount: p.pendingCount + 1 }));
      }

      // ── Transaction status changed (success / failed / cancelled) ───────────
      if (ev.type === "payment_updated" && ev.metadata?.transactionId) {
        const { transactionId, status, paid_at, amount } = ev.metadata;
        const filter = txStatusFilterRef.current;

        if (filter === "all") {
          // Update in-place — no reload needed
          setTransactions(p => p.map(tx =>
            tx.id === transactionId
              ? { ...tx, status, paid_at: paid_at ?? tx.paid_at, updated_at: new Date().toISOString() }
              : tx,
          ));
        } else if (filter === "pending" && status !== "pending") {
          // Transaction left the "pending" filter — remove from list
          setTransactions(p => p.filter(tx => tx.id !== transactionId));
          setTxTotal(p => Math.max(0, p - 1));
        } else {
          // Other filter (e.g. "success") — full reload to be safe
          fetchTransactionsRef.current(0, false);
        }

        if (status === "success") {
          setTxStats(p => ({
            ...p,
            successCount:  p.successCount + 1,
            pendingCount:  Math.max(0, p.pendingCount - 1),
            totalRevenue:  p.totalRevenue + (Number(amount) || 0),
          }));
        }
      }
    });
    return () => { s.disconnect(); socketRef.current = null; setConnected(false); };
  }, [session?.access_token, selectedDate]); // eslint-disable-line

  const isToday = selectedDate === todayLocal();

  return (
    <div className="h-[calc(100vh-5rem)] flex gap-5 animate-fade-in">

      {/* ── LEFT: Log Panel ── */}
      <div className="flex-1 min-w-0 rounded-xl border border-border bg-card flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold whitespace-nowrap">Nhật ký</h2>
            <span className={cn("flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
              connected
                ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                : "text-muted-foreground bg-muted border-border")}>
              {connected ? <><Wifi className="size-2.5"/>Live</> : <><WifiOff className="size-2.5"/>Offline</>}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5 text-xs font-medium">
            <button onClick={() => setTab("jobs")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all",
                tab === "jobs" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <Briefcase className="size-3"/>AI Jobs
            </button>
            <button onClick={() => setTab("payments")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all",
                tab === "payments" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <CreditCard className="size-3"/>Thanh toán
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {tab === "jobs" && (
              <>
                <div className="relative flex items-center">
                  <CalendarDays className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none"/>
                  <input type="date" value={selectedDate} max={todayLocal()}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:border-primary focus:outline-none cursor-pointer"/>
                </div>
                {!isToday && (
                  <button onClick={() => setSelectedDate(todayLocal())}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
                    Hôm nay
                  </button>
                )}
              </>
            )}
            {tab === "payments" && (
              <select value={txStatusFilter} onChange={e => setTxStatusFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-border bg-background focus:border-primary focus:outline-none cursor-pointer">
                <option value="all">Tất cả</option>
                <option value="success">Thành công</option>
                <option value="pending">Chờ xử lý</option>
                <option value="failed">Thất bại</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            )}
            <button
              onClick={() => tab === "jobs"
                ? (setEventOffset(0), fetchEvents(selectedDate, 0, false))
                : (setTxOffset(0), fetchTransactions(0, false))}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <RefreshCw className={cn("size-3.5", (logLoading || txLoading) && "animate-spin")}/>
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 px-5 py-2 border-b border-border/60 bg-muted/20 shrink-0">
          {tab === "jobs" ? (
            <>
              <span className="text-[11px] text-muted-foreground">
                {isToday
                  ? "Hôm nay"
                  : new Date(selectedDate+"T12:00:00").toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"})}
                {" · "}<span className="font-medium text-foreground">{stats.total} sự kiện</span>
              </span>
              <div className="flex items-center gap-3 ml-auto">
                <StatChip value={stats.job_created}   label="Tạo mới"    color="text-blue-600"    dot="bg-blue-500"/>
                <StatChip value={stats.job_completed} label="Thành công" color="text-emerald-600" dot="bg-emerald-500"/>
                <StatChip value={stats.job_failed}    label="Thất bại"   color="text-red-600"     dot="bg-red-500"/>
              </div>
            </>
          ) : (
            <>
              <span className="text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">{txTotal}</span> giao dịch
              </span>
              <div className="flex items-center gap-3 ml-auto">
                <StatChip value={txStats.successCount} label="Thành công" color="text-emerald-600" dot="bg-emerald-500"/>
                <StatChip value={txStats.pendingCount} label="Đang chờ"   color="text-amber-600"   dot="bg-amber-400"/>
                <StatChip value={txStats.failedCount}  label="Thất bại"   color="text-red-600"     dot="bg-red-500"/>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <TrendingUp className="size-3"/>
                  {txStats.totalRevenue.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {tab === "jobs" ? (
            logLoading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="size-5 animate-spin text-muted-foreground"/>
              </div>
            ) : events.length === 0 ? (
              <EmptyState icon={<Clock className="size-8 opacity-30"/>}
                title="Không có sự kiện nào"
                sub={isToday ? "Sự kiện sẽ xuất hiện khi có AI job chạy" : "Ngày này không có log"}/>
            ) : (
              <>
                <div className="divide-y divide-border/40">
                  {events.map(ev => {
                    const cfg  = getJobCfg(ev.type);
                    const Icon = cfg.icon;
                    return (
                      <button key={ev.id} onClick={() => setDetailEvent(ev)}
                        className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-accent/40 transition-colors cursor-pointer">
                        <Icon className={cn("size-4 mt-0.5 shrink-0", cfg.iconCls)}/>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{ev.message}</p>
                          {ev.userId        && <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">uid: {ev.userId}</p>}
                          {ev.metadata?.jobId && <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">job: {ev.metadata.jobId}</p>}
                        </div>
                        <div className="shrink-0 text-right flex flex-col items-end gap-1">
                          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", cfg.badge)}>{cfg.label}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {new Date(ev.timestamp).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {hasMoreEvents && (
                  <LoadMoreButton loading={logLoadingMore} remaining={stats.total - events.length}
                    onClick={() => fetchEvents(selectedDate, eventOffset, true)}/>
                )}
              </>
            )
          ) : (
            txLoading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="size-5 animate-spin text-muted-foreground"/>
              </div>
            ) : transactions.length === 0 ? (
              <EmptyState icon={<CreditCard className="size-8 opacity-30"/>}
                title="Chưa có giao dịch nào" sub="Giao dịch PayOS sẽ xuất hiện tại đây"/>
            ) : (
              <>
                <div className="divide-y divide-border/40">
                  {transactions.map(tx => {
                    const cfg  = getTxCfg(tx.status);
                    const user = tx.user;
                    const pkg  = tx.package;
                    return (
                      <button key={tx.id} onClick={() => setDetailTx(tx)}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-accent/40 transition-colors cursor-pointer">
                        <div className="shrink-0 flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {user ? (user.name || user.email).charAt(0).toUpperCase() : "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{pkg?.name ?? "—"}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{user?.email ?? "Unknown user"}</p>
                        </div>
                        <div className="shrink-0 text-right flex flex-col items-end gap-1">
                          <span className="text-sm font-bold text-foreground tabular-nums">
                            {Number(tx.amount).toLocaleString("vi-VN")}đ
                          </span>
                          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", cfg.badge)}>{cfg.label}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {new Date(tx.created_at).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})}
                            {" "}
                            {new Date(tx.created_at).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit"})}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {hasMoreTx && (
                  <LoadMoreButton loading={txLoadingMore} remaining={txTotal - transactions.length}
                    onClick={() => fetchTransactions(txOffset, true)}/>
                )}
              </>
            )
          )}
        </div>
      </div>

      {/* ── RIGHT: Metrics Sidebar ── */}
      <div className="w-[30%] shrink-0 flex flex-col gap-4 overflow-y-auto">

        {/* Fashn.ai Credits */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-violet-50 p-2 ring-1 ring-violet-100">
                <Zap className="size-3.5 text-violet-600"/>
              </div>
              <div>
                <h3 className="text-xs font-semibold">Fashn.ai Credits</h3>
                <p className="text-[10px] text-muted-foreground">Số dư API</p>
              </div>
            </div>
            <button onClick={fetchCredits} disabled={creditsLoading}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors">
              <RefreshCw className={cn("size-3.5", creditsLoading && "animate-spin")}/>
            </button>
          </div>
          {creditsError ? (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/8 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0"/>{creditsError}
            </div>
          ) : creditsLoading ? (
            <div className="grid grid-cols-3 gap-2">{[0,1,2].map(i=><div key={i} className="skeleton h-14 rounded-lg"/>)}</div>
          ) : credits ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <CreditBox value={credits.total}        label="Tổng"      accent="violet"/>
                <CreditBox value={credits.subscription} label="Gói tháng" accent="blue"/>
                <CreditBox value={credits.onDemand}     label="Mua thêm"  accent="emerald"/>
              </div>
              <div className="mt-3">
                <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-primary transition-all duration-700"
                    style={{width:`${Math.min((credits.subscription/Math.max(credits.total,1))*100,100)}%`}}/>
                </div>
                <p className="mt-1 text-right text-[10px] text-muted-foreground">
                  {credits.total>0 ? Math.round((credits.subscription/credits.total)*100) : 0}% gói tháng
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Payment summary */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-lg bg-emerald-50 p-2 ring-1 ring-emerald-100">
              <Coins className="size-3.5 text-emerald-600"/>
            </div>
            <div>
              <h3 className="text-xs font-semibold">Doanh thu PayOS</h3>
              <p className="text-[10px] text-muted-foreground">Tổng tích lũy</p>
            </div>
          </div>
          <p className="text-xl font-bold text-foreground">
            {txStats.totalRevenue.toLocaleString("vi-VN")}<span className="text-xs font-normal text-muted-foreground ml-1">đ</span>
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-emerald-50 ring-1 ring-emerald-100 px-2 py-2">
              <p className="text-sm font-bold text-emerald-700">{txStats.successCount}</p>
              <p className="text-[10px] text-emerald-600 font-medium">Thành công</p>
            </div>
            <div className="rounded-lg bg-amber-50 ring-1 ring-amber-100 px-2 py-2">
              <p className="text-sm font-bold text-amber-700">{txStats.pendingCount}</p>
              <p className="text-[10px] text-amber-600 font-medium">Chờ xử lý</p>
            </div>
            <div className="rounded-lg bg-red-50 ring-1 ring-red-100 px-2 py-2">
              <p className="text-sm font-bold text-red-700">{txStats.failedCount}</p>
              <p className="text-[10px] text-red-600 font-medium">Thất bại</p>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Lối tắt</h3>
          <div className="grid grid-cols-2 gap-2">
            <QuickLink href="/dashboard/reports" icon={TrendingUp} label="Báo cáo"/>
            <QuickLink href="/dashboard/users"   icon={Users}       label="Users"/>
            <QuickLink href="/dashboard/support" icon={Activity}    label="Support"/>
            <QuickLink href="/dashboard/roles"   icon={ShieldCheck} label="Quyền"/>
          </div>
        </div>
      </div>

      {/* Sheets */}
      <LogDetailSheet     event={detailEvent} token={session?.access_token ?? ""} onClose={() => setDetailEvent(null)}/>
      <PaymentDetailSheet tx={detailTx}       token={session?.access_token ?? ""} onClose={() => setDetailTx(null)}/>
    </div>
  );
}
