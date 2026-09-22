/** Scroll inside the active desk room (.scroll-free), not the window. */
export function scrollDeskTo(id: string) {
  const node = document.getElementById(id);
  if (!node) return false;
  const box = node.closest(".scroll-free");
  if (box instanceof HTMLElement && box !== node) {
    const hub = box.querySelector("header");
    const pad = hub instanceof HTMLElement ? hub.getBoundingClientRect().height + 8 : 12;
    const top = node.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - pad;
    box.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    return true;
  }
  node.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export function deskRoom(): HTMLElement | null {
  const box = document.getElementById("eventos")?.closest(".scroll-free");
  return box instanceof HTMLElement ? box : document.querySelector(".scroll-free:not([inert])");
}

/** Keep the room where it is across filter fetches / history writes. */
export function pinDeskScroll() {
  const box = deskRoom();
  if (!box) return () => {};
  const y = box.scrollTop;
  const stick = () => {
    box.scrollTop = y;
  };
  stick();
  const a = requestAnimationFrame(() => {
    stick();
    requestAnimationFrame(stick);
  });
  const t = window.setTimeout(stick, 100);
  return () => {
    cancelAnimationFrame(a);
    window.clearTimeout(t);
  };
}
