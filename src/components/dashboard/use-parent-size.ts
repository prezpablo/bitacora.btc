import { useEffect, useRef, useState } from "react";

/** Ancho/alto del padre (patrón visx ParentSize, sin el paquete). */
export function useParentSize(minW = 280, minH = 160) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: minW, h: minH });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const read = () => {
      const w = Math.max(1, Math.round(node.clientWidth) || minW);
      const h = Math.max(1, Math.round(node.clientHeight) || minH);
      setSize((p) => (p.w === w && p.h === h ? p : { w, h }));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(node);
    return () => ro.disconnect();
  }, [minW, minH]);
  return { ref, w: size.w, h: size.h };
}
