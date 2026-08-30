export type ContinentId = "americas" | "europe" | "africa" | "asia" | "oceania" | "online";

const AM =
  "US CA MX GT BZ SV HN NI CR PA CU DO HT JM TT BB AG LC VC GD KN BS GY SR BR PY UY AR CL BO PE EC CO VE AW CW SX PR GF".split(
    " ",
  );
const EU =
  "GB IE FR DE ES PT IT NL BE LU CH AT CZ SK PL HU RO BG GR RS HR SI BA ME MK AL EE LV LT FI SE NO DK IS UA MD BY RU TR CY MT XK AD SM MC LI".split(
    " ",
  );
const AF =
  "NG KE ZA EG GH TZ UG MA DZ TN ET SN CI CM AO MZ ZW NA BW RW MU MG SD LY CD GH ML NE BF GN BJ TG GA CG SL LR GM CV SC ST ER DJ SO".split(
    " ",
  );
const AS =
  "CN JP KR TW HK SG MY ID TH VN PH IN PK BD LK NP AE SA QA KW BH IL JO LB IQ IR KZ UZ MN KH LA MM AF BT MO KW OM YE TJ KG AZ AM GE".split(
    " ",
  );
const OC = "AU NZ PG FJ NC PF WS TO VU GU MP AS CK NU TK".split(" ");

const ISO: Record<string, ContinentId> = {};
for (const c of AM) ISO[c] = "americas";
for (const c of EU) ISO[c] = "europe";
for (const c of AF) ISO[c] = "africa";
for (const c of AS) ISO[c] = "asia";
for (const c of OC) ISO[c] = "oceania";

const NAME: Record<string, string> = {
  "united states": "US",
  usa: "US",
  "united kingdom": "GB",
  "el salvador": "SV",
  "united arab emirates": "AE",
  "south africa": "ZA",
  "new zealand": "NZ",
  "south korea": "KR",
  "czech republic": "CZ",
  czechia: "CZ",
  "hong kong": "HK",
  "costa rica": "CR",
  "puerto rico": "PR",
  "dominican republic": "DO",
  "saudi arabia": "SA",
  "sri lanka": "LK",
  "bosnia and herzegovina": "BA",
  "north macedonia": "MK",
};

export function isoFromCountryName(name: string) {
  const n = name.trim().toLowerCase();
  if (!n) return "";
  if (NAME[n]) return NAME[n];
  for (const code of Object.keys(ISO)) {
    if (code.length === 2 && n === code.toLowerCase()) return code;
  }
  return "";
}

export function continentFromLabel(label: string): ContinentId | "" {
  const s = label.trim().toLowerCase();
  if (s.includes("online") || s.includes("virtual")) return "online";
  if (s.includes("america")) return "americas";
  if (s.includes("europe") || s.includes("europa")) return "europe";
  if (s.includes("africa") || s.includes("áfrica")) return "africa";
  if (s.includes("asia")) return "asia";
  if (s.includes("oceania") || s.includes("australia")) return "oceania";
  return "";
}

export function continentOf(code: string, online = false): ContinentId | "" {
  if (online) return "online";
  return ISO[code.toUpperCase()] || "";
}
