"use client";

import { useEffect, useState } from "react";
import { CreditCard, ExternalLink, Loader2, Package } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Transaction } from "./_types";
import { API_URL, getTxCfg } from "./_config";
import { InfoRow, SectionLabel, UserSection } from "./_ui";

export function PaymentDetailSheet({
  tx, token, onClose,
}: {
  tx: Transaction | null;
  token: string;
  onClose: () => void;
}) {
  const [detail,  setDetail]  = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tx || !token) return;
    setDetail(null); setLoading(true);
    fetch(`${API_URL}/api/admin/transactions/${tx.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(j => { if (j.data) setDetail(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tx?.id, token]);

  const cfg = getTxCfg(tx?.status ?? "pending");
  const d   = detail ?? tx;

  return (
    <Sheet open={!!tx} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent className="w-[420px] max-w-[95vw] flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <CreditCard className="size-4 text-primary shrink-0"/>
            <SheetTitle className="text-base">Chi tiết giao dịch</SheetTitle>
          </div>
          {tx && (
            <SheetDescription asChild>
              <span className={cn("self-start text-[11px] font-medium px-2 py-0.5 rounded-full border mt-1", cfg.badge)}>
                {cfg.label}
              </span>
            </SheetDescription>
          )}
        </SheetHeader>

        {tx && (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

            <section>
              <SectionLabel icon={<CreditCard className="size-3"/>}>Giao dịch</SectionLabel>
              <div className="rounded-xl border border-border bg-muted/30 divide-y divide-border/60">
                <InfoRow label="Mã đơn">
                  <span className="font-mono text-[11px] text-muted-foreground">{d?.provider_transaction_id ?? "—"}</span>
                </InfoRow>
                <InfoRow label="Số tiền">
                  <span className="font-bold text-foreground">{Number(d?.amount ?? 0).toLocaleString("vi-VN")}đ</span>
                </InfoRow>
                <InfoRow label="Nhà cung cấp">
                  <span className="uppercase font-semibold text-xs">{d?.provider ?? "—"}</span>
                </InfoRow>
                <InfoRow label="Tạo lúc">
                  {d?.created_at
                    ? new Date(d.created_at).toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})
                    : "—"}
                </InfoRow>
                {d?.paid_at && (
                  <InfoRow label="Thanh toán lúc">
                    {new Date(d.paid_at).toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                  </InfoRow>
                )}
                {d?.payment_url && (
                  <div className="flex items-center justify-between gap-4 py-2.5 px-3">
                    <span className="text-xs text-muted-foreground shrink-0">Link thanh toán</span>
                    <a href={d.payment_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline">
                      Mở <ExternalLink className="size-3"/>
                    </a>
                  </div>
                )}
              </div>
            </section>

            {d?.package && (
              <section>
                <SectionLabel icon={<Package className="size-3"/>}>Gói credits</SectionLabel>
                <div className="rounded-xl border border-border bg-muted/30 divide-y divide-border/60">
                  <InfoRow label="Tên gói"><span className="font-medium">{d.package.name}</span></InfoRow>
                  <InfoRow label="Credits"><span className="font-bold text-foreground">{d.package.credit_amount}</span></InfoRow>
                  {d.package.bonus_credit > 0 && (
                    <InfoRow label="Bonus"><span className="text-emerald-600 font-medium">+{d.package.bonus_credit}</span></InfoRow>
                  )}
                  <InfoRow label="Giá niêm yết">
                    {d.package.price ? `${Number(d.package.price).toLocaleString("vi-VN")}đ` : "—"}
                  </InfoRow>
                </div>
              </section>
            )}

            {loading && (
              <div className="flex items-center justify-center py-4 text-muted-foreground gap-2">
                <Loader2 className="size-4 animate-spin"/>
                <span className="text-xs">Đang tải...</span>
              </div>
            )}

            {d?.user && <UserSection user={d.user}/>}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
