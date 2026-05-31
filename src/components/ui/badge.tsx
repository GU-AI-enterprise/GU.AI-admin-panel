import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-primary/15 text-primary border border-primary/20",
        secondary:   "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/15 text-destructive border border-destructive/20",
        success:     "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
        warning:     "bg-amber-500/15 text-amber-400 border border-amber-500/20",
        outline:     "border border-border text-foreground bg-transparent",
        violet:      "bg-violet-500/15 text-violet-400 border border-violet-500/20",
        blue:        "bg-blue-500/15 text-blue-400 border border-blue-500/20",
        slate:       "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
