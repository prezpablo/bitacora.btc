export const DAYS = [
  { key: "lun", label: "Lun", long: "Lunes" },
  { key: "mar", label: "Mar", long: "Martes" },
  { key: "mie", label: "Mié", long: "Miércoles" },
  { key: "jue", label: "Jue", long: "Jueves" },
  { key: "vie", label: "Vie", long: "Viernes" },
  { key: "sab", label: "Sáb", long: "Sábado" },
  { key: "dom", label: "Dom", long: "Domingo" },
] as const;

export type DayKey = (typeof DAYS)[number]["key"];
export type TimeSlot = { open: string; close: string };
export type DayHours = { closed: true } | { closed?: false; slots: TimeSlot[]; open?: string; close?: string };
export type WeekHours = Record<DayKey, DayHours>;

export const EMPTY_HOURS: WeekHours = {
  lun: { slots: [{ open: "09:00", close: "18:00" }] },
  mar: { slots: [{ open: "09:00", close: "18:00" }] },
  mie: { slots: [{ open: "09:00", close: "18:00" }] },
  jue: { slots: [{ open: "09:00", close: "18:00" }] },
  vie: { slots: [{ open: "09:00", close: "18:00" }] },
  sab: { slots: [{ open: "09:00", close: "13:00" }] },
  dom: { closed: true },
};

const JS_DAY: DayKey[] = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];

function toMin(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function daySlots(day: DayHours | undefined): TimeSlot[] {
  if (!day || day.closed) return [];
  if (day.slots?.length) return day.slots;
  if (day.open && day.close) return [{ open: day.open, close: day.close }];
  return [];
}

function inSlot(now: number, slot: TimeSlot) {
  const a = toMin(slot.open);
  const b = toMin(slot.close);
  if (b > a) return now >= a && now < b;
  return now >= a || now < b;
}

export function isOpenNow(hours: WeekHours, at = new Date()): boolean {
  const key = JS_DAY[at.getDay()]!;
  const slots = daySlots(hours[key]);
  if (!slots.length) return false;
  const now = at.getHours() * 60 + at.getMinutes();
  return slots.some((s) => inSlot(now, s));
}

function slotsSig(day: DayHours) {
  const slots = daySlots(day);
  if (!slots.length) return "closed";
  return slots.map((s) => `${s.open}-${s.close}`).join(",");
}

export function formatHours(
  hours: WeekHours,
  labels: Record<DayKey, string>,
  closedWord: string,
): string[] {
  const rows: string[] = [];
  let i = 0;
  while (i < DAYS.length) {
    const k = DAYS[i]!.key;
    const sig = slotsSig(hours[k]!);
    let j = i + 1;
    while (j < DAYS.length && slotsSig(hours[DAYS[j]!.key]!) === sig) j++;
    const from = labels[DAYS[i]!.key];
    const to = labels[DAYS[j - 1]!.key];
    const range = i === j - 1 ? from : `${from}–${to}`;
    const slots = daySlots(hours[k]!);
    const text = slots.length ? slots.map((s) => `${s.open}–${s.close}`).join(", ") : closedWord;
    rows.push(`${range} ${text}`);
    i = j;
  }
  return rows;
}
