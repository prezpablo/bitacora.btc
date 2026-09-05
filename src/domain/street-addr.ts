export type StreetHit = {
  id: string;
  label: string;
  hint: string;
  lat: number;
  lon: number;
  street?: string;
  number?: string;
  city?: string;
  country?: string;
  countryCode?: string;
};

export type AddrIssue = "pick" | "street" | "number" | "city" | "country" | "coords";

export function addressIssues(hit: StreetHit | null): AddrIssue[] {
  if (!hit) return ["pick"];
  const miss: AddrIssue[] = [];
  if (!Number.isFinite(hit.lat) || !Number.isFinite(hit.lon)) miss.push("coords");
  if (!hit.street && !hit.label) miss.push("street");
  if (!hit.number) miss.push("number");
  if (!hit.city) miss.push("city");
  if (!hit.country && !hit.countryCode) miss.push("country");
  return miss;
}
