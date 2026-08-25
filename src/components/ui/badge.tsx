import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-sm bg-elevated px-2.5 text-xs font-medium text-muted-foreground shadow-[var(--shadow-border)]",
        className,
      )}
      {...props}
    />
  );
}
