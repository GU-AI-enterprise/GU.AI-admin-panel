"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AdminUser } from "@/features/users/usersSlice";

function displayName(u: AdminUser) {
  return u.name || u.email.split("@")[0];
}

interface DeleteDialogProps {
  user: AdminUser | null;
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
  isDeleting: boolean;
}

export function DeleteDialog({ user, open, onConfirm, onClose, isDeleting }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showClose={false} className="max-w-sm">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Xóa tài khoản vĩnh viễn?</DialogTitle>
              <DialogDescription className="mt-1">
                Tài khoản{" "}
                <span className="font-semibold text-foreground">
                  {user ? displayName(user) : ""}
                </span>{" "}
                sẽ bị xóa hoàn toàn. Hành động này không thể hoàn tác.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Hủy bỏ
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={isDeleting}>
            <Trash2 className="size-4" />
            Xóa vĩnh viễn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
