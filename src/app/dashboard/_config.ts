import { CheckCircle2, XCircle, Clock, Activity } from "lucide-react";

export const API_URL    = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export const SOCKET_URL = API_URL.replace(/\/api$/, "");
export const LIMIT = 20;

export const JOB_TYPE_CFG = {
  job_completed: { icon: CheckCircle2, iconCls: "text-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-100", label: "Hoàn thành" },
  job_failed:    { icon: XCircle,      iconCls: "text-red-500",     badge: "bg-red-50 text-red-700 border-red-100",             label: "Thất bại"   },
  job_created:   { icon: Clock,        iconCls: "text-blue-500",    badge: "bg-blue-50 text-blue-700 border-blue-100",          label: "Tạo mới"    },
  user_action:   { icon: Activity,     iconCls: "text-amber-500",   badge: "bg-amber-50 text-amber-700 border-amber-100",       label: "User"       },
  system:        { icon: Activity,     iconCls: "text-amber-500",   badge: "bg-amber-50 text-amber-700 border-amber-100",       label: "System"     },
} as const;

export const TX_STATUS_CFG = {
  success:   { badge: "bg-emerald-50 text-emerald-700 border-emerald-100", label: "Thành công", dot: "bg-emerald-500" },
  pending:   { badge: "bg-amber-50 text-amber-700 border-amber-100",       label: "Chờ xử lý",  dot: "bg-amber-400"  },
  failed:    { badge: "bg-red-50 text-red-700 border-red-100",             label: "Thất bại",   dot: "bg-red-500"    },
  cancelled: { badge: "bg-zinc-100 text-zinc-600 border-zinc-200",         label: "Đã hủy",     dot: "bg-zinc-400"   },
  refunded:  { badge: "bg-blue-50 text-blue-700 border-blue-100",          label: "Hoàn tiền",  dot: "bg-blue-500"   },
} as const;

export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export function getJobCfg(type: string) {
  return JOB_TYPE_CFG[type as keyof typeof JOB_TYPE_CFG] ?? JOB_TYPE_CFG.system;
}

export function getTxCfg(status: string) {
  return TX_STATUS_CFG[status as keyof typeof TX_STATUS_CFG] ?? TX_STATUS_CFG.pending;
}
