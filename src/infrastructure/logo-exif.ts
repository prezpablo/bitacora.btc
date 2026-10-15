import { isSvgPayload } from "./logo-bytes.ts";

const PIXELS = 25_000_000;

/** JPEG nuevo, sin EXIF. sharp ya está; rotate aplica la orientación y no se vuelve a copiar el GPS. */
export async function jpegWithoutExif(buf: Buffer, cover: boolean) {
  const sharp = (await import("sharp")).default;
  let img = sharp(buf, { limitInputPixels: PIXELS, animated: false }).rotate();
  img = cover
    ? img.resize(540, 675, { fit: "cover", position: "centre" })
    : img.resize(960, 960, { fit: "inside", withoutEnlargement: true });
  return await img.flatten({ background: "#ffffff" }).jpeg({ quality: 72, mozjpeg: true }).toBuffer();
}

/** Un data: se reemplaza por JPEG. Una URL se deja igual. SVG no entra. */
export async function rewriteDataLogo(raw: string) {
  const t = String(raw || "").trim();
  if (!t.startsWith("data:")) return t;
  const m = /^data:([^;,]+)?;base64,([a-z0-9+/=\s]+)$/i.exec(t);
  if (!m) return "";
  const type = (m[1] || "").toLowerCase();
  if (/svg|xml/.test(type)) return "";
  let buf: Buffer;
  try {
    buf = Buffer.from(m[2].replace(/\s/g, ""), "base64");
  } catch {
    return "";
  }
  if (!buf.length || buf.length > 2_000_000) return "";
  if (isSvgPayload(type, buf)) return "";
  try {
    const jpeg = await jpegWithoutExif(buf, false);
    if (!jpeg?.length || isSvgPayload("image/jpeg", jpeg)) return "";
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return "";
  }
}
