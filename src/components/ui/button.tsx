import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        secondary:   "bg-secondary text-secondary-foreground hover:bg-accent",
        outline:     "border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost:       "text-foreground hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20",
        success:     "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20",
        warning:     "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20",
      },
      size: {
        sm:   "h-8 px-3 text-xs rounded-lg",
        md:   "h-9 px-4",
        lg:   "h-10 px-5",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

function Button({ className, variant, size, loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
