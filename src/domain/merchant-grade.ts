import type { GradeBand, MerchantLocal, MerchantVote } from "./entities";

const MONTH = 30 * 86_400_000;
const SIX_MONTHS = 6 * MONTH;

export function monthKey(at = Date.now()) {
  const d = new Date(at);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function votesInMonth(votes: MerchantVote[], key = monthKey()) {
  return votes.filter((v) => monthKey(v.at) === key);
}

export function averageStars(votes: MerchantVote[]) {
  if (!votes.length) return null;
  return votes.reduce((s, v) => s + v.stars, 0) / votes.length;
}

/** 1–2 baja, 3 media, 4–5 alta. Sin votos: nueva. */
export function bandFromAvg(avg: number | null): GradeBand {
  if (avg == null) return "nueva";
  const rounded = Math.round(avg);
  if (rounded <= 2) return "baja";
  if (rounded === 3) return "media";
  return "alta";
}

export function gradeOf(local: MerchantLocal | undefined, now = Date.now()): {
  avg: number | null;
  band: GradeBand;
  monthly: boolean;
  count: number;
  ageMs: number;
} {
  const ageMs = now - (local?.listedAt ?? now);
  if (local && (local.voteCount ?? 0) > 0) {
    const avg = local.score ?? 0;
    return { avg, band: bandFromAvg(avg), monthly: false, count: local.voteCount || 0, ageMs };
  }
  const votes = local?.votes ?? [];
  const monthly = ageMs >= SIX_MONTHS;
  const pool = monthly ? votesInMonth(votes, monthKey(now)) : votes;
  const used = pool.length ? pool : votes;
  const avg = averageStars(used);
  return { avg, band: bandFromAvg(avg), monthly, count: used.length, ageMs };
}

export function canRemove(local: MerchantLocal | undefined, now = Date.now()) {
  if (!local || local.removed) return false;
  const g = gradeOf(local, now);
  return g.ageMs >= SIX_MONTHS && g.band === "baja";
}

export const GRADE_HEX: Record<GradeBand, string> = {
  baja: "#f6465d",
  media: "#e2b203",
  alta: "#0ecb81",
  nueva: "#f7931a",
};

export const GRADE_LABEL: Record<GradeBand, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  nueva: "Sin nota",
};
