/** Actividad que se paga en Bitcoin. Vive en la base de Bitácora, no en una pasarela. */

export type Experience = {
  id: string;
  activity: string;
  city: string;
  when: string;
  price: string;
  proof: string;
  token: string;
  verified: boolean;
  verifiedAt: number;
  created: number;
};

export type ExperienceErr = "need" | "city" | "when" | "price" | "links";

const RECURRENT = /^(recurrente|recurrent|recorrente)$/i;
const DEAL = /^(convenio|a convenir|combinar|deal|agreed)$/i;

export function cleanExperience(raw: {
  activity?: string;
  city?: string;
  when?: string;
  recurrent?: boolean;
  price?: string;
  deal?: boolean;
}): { activity: string; city: string; when: string; price: string } | { error: ExperienceErr } {
  const activity = String(raw.activity || "").trim().slice(0, 120);
  const city = String(raw.city || "").trim().slice(0, 80);
  if (activity.length < 2) return { error: "need" };
  if (city.length < 2) return { error: "city" };
  let when = String(raw.when || "").trim().slice(0, 40);
  if (raw.recurrent || RECURRENT.test(when)) when = "recurrente";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(when) || Number.isNaN(Date.parse(`${when}T12:00:00Z`))) return { error: "when" };
  let price = String(raw.price || "").trim().slice(0, 16);
  if (raw.deal || !price || DEAL.test(price)) price = "convenio";
  else {
    const n = Number(price.replace(/[^\d]/g, ""));
    if (!Number.isFinite(n) || n < 1 || n > 100_000_000) return { error: "price" };
    price = String(Math.floor(n));
  }
  return { activity, city, when, price };
}

export function experienceOnBoard(row: Pick<Experience, "verified" | "proof">) {
  return row.verified && /^https?:\/\//i.test(row.proof);
}

export function experiencePublic(row: Experience): Experience {
  return { ...row, token: "" };
}
