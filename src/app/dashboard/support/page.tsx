"use client";

import React, { useEffect, useRef, useState } from "react";
import { Headphones, Loader2, MessageCircle, RefreshCw, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
}

interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: "user" | "staff" | "admin" | "bot";
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  sender?: SupportUser | SupportUser[] | null;
}

const statusLabels: Record<SupportConversation["status"], string> = {
  open: "Mở",
  pending: "Đang xử lý",
  resolved: "Đã xử lý",
  closed: "Đã đóng",
};

function normalizeUser(user?: SupportUser | SupportUser[] | null): SupportUser | null {
  if (!user) return null;
  return Array.isArray(user) ? user[0] || null : user;
}

export default function SupportDashboardPage() {
  const { session, user } = useAuth();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const token = session?.access_token;

  const fetchConversations = async () => {
    if (!token) return;
    try {
      setLoadingConversations(true);
      const res = await fetch(`${apiUrl}/api/support/conversations?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Không thể tải hội thoại.");
      setConversations(json.data || []);
      if (!selectedConversation && json.data?.length) {
        setSelectedConversation(json.data[0]);
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải hội thoại.");
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId: string, silent = false) => {
    if (!token) return;
    try {
      if (!silent) setLoadingMessages(true);
      const res = await fetch(`${apiUrl}/api/support/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Không thể tải tin nhắn.");
      setSelectedConversation(json.data.conversation);
      setMessages(json.data.messages || []);
    } catch (err: any) {
      if (!silent) setError(err.message || "Không thể tải tin nhắn.");
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [token, statusFilter]);

  useEffect(() => {
    if (selectedConversation?.id) fetchMessages(selectedConversation.id);
  }, [selectedConversation?.id, token]);

  useEffect(() => {
    if (!selectedConversation?.id) return;
    const interval = window.setInterval(() => {
      fetchMessages(selectedConversation.id, true);
      fetchConversations();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [selectedConversation?.id, token, statusFilter]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedConversation?.id]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!token || !selectedConversation?.id || !message.trim() || sending) return;

    try {
      setSending(true);
      const res = await fetch(`${apiUrl}/api/support/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: message }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gửi tin nhắn thất bại.");
      setMessage("");
      setMessages((prev) => [...prev, json.data]);
      fetchConversations();
    } catch (err: any) {
      setError(err.message || "Gửi tin nhắn thất bại.");
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status: SupportConversation["status"]) => {
    if (!token || !selectedConversation?.id) return;
    try {
      const res = await fetch(`${apiUrl}/api/support/conversations/${selectedConversation.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Cập nhật trạng thái thất bại.");
      setSelectedConversation(json.data);
      fetchConversations();
    } catch (err: any) {
      setError(err.message || "Cập nhật trạng thái thất bại.");
    }
  };

  const selectedUser = normalizeUser(selectedConversation?.user);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
            <Headphones className="h-7 w-7 text-blue-600" />
            Support Chat
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Trả lời hội thoại hỗ trợ từ người dùng theo thời gian gần thực.
          </p>
        </div>
        <button
          onClick={() => fetchConversations()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid h-[calc(100vh-210px)] min-h-[560px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[340px_1fr]">
        <aside className="flex min-h-0 flex-col border-b border-slate-200 dark:border-slate-800 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="open">Mở</option>
              <option value="pending">Đang xử lý</option>
              <option value="resolved">Đã xử lý</option>
              <option value="closed">Đã đóng</option>
            </select>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="flex h-full items-center justify-center text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center text-sm text-slate-500">
                <MessageCircle className="mb-3 h-10 w-10 text-slate-300" />
                Chưa có hội thoại hỗ trợ.
              </div>
            ) : (
              conversations.map((conversation) => {
                const customer = normalizeUser(conversation.user);
                const active = selectedConversation?.id === conversation.id;
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full border-b border-slate-100 p-4 text-left transition-colors dark:border-slate-800 ${
                      active ? "bg-blue-50 dark:bg-blue-950/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {customer?.name || customer?.email || "Người dùng"}
                        </p>
                        <p className="truncate text-xs text-slate-500">{customer?.email}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {statusLabels[conversation.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      {conversation.last_message_at
                        ? new Date(conversation.last_message_at).toLocaleString("vi-VN")
                        : new Date(conversation.created_at).toLocaleString("vi-VN")}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          {selectedConversation ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedUser?.name || selectedUser?.email || "Người dùng"}
                  </p>
                  <p className="text-xs text-slate-500">{selectedUser?.email}</p>
                </div>
                <select
                  value={selectedConversation.status}
                  onChange={(e) => updateStatus(e.target.value as SupportConversation["status"])}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="open">Mở</option>
                  <option value="pending">Đang xử lý</option>
                  <option value="resolved">Đã xử lý</option>
                  <option value="closed">Đã đóng</option>
                </select>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-500">
                    <MessageCircle className="mb-3 h-12 w-12 text-slate-300" />
                    Hội thoại chưa có tin nhắn.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const mine = msg.sender_id === user?.id || msg.sender_type === "admin" || msg.sender_type === "staff";
                      return (
                        <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[72%] rounded-2xl px-4 py-2 text-sm ${
                            mine
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                          }`}>
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={`mt-1 text-[10px] ${mine ? "text-blue-100" : "text-slate-400"}`}>
                              {new Date(msg.created_at).toLocaleString("vi-VN")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <form onSubmit={sendMessage} className="flex items-end gap-3 border-t border-slate-200 p-4 dark:border-slate-800">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập phản hồi cho người dùng..."
                  rows={1}
                  className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || sending}
                  className="flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Gửi
                </button>
              </form>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-500">
              <Headphones className="mb-4 h-14 w-14 text-slate-300" />
              Chọn một hội thoại để bắt đầu hỗ trợ.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
