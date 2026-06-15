"use client";

import { useState } from "react";
import { Send, CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

const DEFAULT_TO = "dathtse196321@gmail.com";

type Status = "idle" | "loading" | "success" | "error";
type Sender = "noreply" | "support";

export default function EmailPage() {
  const [to, setTo] = useState(DEFAULT_TO);
  const [subject, setSubject] = useState("Test email từ GU.AI Admin");
  const [html, setHtml] = useState(
    "<h2>Xin chào!</h2><p>Đây là email test được gửi từ <strong>GU.AI Admin Panel</strong>.</p>"
  );
  const [sender, setSender] = useState<Sender>("noreply");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html, sender }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setMessage(`Đã gửi thành công từ ${data.from} → ${data.to}`);
      } else {
        setStatus("error");
        setMessage(data.error ?? "Gửi thất bại");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message ?? "Lỗi mạng");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Gửi Email Test</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kiểm tra kết nối SMTP — chọn sender và gửi thử.
        </p>
      </div>

      {/* Sender selector */}
      <div className="grid grid-cols-2 gap-3">
        {(["noreply", "support"] as Sender[]).map((s) => (
          <button
            key={s}
            onClick={() => setSender(s)}
            className={`rounded-xl border p-4 text-left transition-all ${
              sender === s
                ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <p className={`text-sm font-semibold ${sender === s ? "text-primary" : "text-foreground"}`}>
              {s === "noreply" ? "noreply@guai.com.vn" : "support@guai.com.vn"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {s === "noreply"
                ? "Hệ thống tự động — user không cần reply"
                : "Hỗ trợ — user có thể reply trực tiếp"}
            </p>
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        {/* To */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Người nhận</label>
          <div className="relative">
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tiêu đề</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2.5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
          />
        </div>

        {/* Body */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nội dung (HTML)</label>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-border bg-background py-2.5 px-4 text-sm text-foreground font-mono outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none"
          />
        </div>

        {/* Status */}
        {status !== "idle" && (
          <div className={`flex items-center gap-2.5 rounded-lg border p-3 text-sm ${
            status === "success" ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-600"
            : status === "error" ? "border-destructive/20 bg-destructive/8 text-destructive"
            : "border-border bg-muted/30 text-muted-foreground"
          }`}>
            {status === "loading" && <Loader2 className="size-4 animate-spin shrink-0" />}
            {status === "success" && <CheckCircle className="size-4 shrink-0" />}
            {status === "error" && <XCircle className="size-4 shrink-0" />}
            <span className="text-xs">{status === "loading" ? "Đang gửi..." : message}</span>
          </div>
        )}

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={status === "loading" || !to || !subject}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {status === "loading" ? "Đang gửi..." : `Gửi từ ${sender}@guai.com.vn`}
        </button>
      </div>

      {/* Preview */}
      {html && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preview</p>
          <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      )}
    </div>
  );
}
