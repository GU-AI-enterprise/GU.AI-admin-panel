"use client";

import React from "react";
import Link from "next/link";
import { RefreshCw, ChevronDown, User, Briefcase, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { JobDetail } from "./_types";

// ─── Primitives ───────────────────────────────────────────────────────────────

export function SectionLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
      {icon}{children}
    </div>
  );
}

export function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 px-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs text-foreground text-right">{children}</span>
    </div>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    admin:    "border-red-200 text-red-700 bg-red-50",
    staff:    "border-violet-200 text-violet-700 bg-violet-50",
    customer: "border-gray-200 text-gray-700 bg-gray-50",
  };
  return <Badge variant="outline" className={cn("text-[10px] font-medium", map[role] ?? map.customer)}>{role}</Badge>;
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

export function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
      {icon}<p className="text-sm">{title}</p><p className="text-xs opacity-60">{sub}</p>
    </div>
  );
}

export function LoadMoreButton({ loading, remaining, onClick }: { loading: boolean; remaining: number; onClick: () => void }) {
  return (
    <div className="flex justify-center p-4">
      <button onClick={onClick} disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 hover:bg-accent transition-all disabled:opacity-50">
        {loading
          ? <><RefreshCw className="size-3.5 animate-spin"/>Đang tải...</>
          : <><ChevronDown className="size-3.5"/>Tải thêm ({remaining} còn lại)</>}
      </button>
    </div>
  );
}

export function StatChip({ value, label, color, dot }: { value: number; label: string; color: string; dot: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px]">
      <span className={cn("size-1.5 rounded-full shrink-0", dot)}/>
      <span className={cn("font-semibold", color)}>{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

export function CreditBox({ value, label, accent }: { value: number; label: string; accent: string }) {
  const styles: Record<string, string> = {
    violet:  "bg-violet-50 ring-violet-100 text-violet-700",
    blue:    "bg-blue-50 ring-blue-100 text-blue-700",
    emerald: "bg-emerald-50 ring-emerald-100 text-emerald-700",
  };
  const sub: Record<string, string> = {
    violet: "text-violet-500", blue: "text-blue-500", emerald: "text-emerald-500",
  };
  return (
    <div className={cn("rounded-lg p-2.5 text-center ring-1", styles[accent])}>
      <p className="text-lg font-bold">{value.toLocaleString()}</p>
      <p className={cn("text-[10px] font-medium mt-0.5", sub[accent])}>{label}</p>
    </div>
  );
}

export function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
      <Icon className="size-3.5 group-hover:text-primary transition-colors"/>{label}
    </Link>
  );
}

// ─── Detail sub-sections (shared between sheets) ──────────────────────────────

export function UserSection({ user }: { user: any }) {
  return (
    <section>
      <SectionLabel icon={<User className="size-3"/>}>Người dùng</SectionLabel>
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
        <Link href={`/dashboard/users?highlight=${user.id}`}
          className="group flex items-center gap-3 rounded-lg p-1 -m-1 hover:bg-accent transition-colors">
          <Avatar className="size-10 shrink-0">
            <AvatarImage src={user.avatar_url ?? undefined} referrerPolicy="no-referrer"/>
            <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{user.name || "—"}</p>
              <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"/>
            </div>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </Link>
        <Separator/>
        <div className="divide-y divide-border/50">
          {user.role && <InfoRow label="Vai trò"><RoleBadge role={user.role}/></InfoRow>}
          <InfoRow label="Credits"><span className="font-bold text-foreground">{user.current_credit?.toLocaleString()}</span></InfoRow>
          {user.plan_type && <InfoRow label="Gói dịch vụ"><span className="capitalize">{user.plan_type}</span></InfoRow>}
          {user.created_at && <InfoRow label="Tham gia">{new Date(user.created_at).toLocaleDateString("vi-VN")}</InfoRow>}
        </div>
      </div>
    </section>
  );
}

export function JobSection({ job, outputs }: { job: JobDetail; outputs: { asset: { url: string; thumbnail_url: string } }[] }) {
  return (
    <section>
      <SectionLabel icon={<Briefcase className="size-3"/>}>AI Job</SectionLabel>
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
        <div className="divide-y divide-border/50">
          <InfoRow label="Loại"><span className="capitalize font-medium">{job.type.replace(/_/g," ")}</span></InfoRow>
          <InfoRow label="Trạng thái">
            <Badge variant="outline" className={cn("text-[10px] font-medium",
              job.status === "completed" ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
              job.status === "failed"    ? "border-red-200 text-red-700 bg-red-50"
                                        : "border-blue-200 text-blue-700 bg-blue-50")}>
              {job.status}
            </Badge>
          </InfoRow>
          <InfoRow label="Chi phí"><span className="font-bold text-foreground">-{job.credit_cost} cr</span></InfoRow>
          <InfoRow label="Provider">{job.provider}</InfoRow>
          <InfoRow label="Bắt đầu">{new Date(job.created_at).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</InfoRow>
          {job.completed_at && <InfoRow label="Hoàn thành">{new Date(job.completed_at).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</InfoRow>}
        </div>
        {job.error_message && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs text-red-600 leading-relaxed">{job.error_message}</p>
          </div>
        )}
        {outputs.length > 0 && outputs[0].asset?.url && (
          <>
            <Separator/>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Ảnh output</p>
              <a href={outputs[0].asset.url} target="_blank" rel="noreferrer" className="block group">
                <img src={outputs[0].asset.thumbnail_url || outputs[0].asset.url} alt="Output"
                  className="w-full rounded-lg border border-border object-cover max-h-52 group-hover:opacity-90 transition-opacity"/>
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
