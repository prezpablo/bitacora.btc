export const POW_BITS = 13;

export function powZeroBits(buf: ArrayBuffer | Uint8Array) {
  const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let n = 0;
  for (const b of u) {
    if (b === 0) {
      n += 8;
      continue;
    }
    n += Math.clz32(b) - 24;
    break;
  }
  return n;
}

export function powPayload(salt: string, nonce: string) {
  return `${salt}:${nonce}`;
}

export async function minePow(salt: string, bits: number, signal?: AbortSignal) {
  if (!salt || bits < 8) return "";
  const enc = new TextEncoder();
  const cap = 1 << Math.min(bits + 8, 22);
  for (let n = 0; n < cap; n++) {
    if (signal?.aborted) return "";
    const buf = await crypto.subtle.digest("SHA-256", enc.encode(powPayload(salt, String(n))));
    if (powZeroBits(buf) >= bits) return String(n);
    if ((n & 127) === 127) await new Promise((r) => setTimeout(r, 0));
  }
  return "";
}
