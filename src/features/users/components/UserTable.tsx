"use client";

import { Lock, Unlock, Trash2, Users, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "./RoleBadge";
import { StatusBadge } from "./StatusBadge";
import { RoleDropdown } from "./RoleDropdown";
import { cn } from "@/lib/utils";
import type { AdminUser } from "@/features/users/usersSlice";

function displayName(u: AdminUser) { return u.name || u.email.split("@")[0]; }
function initials(u: AdminUser) { return displayName(u).charAt(0).toUpperCase(); }
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface UserTableProps {
  users: AdminUser[];
  isLoading: boolean;
  isViewerAdmin: boolean;
  updatingId: string | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenSheet: (user: AdminUser) => void;
  onOpenDelete: (user: AdminUser) => void;
  onUpdateRole: (id: string, role: string) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => void;
}

export function UserTable({
  users, isLoading, isViewerAdmin, updatingId,
  page, limit, total, totalPages,
  onPageChange, onOpenSheet, onOpenDelete,
  onUpdateRole, onUpdateStatus,
}: UserTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-accent/30">
              {["Người dùng", "Vai trò", "Trạng thái", "Gói & Credit", "Tham gia", ""].map((h, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                    i === 5 && "text-right"
                  )}
                >
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
                  onClick={() => onOpenSheet(user)}
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
                      onUpdate={onUpdateRole}
                      disabled={!isViewerAdmin}
                    />
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4"><StatusBadge status={user.status} /></td>

                  {/* Plan */}
                  <td className="px-5 py-4">
                    <p className="text-xs font-semibold capitalize text-foreground">{user.plan_type || "Free"}</p>
                    <p className="text-xs text-muted-foreground">{(user.current_credit ?? 0).toLocaleString()} credit</p>
                  </td>

                  {/* Joined */}
                  <td className="px-5 py-4 text-sm text-muted-foreground">{formatDate(user.created_at)}</td>

                  {/* Actions */}
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="icon"
                        loading={updatingId === user.id}
                        onClick={() => onUpdateStatus(user.id, user.status === "active" ? "locked" : "active")}
                        title={user.status === "active" ? "Khóa tài khoản" : "Mở khóa"}
                        className={user.status === "active"
                          ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                          : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"}
                      >
                        {user.status === "active" ? <Lock className="size-4" /> : <Unlock className="size-4" />}
                      </Button>
                      {isViewerAdmin && (
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => onOpenDelete(user)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => onOpenSheet(user)}>
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

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)}{" "}
            <span className="opacity-60">/ {total}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
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
                  onClick={() => onPageChange(p)}
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
            <Button variant="ghost" size="icon" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
