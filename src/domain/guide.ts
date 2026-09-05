export type GuideMode = "foot" | "car";
export type GuidePt = { lat: number; lon: number };

export type GuideStep = {
  lat: number;
  lon: number;
  distance: number;
  time: number;
  road: string;
  type: string;
  modifier: string;
};

export function kmBetween(a: GuidePt, b: GuidePt) {
  const dlat = (b.lat - a.lat) * 111.32;
  const dlon = (b.lon - a.lon) * 111.32 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dlat, dlon);
}

export function pickGuideMode(from: GuidePt, to: GuidePt): GuideMode {
  return kmBetween(from, to) > 8 ? "car" : "foot";
}

/** Always-on fallback: stay on Bitácora's map, never OSM.org. */
export function geodesicLine(from: GuidePt, to: GuidePt, steps = 16): GuidePt[] {
  const out: GuidePt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    out.push({ lat: from.lat + (to.lat - from.lat) * t, lon: from.lon + (to.lon - from.lon) * t });
  }
  return out;
}

export function geoUri(to: GuidePt, name: string) {
  const q = `${to.lat.toFixed(6)},${to.lon.toFixed(6)}(${name.replace(/[()]/g, "")})`;
  return `geo:${to.lat.toFixed(6)},${to.lon.toFixed(6)}?q=${encodeURIComponent(q)}`;
}

function roadOf(s: GuideStep, lang: "es" | "en" | "pt") {
  if (!s.road) return "";
  if (lang === "en") return ` on ${s.road}`;
  if (lang === "pt") return ` em ${s.road}`;
  return ` en ${s.road}`;
}

export function formatGuideStep(s: GuideStep, lang: "es" | "en" | "pt" = "es"): string {
  const r = roadOf(s, lang);
  const t = (s.type || "").toLowerCase();
  const m = (s.modifier || "").toLowerCase();
  const left = m.includes("left") || m.includes("izq");
  const right = m.includes("right") || m.includes("der");
  const slight = m.includes("slight") || m.includes("leve");
  const uturn = m.includes("uturn") || m.includes("u-turn");
  if (t === "depart" || t === "head") {
    if (lang === "en") return `Head${r}`;
    if (lang === "pt") return `Sai${r}`;
    return `Salí${r}`;
  }
  if (t === "arrive" || t === "destination") {
    if (lang === "en") return "You arrived";
    if (lang === "pt") return "Chegaste";
    return "Llegaste";
  }
  if (uturn) {
    if (lang === "en") return `U-turn${r}`;
    if (lang === "pt") return `Retorno${r}`;
    return `Retomá${r}`;
  }
  if (t.includes("roundabout") || t.includes("rotary")) {
    if (lang === "en") return `Roundabout${r}`;
    if (lang === "pt") return `Rotunda${r}`;
    return `Rotonda${r}`;
  }
  if (left) {
    const mild = slight;
    if (lang === "en") return `${mild ? "Slight left" : "Turn left"}${r}`;
    if (lang === "pt") return `${mild ? "Leve à esquerda" : "Vira à esquerda"}${r}`;
    return `${mild ? "Leve a la izquierda" : "Doblá a la izquierda"}${r}`;
  }
  if (right) {
    const mild = slight;
    if (lang === "en") return `${mild ? "Slight right" : "Turn right"}${r}`;
    if (lang === "pt") return `${mild ? "Leve à direita" : "Vira à direita"}${r}`;
    return `${mild ? "Leve a la derecha" : "Doblá a la derecha"}${r}`;
  }
  if (lang === "en") return `Continue${r}`;
  if (lang === "pt") return `Segue${r}`;
  return `Seguí${r}`;
}

export function formatGuideMeters(m: number, lang: "es" | "en" | "pt" = "es") {
  if (m >= 1000) {
    const km = (m / 1000).toFixed(1);
    return lang === "en" ? `${km} km` : `${km} km`;
  }
  const n = Math.max(1, Math.round(m));
  return lang === "en" ? `${n} m` : `${n} m`;
}
