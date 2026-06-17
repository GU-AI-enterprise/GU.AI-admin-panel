"use client";

import { Lock, Unlock, Trash2, Users, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
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
  onlineStaffIds?: Set<string>;
  onPageChange: (page: number) => void;
  onOpenSheet: (user: AdminUser) => void;
  onOpenDelete: (user: AdminUser) => void;
  onUpdateRole: (id: string, role: string) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => void;
}

export function UserTable({
  users, isLoading, isViewerAdmin, updatingId,
  page, limit, total, totalPages, onlineStaffIds,
  onPageChange, onOpenSheet, onOpenDelete,
  onUpdateRole, onUpdateStatus,
}: UserTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {["Người dùng", "Vai trò", "Trạng thái", "Gói & Credit", "Tham gia", ""].map((h, i) => (
              <TableHead key={i} className={cn(i === 5 && "text-right")}>
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="py-20 text-center">
                <Loader2 className="mx-auto size-7 animate-spin text-muted-foreground" />
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="py-20 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Users className="size-10 opacity-30" />
                  <p className="text-sm">Không tìm thấy người dùng phù hợp.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer"
                onClick={() => onOpenSheet(user)}
              >
                {/* User */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <Avatar className="size-9">
                        <AvatarImage src={user.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs font-bold">{initials(user)}</AvatarFallback>
                      </Avatar>
                      {(user.role === "staff" || user.role === "admin") && (
                        <span className={cn(
                          "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card",
                          onlineStaffIds?.has(user.id) ? "bg-emerald-500" : "bg-muted-foreground/30"
                        )} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{displayName(user)}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>

                {/* Role */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RoleDropdown
                    userId={user.id}
                    currentRole={user.role}
                    onUpdate={onUpdateRole}
                    disabled={!isViewerAdmin}
                  />
                </TableCell>

                {/* Status */}
                <TableCell><StatusBadge status={user.status} /></TableCell>

                {/* Plan */}
                <TableCell>
                  <p className="text-xs font-semibold capitalize text-foreground">{user.plan_type || "Free"}</p>
                  <p className="text-xs text-muted-foreground">{(user.current_credit ?? 0).toLocaleString()} credit</p>
                </TableCell>

                {/* Joined */}
                <TableCell className="text-sm text-muted-foreground">{formatDate(user.created_at)}</TableCell>

                {/* Actions */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {isViewerAdmin && (
                      <>
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
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => onOpenDelete(user)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={() => onOpenSheet(user)}>
                      Chi tiết
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

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
