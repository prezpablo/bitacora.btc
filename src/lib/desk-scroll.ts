/** Scroll inside the active desk room (.scroll-free), not the window. */
let pinToken = 0;

export function cancelPinDeskScroll() {
  pinToken += 1;
}

export function visibleDeskRoom(): HTMLElement | null {
  const box = document.querySelector(".scroll-free:not([inert])");
  return box instanceof HTMLElement ? box : null;
}

function deskPad(box: HTMLElement, node: HTMLElement) {
  const room = node.closest("#aprender, #comunidad, #mercado");
  const hub = room?.querySelector(":scope > header") ?? box.querySelector("header");
  if (hub instanceof HTMLElement && getComputedStyle(hub).position === "sticky") {
    return hub.getBoundingClientRect().height + 8;
  }
  return 12;
}

function placeInRoom(id: string, behavior: ScrollBehavior) {
  const node = document.getElementById(id);
  if (!node) return null;
  const box = node.closest(".scroll-free");
  if (!(box instanceof HTMLElement) || box === node) {
    node.scrollIntoView({ behavior, block: "start" });
    return null;
  }
  const top = Math.max(0, node.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - deskPad(box, node));
  if (Math.abs(box.scrollTop - top) > 2) box.scrollTo({ top, behavior });
  return { box, node };
}

export function scrollDeskTo(id: string) {
  const token = ++pinToken;
  if (!document.getElementById(id)) return false;
  const placed = placeInRoom(id, "smooth");
  if (!placed) return true;
  let seen = placed.node.getBoundingClientRect().top - placed.box.getBoundingClientRect().top + placed.box.scrollTop;
  const settle = () => {
    if (token !== pinToken) return;
    const node = document.getElementById(id);
    const box = node?.closest(".scroll-free");
    if (!(node instanceof HTMLElement) || !(box instanceof HTMLElement)) return;
    const docTop = node.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    if (docTop - seen > 48) placeInRoom(id, "auto");
    seen = docTop;
  };
  requestAnimationFrame(settle);
  window.setTimeout(settle, 120);
  window.setTimeout(settle, 480);
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
