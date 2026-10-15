import { join } from "node:path";

export const FED_LOGO_DIR = join(process.cwd(), "data", "logos", "fed");

export function fedLogoName(id: string) {
  const safe = id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return safe ? `${safe}.jpg` : "";
}

/** Solo un jpeg de esta carpeta. Rechaza rutas y otros nombres. */
export function fedLogoFile(name: string) {
  if (!/^[a-z0-9-]{1,80}\.jpg$/.test(name)) return "";
  return join(FED_LOGO_DIR, name);
}
