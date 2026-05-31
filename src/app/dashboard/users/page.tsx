"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchUsers, fetchStats,
  updateUserRole, updateUserStatus, deleteUser,
  setPage, setLimit, setSearch, setRoleFilter, setStatusFilter,
  openSheet, closeSheet, openDeleteDialog, closeDeleteDialog,
  selectUsers, selectStats, selectUsersLoading, selectPagination,
  selectFilters, selectUpdatingId, selectSheetUser, selectDeleteTarget,
} from "@/features/users/usersSlice";
import { StatCards }   from "@/features/users/components/StatCards";
import { UserTable }   from "@/features/users/components/UserTable";
import { UserSheet }   from "@/features/users/components/UserSheet";
import { DeleteDialog } from "@/features/users/components/DeleteDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminUser } from "@/features/users/usersSlice";

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { userRole } = useAuth();
  const isViewerAdmin = userRole === "admin";

  // Redux selectors
  const users      = useAppSelector(selectUsers);
  const stats      = useAppSelector(selectStats);
  const isLoading  = useAppSelector(selectUsersLoading);
  const pagination = useAppSelector(selectPagination);
  const filters    = useAppSelector(selectFilters);
  const updatingId = useAppSelector(selectUpdatingId);
  const sheetUser  = useAppSelector(selectSheetUser);
  const deleteTarget = useAppSelector(selectDeleteTarget);

  const [searchInput, setSearchInput] = useState(filters.search);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search → Redux
  useEffect(() => {
    const t = setTimeout(() => dispatch(setSearch(searchInput)), 400);
    return () => clearTimeout(t);
  }, [searchInput, dispatch]);

  // Fetch when filters/pagination change
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch, pagination.page, pagination.limit, filters.search, filters.roleFilter, filters.statusFilter]);

  // Initial stats fetch
  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([dispatch(fetchUsers()), dispatch(fetchStats())]);
    setIsRefreshing(false);
  };

  const handleUpdateRole = useCallback(async (id: string, role: string) => {
    await dispatch(updateUserRole({ id, role }));
    dispatch(fetchStats());
  }, [dispatch]);

  const handleUpdateStatus = useCallback(async (id: string, status: string) => {
    await dispatch(updateUserStatus({ id, status }));
    dispatch(fetchStats());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await dispatch(deleteUser(deleteTarget.id));
    dispatch(fetchStats());
    setIsDeleting(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý người dùng</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Xem, phân quyền và quản lý tất cả tài khoản trong hệ thống.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} loading={isRefreshing}>
          <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
          Làm mới
        </Button>
      </div>

      {/* Stats */}
      <StatCards stats={stats} />

      {/* Filters */}
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
              value: filters.roleFilter,
              onChange: (v: string) => dispatch(setRoleFilter(v)),
              options: [
                { value: "all",      label: "Tất cả vai trò" },
                { value: "admin",    label: "Admin" },
                { value: "staff",    label: "Staff" },
                { value: "customer", label: "Customer" },
              ],
            },
            {
              value: filters.statusFilter,
              onChange: (v: string) => dispatch(setStatusFilter(v)),
              options: [
                { value: "all",    label: "Tất cả trạng thái" },
                { value: "active", label: "Hoạt động" },
                { value: "locked", label: "Đã khóa" },
              ],
            },
            {
              value: String(pagination.limit),
              onChange: (v: string) => dispatch(setLimit(Number(v))),
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

      {/* Table */}
      <UserTable
        users={users}
        isLoading={isLoading}
        isViewerAdmin={isViewerAdmin}
        updatingId={updatingId}
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={(p) => dispatch(setPage(p))}
        onOpenSheet={(u: AdminUser) => dispatch(openSheet(u.id))}
        onOpenDelete={(u: AdminUser) => dispatch(openDeleteDialog(u.id))}
        onUpdateRole={handleUpdateRole}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* User detail sheet */}
      <UserSheet
        user={sheetUser ?? null}
        open={!!sheetUser}
        onClose={() => dispatch(closeSheet())}
        viewerRole={userRole}
        onUpdateRole={handleUpdateRole}
        onUpdateStatus={handleUpdateStatus}
        onDeleteClick={(u: AdminUser) => dispatch(openDeleteDialog(u.id))}
        isUpdating={updatingId === sheetUser?.id}
      />

      {/* Delete confirm */}
      <DeleteDialog
        user={deleteTarget ?? null}
        open={!!deleteTarget}
        onConfirm={handleDelete}
        onClose={() => dispatch(closeDeleteDialog())}
        isDeleting={isDeleting}
      />
    </div>
  );
}
