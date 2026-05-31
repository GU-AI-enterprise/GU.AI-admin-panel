"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, RefreshCw, Users, UserCheck, UserX,
  Shield, Headphones, ChevronLeft, ChevronRight,
  Lock, Unlock, Trash2, Crown, ChevronDown,
  AlertTriangle, User as UserIcon, Sparkles,
  Mail, Calendar, CreditCard, Globe, Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: "customer" | "staff" | "admin";
  status: "active" | "locked";
  provider: string | null;
  plan_type: string | null;
  current_credit: number;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  total: number;
  active: number;
  locked: number;
  byRole: { customer: number; staff: number; admin: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function displayName(u: AdminUser) {
  return u.name || u.email.split("@")[0];
}

function initials(u: AdminUser) {
  const n = displayName(u);
  return n.charAt(0).toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatDatetime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const ROLE_CONFIG = {
  admin:    { label: "Admin",    variant: "violet",  icon: Crown },
  staff:    { label: "Staff",    variant: "blue",    icon: Headphones },
  customer: { label: "Customer", variant: "slate",   icon: UserIcon },
} as const;

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  email:  "Email / Password",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.customer;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant as any}>
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "locked")
    return (
      <Badge variant="destructive">
        <span className="size-1.5 rounded-full bg-destructive" />
        Đã khóa
      </Badge>
    );
  return (
    <Badge variant="success">
      <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
      Hoạt động
    </Badge>
  );
}

function StatCard({
  label, value, icon: Icon, className,
}: {
  label: string; value: number | undefined; icon: React.ElementType; className?: string;
}) {
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

// ── Role Dropdown (in table row) ───────────────────────────────────────────────

function RoleDropdown({ userId, currentRole, onUpdate, disabled }: {
  userId: string; currentRole: string;
  onUpdate: (id: string, role: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  if (disabled) return <RoleBadge role={currentRole} />;

  const handleSelect = async (role: string) => {
    if (role === currentRole) return;
    setLoading(true);
    await onUpdate(userId, role);
    setLoading(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1 rounded-lg p-1 transition-colors hover:bg-accent focus:outline-none">
          <RoleBadge role={currentRole} />
          {loading
            ? <Loader2 className="size-3 animate-spin text-muted-foreground" />
            : <ChevronDown className="size-3 text-muted-foreground" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Đổi vai trò</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(["customer", "staff", "admin"] as const).map((r) => {
          const cfg = ROLE_CONFIG[r];
          const Icon = cfg.icon;
          return (
            <DropdownMenuItem
              key={r}
              onSelect={() => handleSelect(r)}
              className={cn(
                r === currentRole && "bg-accent",
                r === "admin" && "text-violet-400",
                r === "staff" && "text-blue-400",
              )}
            >
              <Icon className="size-4" />
              {cfg.label}
              {r === currentRole && (
                <span className="ml-auto text-[10px] text-muted-foreground">Hiện tại</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Delete Dialog ──────────────────────────────────────────────────────────────

function DeleteDialog({ user, open, onConfirm, onClose, isDeleting }: {
  user: AdminUser | null; open: boolean;
  onConfirm: () => void; onClose: () => void; isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showClose={false} className="max-w-sm">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Xóa tài khoản vĩnh viễn?</DialogTitle>
              <DialogDescription className="mt-1">
                Tài khoản{" "}
                <span className="font-semibold text-foreground">{user ? displayName(user) : ""}</span>{" "}
                sẽ bị xóa hoàn toàn. Hành động này không thể hoàn tác.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Hủy bỏ
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={isDeleting}>
            <Trash2 className="size-4" />
            Xóa vĩnh viễn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── User Detail Sheet ──────────────────────────────────────────────────────────

function UserSheet({ user, open, onClose, viewerRole, onUpdateRole, onUpdateStatus, onDeleteClick, isUpdating }: {
  user: AdminUser | null; open: boolean; onClose: () => void;
  viewerRole: string | null;
  onUpdateRole: (id: string, role: string) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteClick: (user: AdminUser) => void;
  isUpdating: boolean;
}) {
  if (!user) return null;
  const isViewerAdmin = viewerRole === "admin";
  const isLocked = user.status === "locked";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Chi tiết tài khoản</SheetTitle>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Profile hero */}
          <div className="flex flex-col items-center gap-3 bg-gradient-to-b from-accent/40 to-transparent px-6 py-8">
            <Avatar className="size-20 ring-4 ring-border">
              <AvatarImage src={user.avatar_url ?? undefined} alt={displayName(user)} />
              <AvatarFallback className="text-2xl font-bold">{initials(user)}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{displayName(user)}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
            </div>
          </div>

          <Separator />

          {/* Info rows */}
          <div className="space-y-0 px-6 py-2">
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
                            ? r === "admin" ? "border-violet-500/40 bg-violet-500/10 text-violet-400"
                              : r === "staff" ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                              : "border-border bg-accent text-foreground"
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

        {/* Footer actions */}
        <div className="border-t border-border px-6 py-4 space-y-2">
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
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ label, icon, children }: {
  label: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-right">{children}</div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function UsersManagement() {
  const { session, userRole } = useAuth();
  const token = session?.access_token;
  const isViewerAdmin = userRole === "admin";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [sheetUser, setSheetUser] = useState<AdminUser | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch {}
  }, [token]);

  const fetchUsers = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(limit),
        ...(search && { search }),
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      const res = await fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users);
        setTotal(json.data.total);
        setTotalPages(json.data.totalPages);
      }
    } catch {}
    finally { setIsLoading(false); }
  }, [token, page, limit, search, roleFilter, statusFilter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const refresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStats(), fetchUsers(true)]);
    setIsRefreshing(false);
  };

  const handleUpdateRole = async (id: string, role: string) => {
    if (!token) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (json.success) {
        const update = (u: AdminUser) => u.id === id ? { ...u, role: json.data.role } : u;
        setUsers((prev) => prev.map(update));
        setSheetUser((prev) => prev?.id === id ? { ...prev, role: json.data.role } : prev);
        fetchStats();
      }
    } catch {}
    setUpdatingId(null);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!token) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        const update = (u: AdminUser) => u.id === id ? { ...u, status: json.data.status } : u;
        setUsers((prev) => prev.map(update));
        setSheetUser((prev) => prev?.id === id ? { ...prev, status: json.data.status } : prev);
        fetchStats();
      }
    } catch {}
    setUpdatingId(null);
  };

  const handleDelete = async () => {
    if (!token || !deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
        setSheetOpen(false);
        fetchStats();
      }
    } catch {}
    setIsDeleting(false);
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const openSheet = (user: AdminUser) => {
    setSheetUser(user);
    setSheetOpen(true);
  };

  const openDelete = (user: AdminUser) => {
    setDeleteTarget(user);
    setDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý người dùng</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Xem, phân quyền và quản lý tất cả tài khoản trong hệ thống.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} loading={isRefreshing} size="md">
          <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
          Làm mới
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Tổng tài khoản" value={stats?.total}     icon={Users}      />
        <StatCard label="Đang hoạt động" value={stats?.active}    icon={UserCheck}  className="border-emerald-500/20 bg-emerald-500/5" />
        <StatCard label="Đã khóa"        value={stats?.locked}    icon={UserX}      className="border-destructive/20 bg-destructive/5" />
        <StatCard label="Customer"        value={stats?.byRole.customer} icon={UserIcon}  />
        <StatCard label="Staff"           value={stats?.byRole.staff}    icon={Headphones} className="border-blue-500/20 bg-blue-500/5" />
        <StatCard label="Admin"           value={stats?.byRole.admin}    icon={Crown}      className="border-violet-500/20 bg-violet-500/5" />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-border bg-input py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            {
              value: roleFilter, onChange: (v: string) => { setRoleFilter(v); setPage(1); },
              options: [
                { value: "all",      label: "Tất cả vai trò" },
                { value: "admin",    label: "Admin" },
                { value: "staff",    label: "Staff" },
                { value: "customer", label: "Customer" },
              ],
            },
            {
              value: statusFilter, onChange: (v: string) => { setStatusFilter(v); setPage(1); },
              options: [
                { value: "all",    label: "Tất cả trạng thái" },
                { value: "active", label: "Hoạt động" },
                { value: "locked", label: "Đã khóa" },
              ],
            },
            {
              value: String(limit), onChange: (v: string) => { setLimit(Number(v)); setPage(1); },
              options: [
                { value: "10", label: "10 / trang" },
                { value: "20", label: "20 / trang" },
                { value: "50", label: "50 / trang" },
              ],
            },
          ].map((sel, i) => (
            <select
              key={i}
              value={sel.value}
              onChange={(e) => sel.onChange(e.target.value)}
              className="rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-ring"
            >
              {sel.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                {["Người dùng", "Vai trò", "Trạng thái", "Gói & Credit", "Tham gia", ""].map((h) => (
                  <th key={h} className={cn(
                    "px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                    !h && "text-right"
                  )}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="mx-auto size-7 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="size-10 opacity-30" />
                      <p className="text-sm">Không tìm thấy người dùng phù hợp.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="cursor-pointer transition-colors hover:bg-accent/40"
                    onClick={() => openSheet(user)}
                  >
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 shrink-0">
                          <AvatarImage src={user.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs font-bold">{initials(user)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{displayName(user)}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <RoleDropdown
                        userId={user.id}
                        currentRole={user.role}
                        onUpdate={handleUpdateRole}
                        disabled={!isViewerAdmin}
                      />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={user.status} />
                    </td>

                    {/* Plan & credit */}
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold capitalize text-foreground">
                        {user.plan_type || "Free"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(user.current_credit ?? 0).toLocaleString()} credit
                      </p>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUpdateStatus(user.id, user.status === "active" ? "locked" : "active")}
                          loading={updatingId === user.id}
                          title={user.status === "active" ? "Khóa tài khoản" : "Mở khóa"}
                          className={cn(
                            user.status === "active" ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                              : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          )}
                        >
                          {user.status === "active" ? <Lock className="size-4" /> : <Unlock className="size-4" />}
                        </Button>

                        {isViewerAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDelete(user)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Xóa vĩnh viễn"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSheet(user)}
                        >
                          Chi tiết
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">
              {(page - 1) * limit + 1}–{Math.min(page * limit, total)}{" "}
              <span className="opacity-60">/ {total} tài khoản</span>
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="size-4" />
              </Button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                      p === page
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {p}
                  </button>
                );
              })}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── User Detail Sheet ── */}
      <UserSheet
        user={sheetUser}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        viewerRole={userRole}
        onUpdateRole={handleUpdateRole}
        onUpdateStatus={handleUpdateStatus}
        onDeleteClick={openDelete}
        isUpdating={updatingId === sheetUser?.id}
      />

      {/* ── Delete Confirm Dialog ── */}
      <DeleteDialog
        user={deleteTarget}
        open={deleteOpen}
        onConfirm={handleDelete}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        isDeleting={isDeleting}
      />
    </div>
  );
}
