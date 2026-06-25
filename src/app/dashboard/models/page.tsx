"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, UserSquare2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchModels, createModel, updateModel, deleteModel,
  selectModels, selectModelsLoading, selectSavingId,
} from "@/features/models/modelsSlice";
import type { AppModel } from "@/features/models/modelsSlice";
import { ModelFormDialog } from "@/features/models/components/ModelFormDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TIER_BADGE: Record<string, { label: string; variant: "slate" | "blue" | "violet" | "warning" }> = {
  free: { label: "Free", variant: "slate" },
  basic: { label: "Basic", variant: "blue" },
  pro: { label: "Pro", variant: "violet" },
};

export default function ModelsPage() {
  const dispatch = useAppDispatch();
  const models = useAppSelector(selectModels);
  const isLoading = useAppSelector(selectModelsLoading);
  const savingId = useAppSelector(selectSavingId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppModel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppModel | null>(null);

  useEffect(() => {
    dispatch(fetchModels());
  }, [dispatch]);

  const counts = models.reduce<Record<string, number>>((acc, m) => {
    acc[m.required_tier] = (acc[m.required_tier] ?? 0) + 1;
    return acc;
  }, {});

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (m: AppModel) => { setEditing(m); setDialogOpen(true); };

  const handleSubmit = async (formData: FormData, id?: string) => {
    try {
      if (id) {
        await dispatch(updateModel({ id, formData })).unwrap();
        toast.success("Đã cập nhật người mẫu");
      } else {
        await dispatch(createModel(formData)).unwrap();
        toast.success("Đã thêm người mẫu mới");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.toString() ?? "Có lỗi xảy ra");
    }
  };

  const handleDelete = async (m: AppModel) => {
    try {
      await dispatch(deleteModel(m.id)).unwrap();
      toast.success("Đã xoá người mẫu");
    } catch (err: any) {
      toast.error(err?.toString() ?? "Có lỗi xảy ra");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Người mẫu của app</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý kho người mẫu dùng chung trong Studio — mỗi người mẫu yêu cầu một tier tối thiểu để mở khóa.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Thêm người mẫu
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(["free", "basic", "pro"] as const).map((tier) => (
          <div key={tier} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">{TIER_BADGE[tier].label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{counts[tier] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">Đang tải...</div>
      ) : models.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20">
          <UserSquare2 className="size-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Chưa có người mẫu nào</p>
          <Button className="mt-4" onClick={openCreate}><Plus className="size-4" /> Thêm người mẫu đầu tiên</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {models.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-[3/4] bg-muted/40">
                <Image src={m.image_url} alt={m.name} fill sizes="220px" className="object-cover" />
                {!m.is_active && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-xs font-semibold text-white">Đã ẩn</span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(m)}
                    className="flex size-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(m)}
                    className="flex size-9 items-center justify-center rounded-full bg-red-500/20 text-red-300 backdrop-blur-md hover:bg-red-500/30"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-foreground">{m.name}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge variant={TIER_BADGE[m.required_tier].variant}>{TIER_BADGE[m.required_tier].label}</Badge>
                  {m.gender && <span className="text-xs text-muted-foreground">{m.gender === "female" ? "Nữ" : m.gender === "male" ? "Nam" : "Unisex"}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModelFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editing={editing}
        onSubmit={handleSubmit}
        isSaving={savingId === "new" || savingId === editing?.id}
      />

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <p className="text-sm font-semibold text-foreground">Xoá "{deleteTarget.name}"?</p>
            <p className="mt-1.5 text-xs text-muted-foreground">Hành động này không thể hoàn tác.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteTarget)} loading={savingId === deleteTarget.id}>
                Xoá
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
