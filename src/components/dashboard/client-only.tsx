import { type ReactNode, useEffect, useState } from "react";

export function ClientOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(true);
  }, []);
  return on ? children : fallback;
}
