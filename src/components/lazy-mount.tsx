import type { ReactNode } from "react";
import { useInView } from "@/lib/in-view";

export function LazyMount({
  children,
  fallback,
  rootMargin = "240px",
  minHeight,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  minHeight?: string;
}) {
  const { ref, shown } = useInView(rootMargin);
  return (
    <div ref={ref} style={minHeight ? { minHeight } : undefined}>
      {shown ? children : fallback}
    </div>
  );
}
