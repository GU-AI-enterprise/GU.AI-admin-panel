"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

const Avatar = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) => (
  <AvatarPrimitive.Root
    className={cn("relative flex shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
);

const AvatarImage = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) => (
  <AvatarPrimitive.Image
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
);

const AvatarFallback = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) => (
  <AvatarPrimitive.Fallback
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full",
      "bg-gradient-to-br from-primary/40 to-violet-600/40 text-foreground font-semibold",
      className
    )}
    {...props}
  />
);

export { Avatar, AvatarImage, AvatarFallback };
