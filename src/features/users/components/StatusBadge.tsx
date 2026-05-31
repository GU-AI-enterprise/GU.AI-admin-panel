import { Badge } from "@/components/ui/badge";
import type { AdminUser } from "@/features/users/usersSlice";

export function StatusBadge({ status }: { status: AdminUser["status"] | string }) {
  if (status === "locked")
    return (
      <Badge variant="destructive">
        <span className="size-1.5 rounded-full bg-destructive" />
        Đã khóa
      </Badge>
    );
  return (
    <Badge variant="success">
      <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
      Hoạt động
    </Badge>
  );
}
