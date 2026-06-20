"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Headphones, Loader2, MessageCircle, RefreshCw, Send,
  UserCheck, Clock, CheckCircle2, XCircle, AlertCircle, Lock, Inbox,
  Check, CheckCheck, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { SOCKET_URL } from "../_config";


interface SupportUser {
  id: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: string | null;
}

interface SupportConversation {
  id: string;
  user_id: string;
  assigned_staff_id?: string | null;
  status: "open" | "pending" | "resolved" | "closed";
  source?: string | null;
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: SupportUser | SupportUser[] | null;
  assigned_staff?: SupportUser | SupportUser[] | null;
}

interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: "customer" | "staff" | "admin" | "bot" | "system";
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  sender?: SupportUser | SupportUser[] | null;
}


function normalizeUser(u?: SupportUser | SupportUser[] | null): SupportUser | null {
  if (!u) return null;
  return Array.isArray(u) ? (u[0] ?? null) : u;
}

function initials(user: SupportUser | null): string {
  if (!user) return "?";
  const src = user.name || user.email || "";
  return src.slice(0, 2).toUpperCase();
}

function UserAvatar({ user, size = "md" }: { user: SupportUser | null; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  if (user?.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar_url}
        alt={user.name || user.email || ""}
        referrerPolicy="no-referrer"
        className={`${dim} shrink-0 rounded-full object-cover border border-border/40`}
      />
    );
  }
  return (
    <div className={`${dim} shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-violet-400/20 font-bold text-primary`}>
      {initials(user)}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

const STATUS_CONFIG = {
  open:     { label: "Mới",        bg: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", icon: Inbox },
  pending:  { label: "Đang xử lý", bg: "bg-amber-100 text-amber-700",    dot: "bg-amber-500",   icon: Clock },
  resolved: { label: "Đã xử lý",   bg: "bg-blue-100 text-blue-700",       dot: "bg-blue-500",    icon: CheckCircle2 },
  closed:   { label: "Đóng",       bg: "bg-accent text-muted-foreground", dot: "bg-border",      icon: XCircle },
} as const;

export default function SupportDashboardPage() {
  const { session, user } = useAuth();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selected, setSelected] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedIdRef = useRef<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const token = session?.access_token;

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchList = async (silent = false) => {
    if (!token) return;
    if (!silent) setLoadingList(true);
    try {
      const res = await fetch(`${apiUrl}/api/support/conversations?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setConversations(json.data || []);
    } catch (e: any) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setLoadingList(false);
    }
  };

  const fetchMessages = async (convId: string, silent = false) => {
    if (!token) return;
    if (!silent) setLoadingMsgs(true);
    try {
      const res = await fetch(`${apiUrl}/api/support/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSelected(json.data.conversation);
      setMessages(json.data.messages || []);
    } catch (e: any) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setLoadingMsgs(false);
    }
  };

  // Stable refs — socket handlers always see the latest fetch fns/selection without reconnecting
  const fetchListRef = useRef(fetchList);
  const fetchMessagesRef = useRef(fetchMessages);
  useEffect(() => { fetchListRef.current = fetchList; }, [fetchList]);
  useEffect(() => { fetchMessagesRef.current = fetchMessages; }, [fetchMessages]);
  useEffect(() => { selectedIdRef.current = selected?.id ?? null; }, [selected?.id]);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { fetchList(); }, [token, statusFilter]);

  useEffect(() => {
    if (selected?.id) fetchMessages(selected.id);
  }, [selected?.id, token]);

  // Socket.IO — real-time updates instead of polling. Join "admins" room for new-message
  // badges across all conversations, and the active conversation's room for live messages.
  useEffect(() => {
    if (!token) return;
    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = s;

    s.on("connect", () => {
      s.emit("join-admin");
      if (selectedIdRef.current) s.emit("join-conversation", selectedIdRef.current);
    });
    s.on("connect_error", (err) => console.warn("[Socket] connect_error:", err.message));

    s.on("support:needs_help", () => fetchListRef.current(true));

    s.on("message", (payload: { conversationId?: string }) => {
      if (payload?.conversationId && payload.conversationId === selectedIdRef.current) {
        fetchMessagesRef.current(payload.conversationId, true);
      }
      fetchListRef.current(true);
    });

    s.on("support:read_receipt", (payload: { conversationId?: string }) => {
      if (payload?.conversationId && payload.conversationId === selectedIdRef.current) {
        fetchMessagesRef.current(payload.conversationId, true);
      }
    });

    return () => { s.disconnect(); socketRef.current = null; };
  }, [token]);

  // Join/leave the active conversation's room as the selection changes
  useEffect(() => {
    const s = socketRef.current;
    if (!s || !selected?.id) return;
    s.emit("join-conversation", selected.id);
    return () => { s.emit("leave-conversation", selected.id); };
  }, [selected?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    setLockedBy(null);
  }, [selected?.id]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!token || !selected?.id || !draft.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`${apiUrl}/api/support/conversations/${selected.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: draft }),
      });
      const json = await res.json();
      if (res.status === 409) {
        const staffId = json.data?.assigned_staff_id;
        setLockedBy(staffId || "staff khác");
        return;
      }
      if (!json.success) throw new Error(json.error);
      setDraft("");
      setMessages((prev) => [...prev, json.data]);
      fetchMessages(selected.id, true);
      fetchList(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status: SupportConversation["status"]) => {
    if (!token || !selected?.id) return;
    try {
      const res = await fetch(`${apiUrl}/api/support/conversations/${selected.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSelected(json.data);
      fetchList(true);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const customer = normalizeUser(selected?.user);
  const assignedStaff = normalizeUser(selected?.assigned_staff);
  const isAssignedToMe = selected?.assigned_staff_id === user?.id;
  const isAssignedToOther = !!selected?.assigned_staff_id && !isAssignedToMe;
  const isUnassigned = !selected?.assigned_staff_id;
  const canReply = selected && selected.status !== "closed" && selected.status !== "resolved";
  const statusCfg = selected ? STATUS_CONFIG[selected.status] : null;

  return (
    <div className="flex h-full flex-col gap-0">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Headphones className="h-4 w-4" />
            </div>
            Hỗ trợ người dùng
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ai trả lời trước sẽ được nhận cuộc hội thoại đó
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-ring"
          >
            <option value="all">Tất cả</option>
            <option value="open">Mới</option>
            <option value="pending">Đang xử lý</option>
            <option value="resolved">Đã xử lý</option>
            <option value="closed">Đã đóng</option>
          </select>
          <button
            onClick={() => fetchList()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-2.5 text-sm text-destructive shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

        {/* ── Conversation list ─────────────────────────────────────────── */}
        <aside className="flex w-80 shrink-0 flex-col border-r border-border">
          <div className="border-b border-border px-4 py-3 shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {conversations.length} cuộc hội thoại
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Chưa có hội thoại nào.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const cust = normalizeUser(conv.user);
                const aStaff = normalizeUser(conv.assigned_staff);
                const active = selected?.id === conv.id;
                const cfg = STATUS_CONFIG[conv.status];

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelected(conv)}
                    className={`group w-full border-b border-border/60 px-4 py-3.5 text-left transition-all ${
                      active
                        ? "bg-primary/8 border-l-2 border-l-primary"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar user={cust} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {cust?.name || cust?.email?.split("@")[0] || "Người dùng"}
                          </p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg}`}>
                            {cfg.label}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{cust?.email}</p>

                        <div className="mt-1.5 flex items-center justify-between">
                          {aStaff ? (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <UserCheck className="h-3 w-3 text-emerald-500" />
                              {aStaff.name || aStaff.email?.split("@")[0]}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-500">Chưa nhận</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {conv.last_message_at ? timeAgo(conv.last_message_at) : timeAgo(conv.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Chat panel ───────────────────────────────────────────────── */}
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5 shrink-0">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/dashboard/users?highlight=${selected.user_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="group flex items-center gap-3 rounded-xl p-1 -m-1 hover:bg-accent transition-colors"
                    title="Xem hồ sơ người dùng"
                  >
                    <UserAvatar user={customer} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {customer?.name || customer?.email?.split("@")[0] || "Người dùng"}
                        </p>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xs text-muted-foreground">{customer?.email}</p>
                    </div>
                  </Link>
                </div>

                <div className="flex items-center gap-2.5">
                  {assignedStaff && (
                    <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      <UserCheck className="h-3.5 w-3.5" />
                      {isAssignedToMe ? "Bạn đang xử lý" : (assignedStaff.name || assignedStaff.email?.split("@")[0])}
                    </div>
                  )}
                  {isUnassigned && (
                    <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                      <Clock className="h-3.5 w-3.5" />
                      Chưa được nhận
                    </div>
                  )}

                  <select
                    value={selected.status}
                    onChange={(e) => updateStatus(e.target.value as SupportConversation["status"])}
                    className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:border-ring"
                  >
                    <option value="open">Mới</option>
                    <option value="pending">Đang xử lý</option>
                    <option value="resolved">Đã xử lý</option>
                    <option value="closed">Đóng</option>
                  </select>
                </div>
              </div>

              {/* Assignment banners */}
              {isUnassigned && canReply && (
                <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-5 py-2.5 text-xs text-amber-700 shrink-0">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  Trả lời trước để nhận cuộc hội thoại này.
                </div>
              )}
              {isAssignedToOther && (
                <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50 px-5 py-2.5 text-xs text-rose-700 shrink-0">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  Cuộc hội thoại này đang được xử lý bởi{" "}
                  <span className="font-semibold">{assignedStaff?.name || assignedStaff?.email?.split("@")[0]}</span>.
                  Chỉ Admin mới có thể can thiệp.
                </div>
              )}
              {lockedBy && (
                <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50 px-5 py-2.5 text-xs text-rose-700 shrink-0">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  Không thể gửi — cuộc hội thoại đã được nhận bởi staff khác.
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {loadingMsgs ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <MessageCircle className="mb-3 h-12 w-12 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Chưa có tin nhắn. Hãy là người đầu tiên phản hồi!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      // Last staff/admin message (mine or other) that customer has read
                      let lastReadStaffIdx = -1;
                      messages.forEach((m, i) => {
                        if (m.sender_type !== "customer" && m.is_read) lastReadStaffIdx = i;
                      });
                      return messages.map((msg, msgIdx) => {
                        const isMe = msg.sender_id === user?.id;
                        const isCustomer = msg.sender_type === "customer";
                        const isOtherStaff = !isMe && !isCustomer;
                        const isImage = msg.message_type === "image";
                        const sender = normalizeUser(msg.sender);
                        const alignRight = isMe;
                        const showReadReceipt = isMe && msgIdx === lastReadStaffIdx;

                        let bubbleClass = "";
                        let timeClass = "";
                        if (isMe) {
                          bubbleClass = "bg-primary text-primary-foreground";
                          timeClass  = "text-primary-foreground/60";
                        } else if (isOtherStaff) {
                          bubbleClass = "bg-violet-100 text-violet-900";
                          timeClass  = "text-violet-400";
                        } else {
                          bubbleClass = "bg-accent text-foreground";
                          timeClass  = "text-muted-foreground";
                        }

                        let senderLabel = "";
                        if (isMe) senderLabel = "Bạn";
                        else if (isOtherStaff) senderLabel = sender?.name || sender?.email?.split("@")[0] || "Staff";
                        else senderLabel = sender?.name || sender?.email?.split("@")[0] || "Khách hàng";

                        return (
                          <div key={msg.id} className={`flex flex-col ${alignRight ? "items-end" : "items-start"}`}>
                            <p className="mb-1 px-1 text-[10px] text-muted-foreground">{senderLabel}</p>

                            {isImage ? (
                              <div className={`max-w-[68%] overflow-hidden rounded-2xl shadow-sm ${bubbleClass}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={msg.content}
                                  alt="Ảnh"
                                  className="block max-h-64 w-auto max-w-full cursor-pointer object-cover"
                                  onClick={() => window.open(msg.content, "_blank")}
                                  loading="lazy"
                                />
                                <div className={`flex items-center justify-end gap-1 px-3 py-1.5 ${timeClass}`}>
                                  <span className="text-[10px]">
                                    {new Date(msg.created_at).toLocaleString("vi-VN")}
                                  </span>
                                  {isMe && (showReadReceipt
                                    ? <CheckCheck className="h-3 w-3 text-sky-300 shrink-0" />
                                    : <Check className="h-3 w-3 opacity-50 shrink-0" />
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className={`max-w-[68%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${bubbleClass}`}>
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                <div className={`mt-1.5 flex items-center justify-end gap-1 ${timeClass}`}>
                                  <span className="text-[10px]">
                                    {new Date(msg.created_at).toLocaleString("vi-VN")}
                                  </span>
                                  {isMe && (showReadReceipt
                                    ? <CheckCheck className="h-3 w-3 text-sky-300 shrink-0" />
                                    : <Check className="h-3 w-3 opacity-50 shrink-0" />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border p-4 shrink-0">
                {!canReply ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4" />
                    Cuộc hội thoại đã {selected.status === "closed" ? "đóng" : "xử lý xong"}.
                  </div>
                ) : (
                  <form onSubmit={sendMessage} className="flex items-end gap-2.5">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={
                        isAssignedToOther
                          ? "Bạn không thể trả lời cuộc hội thoại này..."
                          : isUnassigned
                          ? "Trả lời để nhận cuộc hội thoại..."
                          : "Nhập phản hồi... (Enter để gửi)"
                      }
                      disabled={isAssignedToOther}
                      rows={1}
                      className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-accent/50 px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim() || sending || isAssignedToOther}
                      className="flex h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Gửi
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
                <Headphones className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Chọn cuộc hội thoại</p>
                <p className="mt-1 text-sm text-muted-foreground">để bắt đầu hỗ trợ người dùng</p>
              </div>
            </div>
          )}
        </section>
      </div>

    </div>
  );
}
