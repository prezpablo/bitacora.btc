/** Misma cadena que el Caddyfile. En HTML de producción, script-src cambia el inline por un nonce. */
export const CSP_POLICY =
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data: https://tiles.openfreemap.org; img-src 'self' data: blob: https://static.btcmap.org https://*.btcmap.org https://tiles.openfreemap.org https://*.tile.opentopomap.org https://*.tile.openstreetmap.fr https://images.lumacdn.com https://*.lumacdn.com https://*.meetupstatic.com https://img.evbuc.com https://cdn.evbuc.com https://images.unsplash.com; connect-src 'self' https://get.geojs.io https://nominatim.openstreetmap.org https://tiles.openfreemap.org https://*.tile.opentopomap.org https://static.btcmap.org https://api.btcmap.org; worker-src 'self' blob: 'wasm-unsafe-eval'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self' https://formsubmit.co";

const NONCE = /^[A-Za-z0-9_-]{16,128}$/;

/** Quita 'unsafe-inline' solo de script-src. style-src no se toca. */
export function cspWithScriptNonce(policy: string, nonce: string) {
  if (!NONCE.test(nonce)) return policy;
  return policy.replace(/script-src\s+([^;]*)/, (_all, body: string) => {
    const tokens = body.split(/\s+/).filter((token) => token && token !== "'unsafe-inline'");
    tokens.push(`'nonce-${nonce}'`);
    return `script-src ${tokens.join(" ")}`;
  });
}
