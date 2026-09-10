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
