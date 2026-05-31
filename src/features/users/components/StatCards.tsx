import { Users, UserCheck, UserX, User as UserIcon, Headphones, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserStats } from "@/features/users/usersSlice";

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  className?: string;
}

function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-border bg-card p-4", className)}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">{value ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function StatCards({ stats }: { stats: UserStats | null }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <StatCard label="Tổng tài khoản" value={stats?.total}          icon={Users} />
      <StatCard label="Đang hoạt động" value={stats?.active}         icon={UserCheck}  className="border-emerald-500/20 bg-emerald-500/5" />
      <StatCard label="Đã khóa"        value={stats?.locked}         icon={UserX}      className="border-destructive/20 bg-destructive/5" />
      <StatCard label="Customer"        value={stats?.byRole.customer} icon={UserIcon} />
      <StatCard label="Staff"           value={stats?.byRole.staff}    icon={Headphones} className="border-blue-500/20 bg-blue-500/5" />
      <StatCard label="Admin"           value={stats?.byRole.admin}    icon={Crown}      className="border-violet-500/20 bg-violet-500/5" />
    </div>
  );
}
