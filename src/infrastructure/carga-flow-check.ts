import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "carga-"));
process.env.BITACORA_SQLITE = join(dir, "t.sqlite");
process.chdir(dir);

const { acceptCommunityPin, acceptMapListing } = await import("./carga-accept.ts");
const { issueCaptchaTicket } = await import("./captcha-ticket.ts");
const { openSqlite } = await import("./sqlite.ts");
const { minePow } = await import("../lib/pow.ts");
const { loadPins } = await import("./pins-io.ts");
const { clientKey } = await import("./rate-limit.ts");

function used(id: string) {
  const row = openSqlite().prepare("SELECT used FROM captcha WHERE id = ?").get(id);
  return Number(row?.used) || 0;
}

async function ticket() {
  const issued = issueCaptchaTicket();
  if (!issued) throw new Error("no salió el captcha");
  openSqlite().prepare("UPDATE captcha SET created = ? WHERE id = ?").run(Date.now() - 5_000, issued.id);
  const nonce = await minePow(issued.salt, issued.bits);
  if (!nonce) throw new Error("no salió el trabajo del captcha");
  return { ...issued, nonce };
}

const key = clientKey("map-add");
const now = Date.now();
const ins = openSqlite().prepare("INSERT INTO rate_hits(k, t) VALUES(?, ?)");
for (let i = 0; i < 6; i++) ins.run(key, now - (i + 1) * 1000);
const blocked = await ticket();
const rate = await acceptMapListing({
  kind: "shop",
  name: "Bloqueado",
  lat: 1,
  lon: 1,
  consent: true,
  textVersion: "2.18",
  form: "shop",
  captchaId: blocked.id,
  captcha: blocked.code,
  captchaNonce: blocked.nonce,
});
if (rate.error !== "rate") throw new Error(`esperaba rate, llegó ${JSON.stringify(rate)}`);
if (used(blocked.id) !== 0) throw new Error("el tope gastó el captcha");

openSqlite().prepare("DELETE FROM rate_hits").run();

const shopCap = await ticket();
const shop = await acceptMapListing({
  kind: "shop",
  name: "Café Prueba",
  lat: -34.92111,
  lon: -57.95444,
  address: "Calle 57",
  consent: true,
  textVersion: "2.18",
  form: "shop",
  captchaId: shopCap.id,
  captcha: shopCap.code,
  captchaNonce: shopCap.nonce,
});
if (!shop.ok || !shop.token?.startsWith("CARGA-")) throw new Error(`comercio ${JSON.stringify(shop)}`);

const commCap = await ticket();
const comm = await acceptMapListing({
  kind: "community",
  name: "Nodo Prueba",
  slug: "nodo-prueba",
  lat: -34.93,
  lon: -57.96,
  consent: true,
  textVersion: "2.18",
  form: "community",
  captchaId: commCap.id,
  captcha: commCap.code,
  captchaNonce: commCap.nonce,
});
if (!comm.ok || !comm.token?.startsWith("CARGA-")) throw new Error(`comunidad ${JSON.stringify(comm)}`);

const pinCap = await ticket();
const pin = await acceptCommunityPin({
  name: "Anuncio prueba",
  blurb: "meetup del sábado",
  consent: true,
  textVersion: "2.18",
  form: "pin",
  captchaId: pinCap.id,
  captcha: pinCap.code,
  captchaNonce: pinCap.nonce,
});
if (!pin.ok || !pin.token?.startsWith("CARGA-")) throw new Error(`anuncio ${JSON.stringify(pin)}`);

const shopRow = openSqlite().prepare("SELECT token FROM map_rows WHERE id = ?").get(shop.id);
const commRow = openSqlite().prepare("SELECT token FROM map_rows WHERE id = ?").get(comm.id);
const ids = openSqlite().prepare("SELECT id, token FROM map_rows").all();
if (String(shopRow?.token || "") !== shop.token || String(commRow?.token || "") !== comm.token) {
  throw new Error(`shop=${shop.id} comm=${comm.id} rows=${JSON.stringify(ids)}`);
}
const pins = await loadPins();
if (!pins.some((p) => p.token === pin.token)) throw new Error("el anuncio no quedó guardado");

const againCap = await ticket();
const again = await acceptMapListing({
  kind: "shop",
  name: "Café Prueba",
  lat: -34.92111,
  lon: -57.95444,
  consent: true,
  textVersion: "2.18",
  form: "shop",
  captchaId: againCap.id,
  captcha: againCap.code,
  captchaNonce: againCap.nonce,
});
if (again.error !== "pending") throw new Error(`esperaba pendiente, llegó ${JSON.stringify(again)}`);
if (used(againCap.id) !== 0) throw new Error("el duplicado gastó el captcha");

console.log("SHOP", shop.token);
console.log("COMM", comm.token);
console.log("PIN", pin.token);
console.log("OK");
