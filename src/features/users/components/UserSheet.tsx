"use client";

import { useState } from "react";
import { Lock, Unlock, Trash2, User as UserIcon, Globe, Sparkles, CreditCard, Calendar, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { RoleBadge, ROLE_CONFIG } from "./RoleBadge";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store/hooks";
import { awardCredits } from "@/features/users/usersSlice";
import type { AdminUser } from "@/features/users/usersSlice";
import { toast } from "sonner";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google", github: "GitHub", email: "Email / Password",
};

function displayName(u: AdminUser) { return u.name || u.email.split("@")[0]; }
function initials(u: AdminUser) { return displayName(u).charAt(0).toUpperCase(); }
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatDatetime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

interface InfoRowProps { label: string; icon: React.ReactNode; children: React.ReactNode; }
function InfoRow({ label, icon, children }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">{icon}{label}</div>
      <div className="text-right">{children}</div>
    </div>
  );
}

interface UserSheetProps {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
  viewerRole: string | null;
  onUpdateRole: (id: string, role: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDeleteClick: (user: AdminUser) => void;
  isUpdating: boolean;
}

export function UserSheet({
  user, open, onClose, viewerRole,
  onUpdateRole, onUpdateStatus, onDeleteClick, isUpdating,
}: UserSheetProps) {
  const dispatch = useAppDispatch();
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [isAwarding, setIsAwarding] = useState(false);

  const isViewerAdmin = viewerRole === "admin";
  const isLocked = user?.status === "locked";

  const handleAwardCredits = async () => {
    if (!user) return;
    const amount = parseInt(creditAmount);
    if (!amount || amount <= 0 || !Number.isInteger(amount)) {
      toast.error("Số credits phải là số nguyên dương.");
      return;
    }
    setIsAwarding(true);
    const result = await dispatch(awardCredits({ id: user.id, amount, reason: creditReason.trim() }));
    setIsAwarding(false);
    if (awardCredits.fulfilled.match(result)) {
      toast.success(`Đã cộng ${amount.toLocaleString()} credits cho ${user.email}.`);
      setCreditAmount("");
      setCreditReason("");
    } else {
      toast.error(String(result.payload ?? "Không thể cộng credits."));
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent>
        {user && (
          <>
            <SheetHeader>
              <SheetTitle>Chi tiết tài khoản</SheetTitle>
            </SheetHeader>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {/* Hero */}
              <div className="flex flex-col items-center gap-3 bg-gradient-to-b from-accent/40 to-transparent px-6 py-8">
                <Avatar className="size-20 ring-4 ring-border shadow-sm">
                  <AvatarImage src={user.avatar_url ?? undefined} alt={displayName(user)} />
                  <AvatarFallback className="text-2xl font-bold">{initials(user)}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="text-base font-semibold text-foreground">{displayName(user)}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <RoleBadge role={user.role} />
                  <StatusBadge status={user.status} />
                </div>
              </div>

              <Separator />

              {/* Info */}
              <div className="px-6 py-2">
                <InfoRow label="ID" icon={<UserIcon className="size-3.5" />}>
                  <span className="font-mono text-xs text-muted-foreground truncate max-w-[160px]" title={user.id}>
                    {user.id.slice(0, 8)}…{user.id.slice(-4)}
                  </span>
                </InfoRow>
                <InfoRow label="Đăng nhập" icon={<Globe className="size-3.5" />}>
                  <Badge variant="outline" className="text-[10px]">
                    {PROVIDER_LABELS[user.provider ?? "email"] ?? user.provider ?? "—"}
                  </Badge>
                </InfoRow>
                <InfoRow label="Gói dịch vụ" icon={<Sparkles className="size-3.5" />}>
                  <span className="text-sm font-medium capitalize">{user.plan_type || "Free"}</span>
                </InfoRow>
                <InfoRow label="Số dư credit" icon={<CreditCard className="size-3.5" />}>
                  <span className="text-sm font-semibold text-foreground">
                    {(user.current_credit ?? 0).toLocaleString()}
                  </span>
                </InfoRow>
                <InfoRow label="Tham gia" icon={<Calendar className="size-3.5" />}>
                  <span className="text-sm">{formatDate(user.created_at)}</span>
                </InfoRow>
                <InfoRow label="Cập nhật" icon={<Calendar className="size-3.5" />}>
                  <span className="text-sm">{formatDatetime(user.updated_at)}</span>
                </InfoRow>
              </div>

              {/* Award Credits (staff + admin) */}
              <Separator />
              <div className="px-6 py-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Cộng Credits
                </p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Số credits"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Lý do (tùy chọn)"
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleAwardCredits}
                    loading={isAwarding}
                    disabled={isAwarding}
                  >
                    {!isAwarding && <Plus className="size-4" />}
                    Cộng Credits
                  </Button>
                </div>
              </div>

              {/* Role selector (admin only) */}
              {isViewerAdmin && (
                <>
                  <Separator />
                  <div className="px-6 py-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Thay đổi vai trò
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["customer", "staff", "admin"] as const).map((r) => {
                        const cfg = ROLE_CONFIG[r];
                        const Icon = cfg.icon;
                        const isActive = user.role === r;
                        return (
                          <button
                            key={r}
                            onClick={() => onUpdateRole(user.id, r)}
                            disabled={isUpdating || isActive}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition-all disabled:opacity-60",
                              isActive
                                ? r === "admin" ? "border-violet-400/40 bg-violet-50 text-violet-700 ring-1 ring-violet-300/30"
                                  : r === "staff" ? "border-blue-400/40 bg-blue-50 text-blue-700 ring-1 ring-blue-300/30"
                                  : "border-border bg-accent text-foreground ring-1 ring-border"
                                : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                          >
                            <Icon className="size-4" />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="space-y-2 border-t border-border px-6 py-4">
              <Button
                variant={isLocked ? "success" : "warning"}
                className="w-full"
                onClick={() => onUpdateStatus(user.id, isLocked ? "active" : "locked")}
                loading={isUpdating}
              >
                {!isUpdating && (isLocked ? <Unlock className="size-4" /> : <Lock className="size-4" />)}
                {isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
              </Button>
              {isViewerAdmin && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => { onDeleteClick(user); onClose(); }}
                >
                  <Trash2 className="size-4" />
                  Xóa vĩnh viễn
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
