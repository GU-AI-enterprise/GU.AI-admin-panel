"use client";

import { useEffect, useState } from "react";
import { Loader2, ImageIcon } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AdminEvent, UserDetail, JobDetail } from "./_types";
import { API_URL, getJobCfg } from "./_config";
import { InfoRow, SectionLabel, UserSection, JobSection } from "./_ui";

export function LogDetailSheet({
  event, token, onClose,
}: {
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
          .then(r => r.json())
          .then(j => { if (j.data?.user) setUser(j.data.user); })
          .catch(() => {}),
      );
    }

    const jobId = event.metadata?.jobId;
    if (jobId) {
      tasks.push(
        fetch(`${API_URL}/api/admin/jobs/${jobId}`, { headers: hdrs })
          .then(r => r.json())
          .then(j => {
            if (j.data?.job) setJob(j.data.job);
            if (j.data?.outputAssets) setOutputs(j.data.outputAssets);
          })
          .catch(() => {}),
      );
    }

    Promise.all(tasks).finally(() => setLoading(false));
  }, [event?.id, token]);

  const cfg  = getJobCfg(event?.type ?? "system");
  const Icon = cfg.icon;

  return (
    <Sheet open={!!event} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent className="w-[420px] max-w-[95vw] flex flex-col p-0 overflow-hidden">
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

        {event && (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            <section>
              <SectionLabel>Sự kiện</SectionLabel>
              <div className="rounded-xl border border-border bg-muted/30 divide-y divide-border/60">
                <InfoRow label="Thời gian">
                  {new Date(event.timestamp).toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"})}
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
                <span className="text-xs">Đang tải...</span>
              </div>
            )}

            {user && <UserSection user={user}/>}
            {job  && <JobSection  job={job} outputs={outputs}/>}

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
