/** Scroll inside the active desk room (.scroll-free), not the window. */
let pinToken = 0;

export function cancelPinDeskScroll() {
  pinToken += 1;
}

export function visibleDeskRoom(): HTMLElement | null {
  const box = document.querySelector(".scroll-free:not([inert])");
  return box instanceof HTMLElement ? box : null;
}

export function scrollDeskTo(id: string) {
  cancelPinDeskScroll();
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

/** Keep the visible room still across a filter click. Nav cancels this. */
export function pinDeskScroll() {
  const box = visibleDeskRoom();
  if (!box) return () => {};
  const token = ++pinToken;
  const y = box.scrollTop;
  const stick = () => {
    if (token !== pinToken) return;
    box.scrollTop = y;
  };
  stick();
  const a = requestAnimationFrame(() => {
    stick();
    requestAnimationFrame(stick);
  });
  const t = window.setTimeout(stick, 80);
  return () => {
    cancelAnimationFrame(a);
    window.clearTimeout(t);
  };
}
