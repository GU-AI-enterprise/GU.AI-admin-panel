import { Crown, Headphones, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdminUser } from "@/features/users/usersSlice";

export const ROLE_CONFIG = {
  admin:    { label: "Admin",    variant: "violet" as const, icon: Crown },
  staff:    { label: "Staff",    variant: "blue"   as const, icon: Headphones },
  customer: { label: "Customer", variant: "slate"  as const, icon: UserIcon },
} satisfies Record<string, { label: string; variant: "violet" | "blue" | "slate"; icon: React.ElementType }>;

export function RoleBadge({ role }: { role: AdminUser["role"] | string }) {
  const cfg = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.customer;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant}>
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}
