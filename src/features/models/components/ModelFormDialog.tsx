"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { UploadCloud } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AppModel, PlanTier } from "../modelsSlice";

const TIERS: { value: PlanTier; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
];

const GENDERS = [
  { value: "", label: "Không chọn" },
  { value: "female", label: "Nữ" },
  { value: "male", label: "Nam" },
  { value: "unisex", label: "Unisex" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  editing: AppModel | null;
  onSubmit: (formData: FormData, id?: string) => Promise<void>;
  isSaving: boolean;
}

export function ModelFormDialog({ open, onClose, editing, onSubmit, isSaving }: Props) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [tags, setTags] = useState("");
  const [requiredTier, setRequiredTier] = useState<PlanTier>("free");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setGender(editing?.gender ?? "");
    setTags(editing?.tags?.join(", ") ?? "");
    setRequiredTier(editing?.required_tier ?? "free");
    setDisplayOrder(String(editing?.display_order ?? 0));
    setIsActive(editing?.is_active ?? true);
    setFile(null);
    setPreview(editing?.image_url ?? null);
  }, [open, editing]);

  const handleFile = (f: File | null) => {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("gender", gender);
    formData.set("tags", tags);
    formData.set("required_tier", requiredTier);
    formData.set("display_order", displayOrder);
    formData.set("is_active", String(isActive));
    if (file) formData.set("image", file);
    await onSubmit(formData, editing?.id);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Sửa người mẫu" : "Thêm người mẫu"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ảnh</label>
            <label className="flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 hover:border-primary/40 transition-colors relative">
              {preview ? (
                <Image src={preview} alt="" fill sizes="400px" className="object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <UploadCloud className="size-5" />
                  <span className="text-xs">Chọn ảnh người mẫu</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tên người mẫu</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Giới tính</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              >
                {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>

            {/* Required tier */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Yêu cầu tier</label>
              <select
                value={requiredTier}
                onChange={(e) => setRequiredTier(e.target.value as PlanTier)}
                className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              >
                {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags (phân cách bởi dấu phẩy)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="vd: châu Á, trẻ trung, streetwear"
              className="w-full rounded-lg border border-border bg-background py-2.5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Display order */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Thứ tự hiển thị</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2.5 px-4 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              />
            </div>

            {/* Active toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trạng thái</label>
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={`flex h-[42px] w-full items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                  isActive
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                    : "border-border bg-muted/30 text-muted-foreground"
                }`}
              >
                {isActive ? "Đang hiển thị" : "Đã ẩn"}
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSubmit} loading={isSaving} disabled={!name || (!file && !editing)}>
            {editing ? "Lưu thay đổi" : "Thêm người mẫu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
