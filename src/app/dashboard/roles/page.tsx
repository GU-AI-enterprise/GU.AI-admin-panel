"use client";

import { useState } from "react";
import { Shield, ShieldAlert, Check, AlertCircle, RefreshCw } from "lucide-react";

interface RolePermission {
  role: string;
  description: string;
  usersCount: number;
  permissions: {
    users: { read: boolean; write: boolean; delete: boolean };
    roles: { read: boolean; write: boolean; delete: boolean };
    system: { read: boolean; write: boolean };
  };
}

const initialRoles: RolePermission[] = [
  {
    role: "Admin",
    description: "Toàn quyền quản trị, kiểm soát toàn bộ hệ thống và thiết lập bảo mật.",
    usersCount: 1,
    permissions: {
      users: { read: true, write: true, delete: true },
      roles: { read: true, write: true, delete: true },
      system: { read: true, write: true },
    },
  },
  {
    role: "Manager",
    description: "Quản lý nhân sự, phê duyệt và xử lý tài khoản, không có quyền can thiệp cấu hình hệ thống.",
    usersCount: 1,
    permissions: {
      users: { read: true, write: true, delete: false },
      roles: { read: true, write: false, delete: false },
      system: { read: true, write: false },
    },
  },
  {
    role: "Support",
    description: "Xem thông tin người dùng và hỗ trợ kỹ thuật cơ bản.",
    usersCount: 1,
    permissions: {
      users: { read: true, write: false, delete: false },
      roles: { read: false, write: false, delete: false },
      system: { read: false, write: false },
    },
  },
  {
    role: "User",
    description: "Người dùng thông thường sử dụng dịch vụ.",
    usersCount: 4,
    permissions: {
      users: { read: false, write: false, delete: false },
      roles: { read: false, write: false, delete: false },
      system: { read: false, write: false },
    },
  },
];

export default function RolesManagement() {
  const [roles, setRoles] = useState<RolePermission[]>(initialRoles);
  const [selectedRole, setSelectedRole] = useState<string>("Admin");

  const currentRoleData = roles.find((r) => r.role === selectedRole)!;

  const togglePermission = (
    category: "users" | "roles" | "system",
    action: "read" | "write" | "delete"
  ) => {
    setRoles(
      roles.map((r) => {
        if (r.role !== selectedRole) return r;
        const currentCategory = r.permissions[category] as any;
        if (currentCategory[action] !== undefined) {
          return {
            ...r,
            permissions: {
              ...r.permissions,
              [category]: {
                ...currentCategory,
                [action]: !currentCategory[action],
              },
            },
          };
        }
        return r;
      })
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Phân quyền & Vai trò</h1>
        <p className="text-sm text-slate-500">Cấu hình chi tiết quyền truy cập của từng vai trò trong hệ thống.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Cột danh sách vai trò */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh sách vai trò</span>
          <div className="space-y-2">
            {roles.map((item) => (
              <button
                key={item.role}
                onClick={() => setSelectedRole(item.role)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedRole === item.role
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${
                    selectedRole === item.role
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}>
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{item.role}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{item.usersCount} tài khoản</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cột cấu hình quyền */}
        <div className="md:col-span-2 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quyền hạn chi tiết cho: {selectedRole}</span>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{currentRoleData.description}</p>
            </div>

            {/* Các nhóm quyền */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Nhóm 1: Quản lý Users */}
              <div className="py-4 first:pt-0">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Phân hệ Người dùng</h4>
                  <span className="text-xs text-slate-400">Cho phép thao tác với danh sách tài khoản người dùng</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(currentRoleData.permissions.users).map(([action, allowed]) => (
                    <button
                      key={action}
                      onClick={() => togglePermission("users", action as any)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                        allowed
                          ? "border-emerald-200 bg-emerald-50/40 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/10 dark:text-emerald-400"
                          : "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-800/20"
                      }`}
                    >
                      <span className="capitalize">
                        {action === "read" ? "Xem danh sách" : action === "write" ? "Thêm / Sửa" : "Xóa tài khoản"}
                      </span>
                      {allowed ? <Check className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nhóm 2: Quản lý Phân quyền */}
              <div className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Phân hệ Vai trò & Bảo mật</h4>
                  <span className="text-xs text-slate-400">Cho phép điều chỉnh vai trò và quyền hạn</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(currentRoleData.permissions.roles).map(([action, allowed]) => (
                    <button
                      key={action}
                      onClick={() => togglePermission("roles", action as any)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                        allowed
                          ? "border-emerald-200 bg-emerald-50/40 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/10 dark:text-emerald-400"
                          : "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-800/20"
                      }`}
                    >
                      <span className="capitalize">
                        {action === "read" ? "Xem danh sách" : action === "write" ? "Thêm / Sửa" : "Xóa vai trò"}
                      </span>
                      {allowed ? <Check className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nhóm 3: Hệ thống */}
              <div className="py-4 last:pb-0">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Phân hệ Cấu hình hệ thống</h4>
                  <span className="text-xs text-slate-400">Can thiệp máy chủ, kết nối API hoặc cơ sở dữ liệu</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(currentRoleData.permissions.system).map(([action, allowed]) => (
                    <button
                      key={action}
                      onClick={() => togglePermission("system", action as any)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                        allowed
                          ? "border-emerald-200 bg-emerald-50/40 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/10 dark:text-emerald-400"
                          : "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-800/20"
                      }`}
                    >
                      <span className="capitalize">
                        {action === "read" ? "Xem thông số máy chủ" : "Chỉnh sửa cấu hình API"}
                      </span>
                      {allowed ? <Check className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-4 text-xs font-medium text-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Lưu ý: Mọi thay đổi về phân quyền sẽ có hiệu lực ngay lập tức cho các tài khoản đang hoạt động dưới vai trò này.</span>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => alert("Đã lưu thay đổi cấu hình phân quyền!")}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 hover:bg-blue-700 active:scale-[0.98] transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Cập nhật quyền
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
