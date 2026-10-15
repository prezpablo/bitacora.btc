/** BIP-173 / BIP-350. Puro: valida `bc1q` (bech32) y `lno1` (BOLT 12). */

const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values: number[]) {
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((b >> i) & 1) chk ^= GEN[i]!;
  }
  return chk;
}

function hrpExpand(hrp: string) {
  const out: number[] = [];
  for (const c of hrp) out.push(c.charCodeAt(0) >> 5);
  out.push(0);
  for (const c of hrp) out.push(c.charCodeAt(0) & 31);
  return out;
}

function decode(str: string): { hrp: string; data: number[] } | null {
  const lower = str.toLowerCase();
  if (lower !== str && str.toUpperCase() !== str) return null;
  if (lower.length < 8 || lower.length > 1023) return null;
  const pos = lower.lastIndexOf("1");
  if (pos < 1 || pos + 7 > lower.length) return null;
  const hrp = lower.slice(0, pos);
  const data = lower.slice(pos + 1);
  const values: number[] = [];
  for (const c of data) {
    const i = CHARSET.indexOf(c);
    if (i < 0) return null;
    values.push(i);
  }
  return { hrp, data: values };
}

export function bech32Ok(str: string, hrp?: string): boolean {
  const d = decode(str);
  if (!d) return false;
  if (hrp && d.hrp !== hrp) return false;
  return polymod([...hrpExpand(d.hrp), ...d.data]) === 1;
}

export function bech32CharsetOk(str: string, hrp: string, min = 8): boolean {
  const lower = str.toLowerCase();
  if (lower !== str && str.toUpperCase() !== str) return false;
  if (!lower.startsWith(hrp + "1")) return false;
  if (lower.length < min) return false;
  const data = lower.slice(hrp.length + 1);
  for (const c of data) if (CHARSET.indexOf(c) < 0) return false;
  return data.length >= 6;
}

/** Primeros y últimos caracteres para el ojo (clippers suelen copiar solo el borde). */
export function addrHint(str: string, head = 8, tail = 6): string {
  if (str.length <= head + tail) return str;
  return `${str.slice(0, head)}…${str.slice(-tail)}`;
}

/** Primeros 8 y últimos 8, con tres puntos. El valor completo se copia aparte. */
export function addrEnds(str: string, head = 8, tail = 8): string {
  if (str.length <= head + tail + 3) return str;
  return `${str.slice(0, head)}...${str.slice(-tail)}`;
}

/** Agrupa de a 4 para comparar a ojo. */
export function addrGroups(str: string): string {
  const lower = str.toLowerCase();
  const chunks: string[] = [];
  for (let i = 0; i < lower.length; i += 4) chunks.push(lower.slice(i, i + 4));
  return chunks.join(" ");
}
