"use client";

import { useState } from "react";
import {
  Search,
  UserPlus,
  Filter,
  MoreVertical,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  X,
  UserCheck,
  Mail,
  Shield,
  Calendar,
  AlertCircle
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Support" | "User";
  status: "active" | "pending" | "locked";
  joined: string;
}

const initialUsers: User[] = [
  { id: "US-001", name: "Nguyễn Minh Anh", email: "minhanh@example.com", role: "Admin", status: "active", joined: "22/05/2026" },
  { id: "US-002", name: "Trần Quốc Huy", email: "quochuy@example.com", role: "Manager", status: "active", joined: "18/05/2026" },
  { id: "US-003", name: "Lê Hoàng Nam", email: "hoangnam@example.com", role: "User", status: "pending", joined: "16/05/2026" },
  { id: "US-004", name: "Phạm Gia Linh", email: "gialinh@example.com", role: "Support", status: "active", joined: "11/05/2026" },
  { id: "US-005", name: "Vũ Hải Đăng", email: "haidang@example.com", role: "User", status: "locked", joined: "03/05/2026" },
  { id: "US-006", name: "Đỗ Thùy Trang", email: "thuytrang@example.com", role: "User", status: "active", joined: "28/04/2026" },
  { id: "US-007", name: "Hoàng Văn Đức", email: "vanduc@example.com", role: "User", status: "pending", joined: "25/04/2026" },
];

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // State Modal Thêm User mới
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"Admin" | "Manager" | "Support" | "User">("User");

  // State Modal Xem Chi Tiết User
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Lọc danh sách người dùng
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Xử lý Thay đổi Trạng thái tài khoản
  const handleUpdateStatus = (id: string, newStatus: "active" | "pending" | "locked") => {
    setUsers(users.map((u) => (u.id === id ? { ...u, status: newStatus } : u)));
    if (selectedUser?.id === id) {
      setSelectedUser({ ...selectedUser, status: newStatus });
    }
  };

  // Xóa tài khoản
  const handleDeleteUser = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống?")) {
      setUsers(users.filter((u) => u.id !== id));
      setSelectedUser(null);
    }
  };

  // Tạo người dùng mới
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const newUser: User = {
      id: `US-0${users.length + 1}`,
      name: newName,
      email: newEmail,
      role: newRole,
      status: "active",
      joined: new Date().toLocaleDateString("vi-VN"),
    };

    setUsers([newUser, ...users]);
    setIsAddOpen(false);
    setNewName("");
    setNewEmail("");
    setNewRole("User");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Quản lý người dùng</h1>
          <p className="text-sm text-slate-500">Xem danh sách, phê duyệt, phân quyền hoặc khóa tài khoản của người dùng.</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          <UserPlus className="h-4 w-4" />
          Thêm người dùng
        </button>
      </div>

      {/* Tìm kiếm và Bộ lọc */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:flex-row md:items-center dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, email hoặc mã tài khoản..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 text-slate-500">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">Lọc</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="pending">Chờ duyệt</option>
            <option value="locked">Đã khóa</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Support">Support</option>
            <option value="User">User</option>
          </select>
        </div>
      </div>

      {/* Bảng Danh sách Người dùng */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Họ tên / Email</th>
                <th className="py-4 px-6">Vai trò</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6">Ngày tham gia</th>
                <th className="py-4 px-6 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="py-4 px-6 text-sm font-semibold text-slate-400 dark:text-slate-500">
                      {user.id}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold dark:bg-blue-950/40 dark:text-blue-400">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</div>
                          <div className="text-xs text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                        user.role === "Admin" ? "text-indigo-600 dark:text-indigo-400" :
                        user.role === "Manager" ? "text-blue-600 dark:text-blue-400" :
                        user.role === "Support" ? "text-teal-600 dark:text-teal-400" :
                        "text-slate-600 dark:text-slate-400"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.status === "active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" :
                        user.status === "pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400" :
                        "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          user.status === "active" ? "bg-emerald-500" :
                          user.status === "pending" ? "bg-amber-500" :
                          "bg-rose-500"
                        }`} />
                        {user.status === "active" ? "Hoạt động" : user.status === "pending" ? "Chờ duyệt" : "Đã khóa"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500">
                      {user.joined}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
                        >
                          Chi tiết
                        </button>
                        <div className="relative group">
                          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {/* Dropdown hành động */}
                          <div className="absolute right-0 top-full z-10 mt-1 hidden w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl group-hover:block dark:border-slate-800 dark:bg-slate-900">
                            {user.status === "pending" && (
                              <button
                                onClick={() => handleUpdateStatus(user.id, "active")}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Phê duyệt
                              </button>
                            )}
                            {user.status === "active" ? (
                              <button
                                onClick={() => handleUpdateStatus(user.id, "locked")}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                              >
                                <Lock className="h-4 w-4" />
                                Khóa tài khoản
                              </button>
                            ) : (
                              user.status === "locked" && (
                                <button
                                  onClick={() => handleUpdateStatus(user.id, "active")}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                >
                                  <Unlock className="h-4 w-4" />
                                  Kích hoạt lại
                                </button>
                              )
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                              <Trash2 className="h-4 w-4" />
                              Xóa vĩnh viễn
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-8 w-8 text-slate-300" />
                      <span>Không tìm thấy người dùng phù hợp.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Thêm người dùng mới */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thêm tài khoản mới</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Địa chỉ Email</label>
                <input
                  type="email"
                  required
                  placeholder="nguyenvana@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Vai trò</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="User">User</option>
                  <option value="Support">Support</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Lưu tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Xem Chi Tiết Người Dùng */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chi tiết tài khoản</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {/* Profile Card */}
              <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-2xl font-black dark:bg-blue-950/50 dark:text-blue-400">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{selectedUser.name}</h4>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    selectedUser.status === "active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" :
                    selectedUser.status === "pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400" :
                    "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                  }`}>
                    {selectedUser.status === "active" ? "Hoạt động" : selectedUser.status === "pending" ? "Chờ duyệt" : "Đã khóa"}
                  </span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Mã tài khoản</span>
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedUser.id}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Họ và tên</span>
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedUser.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Email</span>
                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {selectedUser.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Vai trò quản trị</span>
                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-slate-400" />
                    {selectedUser.role}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Ngày tham gia</span>
                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {selectedUser.joined}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase">Thao tác nhanh tài khoản</span>
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedUser.status === "pending" && (
                    <button
                      onClick={() => handleUpdateStatus(selectedUser.id, "active")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Phê duyệt hoạt động
                    </button>
                  )}
                  {selectedUser.status === "active" ? (
                    <button
                      onClick={() => handleUpdateStatus(selectedUser.id, "locked")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Khóa tài khoản ngay
                    </button>
                  ) : (
                    selectedUser.status === "locked" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedUser.id, "active")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400"
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        Mở khóa hoạt động
                      </button>
                    )
                  )}
                  <button
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa vĩnh viễn
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
