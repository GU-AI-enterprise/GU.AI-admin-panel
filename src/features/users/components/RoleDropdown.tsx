"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleBadge, ROLE_CONFIG } from "./RoleBadge";
import { cn } from "@/lib/utils";
import type { AdminUser } from "@/features/users/usersSlice";

interface RoleDropdownProps {
  userId: string;
  currentRole: AdminUser["role"];
  onUpdate: (id: string, role: string) => Promise<void>;
  disabled?: boolean;
}

export function RoleDropdown({ userId, currentRole, onUpdate, disabled }: RoleDropdownProps) {
  const [loading, setLoading] = useState(false);

  if (disabled) return <RoleBadge role={currentRole} />;

  const handleSelect = async (role: string) => {
    if (role === currentRole) return;
    setLoading(true);
    await onUpdate(userId, role);
    setLoading(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1 rounded-lg p-1 transition-colors hover:bg-accent focus:outline-none">
          <RoleBadge role={currentRole} />
          {loading
            ? <Loader2 className="size-3 animate-spin text-muted-foreground" />
            : <ChevronDown className="size-3 text-muted-foreground" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Đổi vai trò</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(["customer", "staff", "admin"] as const).map((r) => {
          const cfg = ROLE_CONFIG[r];
          const Icon = cfg.icon;
          return (
            <DropdownMenuItem
              key={r}
              onSelect={() => handleSelect(r)}
              className={cn(
                r === currentRole && "bg-accent",
                r === "admin" && "text-violet-600",
                r === "staff"  && "text-blue-600",
              )}
            >
              <Icon className="size-4" />
              {cfg.label}
              {r === currentRole && (
                <span className="ml-auto text-[10px] text-muted-foreground">Hiện tại</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
