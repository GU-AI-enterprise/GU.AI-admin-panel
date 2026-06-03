"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Users, Activity, ShieldCheck, Zap, RefreshCw, AlertCircle,
  CheckCircle2, XCircle, Clock, Wifi, WifiOff, ChevronDown,
  CalendarDays, User, Briefcase, ImageIcon, Loader2, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const API_URL    = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const SOCKET_URL = API_URL.replace(/\/api$/, "");

// ─── Types ─────────────────────────────────────────────────────────────────────

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
  total: number; job_created: number; job_completed: number; job_failed: number;
}

interface UserDetail {
  id: string; email: string; name: string | null; avatar_url: string | null;
  role: string; status: string; plan_type: string; current_credit: number;
  created_at: string; last_login_at: string | null;
}

interface JobDetail {
  id: string; type: string; status: string; credit_cost: number;
  input_params: Record<string, any>; error_message: string | null;
  created_at: string; completed_at: string | null; provider: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const LIMIT = 20;

const TYPE_CFG = {
  job_completed: { icon: CheckCircle2, iconCls: "text-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-100", label: "Hoàn thành" },
  job_failed:    { icon: XCircle,      iconCls: "text-red-500",     badge: "bg-red-50 text-red-700 border-red-100",             label: "Thất bại"   },
  job_created:   { icon: Clock,        iconCls: "text-blue-500",    badge: "bg-blue-50 text-blue-700 border-blue-100",          label: "Tạo mới"    },
  user_action:   { icon: Activity,     iconCls: "text-amber-500",   badge: "bg-amber-50 text-amber-700 border-amber-100",       label: "User"       },
  system:        { icon: Activity,     iconCls: "text-amber-500",   badge: "bg-amber-50 text-amber-700 border-amber-100",       label: "System"     },
} as const;

function getCfg(type: string) {
  return TYPE_CFG[type as keyof typeof TYPE_CFG] ?? TYPE_CFG.system;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { session } = useAuth();

  // Credits
  const [credits, setCredits]               = useState<FashnCredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [creditsError, setCreditsError]     = useState<string | null>(null);

  // Event log
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [events, setEvents]             = useState<AdminEvent[]>([]);
  const [stats, setStats]               = useState<DayStats>({ total:0, job_created:0, job_completed:0, job_failed:0 });
  const [hasMore, setHasMore]           = useState(false);
  const [offset, setOffset]             = useState(0);
  const [logLoading, setLogLoading]     = useState(false);
  const [loadingMore, setLoadingMore]   = useState(false);

  // Socket
  const [connected, setConnected] = useState(false);
  const socketRef                 = useRef<Socket | null>(null);

  // Detail sheet
  const [detailEvent, setDetailEvent] = useState<AdminEvent | null>(null);

  // ── Credits ────────────────────────────────────────────────────────────────
  const fetchCredits = useCallback(async () => {
    setCreditsLoading(true); setCreditsError(null);
    try {
      const r = await fetch(`${API_URL}/api/ai/credits`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || `HTTP ${r.status}`);
      setCredits(j.data);
    } catch (e: any) {
      setCreditsError(e.message || "Không thể kết nối Fashn.ai");
    } finally { setCreditsLoading(false); }
  }, [session?.access_token]);

  useEffect(() => { if (session?.access_token) fetchCredits(); }, [fetchCredits]);

  // ── Event log ──────────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async (date: string, off: number, append: boolean) => {
    if (!session?.access_token) return;
    if (append) setLoadingMore(true); else setLogLoading(true);
    try {
      const r  = await fetch(`${API_URL}/api/admin/events?date=${date}&limit=${LIMIT}&offset=${off}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } });
      const j  = await r.json(); const d = j.data;
      if (append) setEvents(p => [...p, ...(d.events ?? [])]);
      else        setEvents(d.events ?? []);
      setStats(d.stats ?? { total:0, job_created:0, job_completed:0, job_failed:0 });
      setHasMore(d.hasMore ?? false);
      setOffset(off + (d.events?.length ?? 0));
    } catch { /**/ } finally { setLogLoading(false); setLoadingMore(false); }
  }, [session?.access_token]);

  useEffect(() => { setOffset(0); fetchEvents(selectedDate, 0, false); }, [selectedDate, fetchEvents]);

  // ── Socket.IO ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.access_token) return;
    const s = io(SOCKET_URL, { auth: { token: session.access_token }, transports: ["websocket","polling"] });
    socketRef.current = s;
    s.on("connect",    () => { setConnected(true); s.emit("join-admin"); });
    s.on("disconnect", () => setConnected(false));
    s.on("admin_event", (ev: AdminEvent) => {
      if (ev.timestamp.slice(0,10) === selectedDate) {
        setEvents(p => [ev, ...p]);
        setStats(p => ({ ...p, total: p.total+1, [ev.type]: ((p as any)[ev.type]||0)+1 }));
      }
    });
    return () => { s.disconnect(); socketRef.current = null; setConnected(false); };
  }, [session?.access_token, selectedDate]);

  const isToday = selectedDate === todayLocal();

  return (
    <div className="h-[calc(100vh-5rem)] flex gap-5 animate-fade-in">

      {/* ── LEFT: Event Log ── */}
      <div className="flex-1 min-w-0 rounded-xl border border-border bg-card flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0 gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold">Nhật ký hệ thống</h2>
            <span className={cn("flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
              connected
                ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                : "text-muted-foreground bg-muted border-border")}>
              {connected ? <><Wifi className="size-2.5"/>Live</> : <><WifiOff className="size-2.5"/>Offline</>}
            </span>
          </div>
          <div className="flex items-center gap-2">
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
            <button onClick={() => { setOffset(0); fetchEvents(selectedDate, 0, false); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <RefreshCw className={cn("size-3.5", logLoading && "animate-spin")}/>
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-b border-border/60 bg-muted/20 shrink-0">
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
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {logLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="size-5 animate-spin text-muted-foreground"/>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <Clock className="size-8 opacity-30"/>
              <p className="text-sm">Không có sự kiện nào</p>
              <p className="text-xs opacity-60">{isToday ? "Sự kiện sẽ xuất hiện khi có AI job chạy" : "Ngày này không có log"}</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border/40">
                {events.map(ev => {
                  const cfg  = getCfg(ev.type);
                  const Icon = cfg.icon;
                  return (
                    <button key={ev.id} onClick={() => setDetailEvent(ev)}
                      className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-accent/40 active:bg-accent/60 transition-colors cursor-pointer">
                      <Icon className={cn("size-4 mt-0.5 shrink-0", cfg.iconCls)}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{ev.message}</p>
                        {ev.userId && (
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">uid: {ev.userId}</p>
                        )}
                        {ev.metadata?.jobId && (
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">job: {ev.metadata.jobId}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right flex flex-col items-end gap-1">
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", cfg.badge)}>
                          {cfg.label}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {new Date(ev.timestamp).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {hasMore && (
                <div className="flex justify-center p-4">
                  <button onClick={() => fetchEvents(selectedDate, offset, true)} disabled={loadingMore}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 hover:bg-accent transition-all disabled:opacity-50">
                    {loadingMore
                      ? <><RefreshCw className="size-3.5 animate-spin"/>Đang tải...</>
                      : <><ChevronDown className="size-3.5"/>Tải thêm ({stats.total - events.length} còn lại)</>
                    }
                  </button>
                </div>
              )}
            </>
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
            <div className="grid grid-cols-3 gap-2">
              {[0,1,2].map(i => <div key={i} className="skeleton h-14 rounded-lg"/>)}
            </div>
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

        {/* Quick links */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Lối tắt</h3>
          <div className="grid grid-cols-2 gap-2">
            <QuickLink href="/dashboard/users"   icon={Users}       label="Users"/>
            <QuickLink href="/dashboard/support" icon={Activity}    label="Support"/>
            <QuickLink href="/dashboard/roles"   icon={ShieldCheck} label="Quyền"/>
            <QuickLink href="/dashboard"         icon={Zap}         label="Credits"/>
          </div>
        </div>
      </div>

      {/* ── Log Detail Sheet ── */}
      <LogDetailSheet
        event={detailEvent}
        token={session?.access_token ?? ""}
        onClose={() => setDetailEvent(null)}
      />
    </div>
  );
}

// ─── Log Detail Sheet ─────────────────────────────────────────────────────────

function LogDetailSheet({ event, token, onClose }: {
  event: AdminEvent | null;
  token: string;
  onClose: () => void;
}) {
  const [user,    setUser]    = useState<UserDetail | null>(null);
  const [job,     setJob]     = useState<JobDetail  | null>(null);
  const [outputs, setOutputs] = useState<{ asset: { url: string; thumbnail_url: string } }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!event || !token) return;
    setUser(null); setJob(null); setOutputs([]); setLoading(true);

    const hdrs = { Authorization: `Bearer ${token}` };
    const tasks: Promise<void>[] = [];

    if (event.userId) {
      tasks.push(
        fetch(`${API_URL}/api/admin/users/${event.userId}`, { headers: hdrs })
          .then(r => r.json()).then(j => { if (j.data?.user) setUser(j.data.user); })
          .catch(() => {})
      );
    }
    const jobId = event.metadata?.jobId;
    if (jobId) {
      tasks.push(
        fetch(`${API_URL}/api/admin/jobs/${jobId}`, { headers: hdrs })
          .then(r => r.json()).then(j => {
            if (j.data?.job) setJob(j.data.job);
            if (j.data?.outputAssets) setOutputs(j.data.outputAssets);
          })
          .catch(() => {})
      );
    }
    Promise.all(tasks).finally(() => setLoading(false));
  }, [event?.id, token]);

  const cfg  = event ? getCfg(event.type) : getCfg("system");
  const Icon = cfg.icon;

  return (
    <Sheet open={!!event} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent className="w-[420px] max-w-[95vw] flex flex-col p-0 overflow-hidden">

        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            {event && <Icon className={cn("size-4 shrink-0", cfg.iconCls)}/>}
            <SheetTitle className="text-base">Chi tiết sự kiện</SheetTitle>
          </div>
          {event && (
            <SheetDescription asChild>
              <span className={cn("self-start text-[11px] font-medium px-2 py-0.5 rounded-full border mt-1", cfg.badge)}>
                {cfg.label}
              </span>
            </SheetDescription>
          )}
        </SheetHeader>

        {/* Body */}
        {event && (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

            {/* ── Event info ── */}
            <section>
              <SectionLabel>Sự kiện</SectionLabel>
              <div className="rounded-xl border border-border bg-muted/30 divide-y divide-border/60">
                <InfoRow label="Thời gian">
                  {new Date(event.timestamp).toLocaleString("vi-VN",{
                    day:"2-digit",month:"2-digit",year:"numeric",
                    hour:"2-digit",minute:"2-digit",second:"2-digit",
                  })}
                </InfoRow>
                <InfoRow label="Nội dung">
                  <span className="text-foreground text-right">{event.message}</span>
                </InfoRow>
                {event.userId && (
                  <InfoRow label="User ID">
                    <span className="font-mono text-[11px] text-muted-foreground">{event.userId}</span>
                  </InfoRow>
                )}
                {event.metadata?.jobId && (
                  <InfoRow label="Job ID">
                    <span className="font-mono text-[11px] text-muted-foreground">{event.metadata.jobId}</span>
                  </InfoRow>
                )}
                {event.metadata?.assetId && (
                  <InfoRow label="Asset ID">
                    <span className="font-mono text-[11px] text-muted-foreground">{event.metadata.assetId}</span>
                  </InfoRow>
                )}
                {event.metadata?.error && (
                  <InfoRow label="Lỗi">
                    <span className="text-red-500 text-right text-xs">{event.metadata.error}</span>
                  </InfoRow>
                )}
              </div>
            </section>

            {loading && (
              <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
                <Loader2 className="size-4 animate-spin"/>
                <span className="text-xs">Đang tải thông tin liên quan...</span>
              </div>
            )}

            {/* ── User ── */}
            {user && (
              <section>
                <SectionLabel icon={<User className="size-3"/>}>Người dùng</SectionLabel>
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  {/* Avatar row — clickable → user management */}
                  <Link
                    href={`/dashboard/users?highlight=${user.id}`}
                    className="group flex items-center gap-3 rounded-lg p-1 -m-1 hover:bg-accent transition-colors"
                  >
                    <Avatar className="size-10 shrink-0">
                      <AvatarImage src={user.avatar_url ?? undefined} referrerPolicy="no-referrer"/>
                      <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                          {user.name || "—"}
                        </p>
                        <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"/>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </Link>
                  <Separator/>
                  <div className="divide-y divide-border/50">
                    <InfoRow label="Vai trò">
                      <RoleBadge role={user.role}/>
                    </InfoRow>
                    <InfoRow label="Trạng thái">
                      <Badge variant="outline" className={cn("text-[10px] font-medium",
                        user.status === "active" ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-red-200 text-red-700 bg-red-50")}>
                        {user.status}
                      </Badge>
                    </InfoRow>
                    <InfoRow label="Credits"><span className="font-bold text-foreground">{user.current_credit.toLocaleString()}</span></InfoRow>
                    <InfoRow label="Gói dịch vụ"><span className="capitalize">{user.plan_type}</span></InfoRow>
                    <InfoRow label="Tham gia">{new Date(user.created_at).toLocaleDateString("vi-VN")}</InfoRow>
                    {user.last_login_at && (
                      <InfoRow label="Đăng nhập cuối">{new Date(user.last_login_at).toLocaleDateString("vi-VN")}</InfoRow>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* ── AI Job ── */}
            {job && (
              <section>
                <SectionLabel icon={<Briefcase className="size-3"/>}>AI Job</SectionLabel>
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <div className="divide-y divide-border/50">
                    <InfoRow label="Loại">
                      <span className="capitalize font-medium">{job.type.replace(/_/g," ")}</span>
                    </InfoRow>
                    <InfoRow label="Trạng thái">
                      <Badge variant="outline" className={cn("text-[10px] font-medium",
                        job.status === "completed" ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                        job.status === "failed"    ? "border-red-200 text-red-700 bg-red-50" :
                                                     "border-blue-200 text-blue-700 bg-blue-50")}>
                        {job.status}
                      </Badge>
                    </InfoRow>
                    <InfoRow label="Chi phí"><span className="font-bold text-foreground">-{job.credit_cost} cr</span></InfoRow>
                    <InfoRow label="Provider">{job.provider}</InfoRow>
                    <InfoRow label="Bắt đầu">
                      {new Date(job.created_at).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
                    </InfoRow>
                    {job.completed_at && (
                      <InfoRow label="Hoàn thành">
                        {new Date(job.completed_at).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
                      </InfoRow>
                    )}
                  </div>

                  {job.error_message && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                      <p className="text-xs text-red-600 leading-relaxed">{job.error_message}</p>
                    </div>
                  )}

                  {/* Output image */}
                  {outputs.length > 0 && outputs[0].asset?.url && (
                    <>
                      <Separator/>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Ảnh output</p>
                        <a href={outputs[0].asset.url} target="_blank" rel="noreferrer" className="block group">
                          <img
                            src={outputs[0].asset.thumbnail_url || outputs[0].asset.url}
                            alt="Output"
                            className="w-full rounded-lg border border-border object-cover max-h-52 group-hover:opacity-90 transition-opacity"
                          />
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}

            {!loading && !user && !job && (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <ImageIcon className="size-8 opacity-30"/>
                <p className="text-xs">Không có thông tin liên quan</p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Tiny sub-components ───────────────────────────────────────────────────────

function SectionLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
      {icon}{children}
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 px-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs text-foreground text-right">{children}</span>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    admin:    "border-red-200 text-red-700 bg-red-50",
    staff:    "border-violet-200 text-violet-700 bg-violet-50",
    customer: "border-gray-200 text-gray-700 bg-gray-50",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px] font-medium", map[role] ?? map.customer)}>
      {role}
    </Badge>
  );
}

function StatChip({ value, label, color, dot }: { value: number; label: string; color: string; dot: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px]">
      <span className={cn("size-1.5 rounded-full shrink-0", dot)}/>
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
  const sub: Record<string, string> = { violet:"text-violet-500", blue:"text-blue-500", emerald:"text-emerald-500" };
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
      <Icon className="size-3.5 group-hover:text-primary transition-colors"/>
      {label}
    </Link>
  );
}
