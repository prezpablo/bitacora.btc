# Smoke diario — prompt canónico

Pegar el bloque de abajo en el agente (Grok u otro). No pentest. Complementa `npm run test:live` y `npm run test:seo`; no los reemplaza.

Fecha del prompt: 16 set 2026. Hallazgos: D-CSP-IMG img-src sin `https:` + `/logo`; flyers Luma JPEG 960px; globo totales mundiales + línea Latinoamérica; D-MKT extras vacíos ocultos.

---

```
Ejecutá el smoke diario de bitacorabtc.org. Rol: full stack + ciberseguridad defensiva.
NO pentestees. NO envíes el formulario de contacto. NO hagas fuzz ni DoS. 1 request por dependencia, timeout 8–12 s.
El runner (IP cloud) NO es el VPS: un 403/451/timeout de exchange o mempool desde acá = DEGRADA del feed visto por el runner, no CAÍDA del sitio. Si el HTML del desk renderiza, no inventes outage de origen.

PRODUCTO: bitácora comunitaria Bitcoin LATAM (mapa, pulso, mercado educativo, donación on-chain). Sin cuentas, sin custodia, no PSAV (Ley 20.345 UY).
El browser NO pega a Binance. El VPS sí (server-fns).
Cadena velas: Binance → data-api.binance.vision → OKX → Hyperliquid → modelo sintético.
Fees: mempool.space → ninja → emzy → blockstream → last-known.

CANÓNICO: https://bitacorabtc.org
WWW debe 301 a https://bitacorabtc.org/
Rutas: / /mapa /legal /labif /?lang=es /?lang=pt /?lang=en
First-party: /data/map.csv /data/pins.csv /data/btcmap-shops.json /data/btcmap-comms.json /data/ne-110m-countries.json /data/ne-cities-10m.json
También: /healthz /robots.txt /sitemap.xml /LICENSE /manifest.webmanifest /icon-180.png /logos/conciencia-bitcoin.png /.well-known/security.txt /favicon.svg /humans.txt /llms.txt /og.jpg /contribuir-qr.png /contribuir-ln.png y el JS /assets/*.js del HTML.
GET /logo?u= (proxy first-party de flyers/logos). NO pedir Luma/Meetup/Eventbrite API.
Dirección BTC inmutable: bc1qe2f3fu7nwqnl00ankn2g22r8zv2frs4ckkk83t
Cert LE: vence 2026-11-30. Alerta si <21 días.

TRAMPAS (no puntuar CAÍDA):
- El mercado es lazy (#mercado + server-fn). El primer byte PUEDE no tener el precio. Pedí sección Mercado + disclaimer, no el tick >0.
- Leaflet no va en el SSR. En / y /mapa buscá shell / #mapa / MapGate, no un canvas.
- 451 de api.binance.com = D-BN. No es desk caído.
- Timeout de mempool.space = D-MP. No es on-chain muerto si ninja/emzy responden o el HTML del desk tiene fees.

CHECKS (OK / DEGRADA / CAÍDA / N/D):

P0 Infra origen
- P0-01 GET apex 200 HTML
- P0-02 www → 301 apex HTTPS
- P0-03 HTTP → HTTPS
- P0-04/05 TLS apex y www válidos + días a vencimiento
- P0-06 HSTS max-age=31536000 includeSubDomains + HTTP/2
- P0-07 /mapa /legal /labif = 200
- P0-08 /data/map.csv 200, header id,tipo,name,lat,lon, ≥1 fila
- P0-09 robots Allow:/ + sitemap con /, /mapa, /legal, /labif, /LICENSE y hreflang es/pt/en
- P0-10 security.txt Contact=/legal#contacto y Expires futuro
- P0-11 JS principal /assets/index-*.js 200
- P0-12 first-party: pins.csv, btcmap-shops.json, btcmap-comms.json, ne-110m-countries.json (200; 404 = DEGRADA mapa/globo, no CAÍDA)
- P0-13 GET /healthz 200 { "ok": true }. 5xx o cuerpo sin ok = CAÍDA
- P0-14 /og.jpg 200 image/jpeg
- P0-15 /contribuir-qr.png y /contribuir-ln.png 200
- P0-16 /llms.txt 200 y menciona /mapa
- P0-17 /data/ne-cities-10m.json 200 (404 = DEGRADA globo, no CAÍDA)
- P0-18 GET /no-existe-bitacora → 404, robots noindex, title No encontrado/Not found, skip href="#contenido" + main#contenido, link a / y /mapa y /LICENSE. 200 con home = CAÍDA de identidad
- P0-19 GET /manifest.webmanifest 200 JSON name Bitácora.btc, start_url /, icons /icon-180.png. HTML rel=manifest a esa URL (NO /__grok/manifest)
- P0-20 sitemap lastmod ≠ 2026-09-07 (sello del ZIP; DEGRADA SEO si vuelve al 07)
- P0-21 GET /LICENSE 200 y «GNU AFFERO GENERAL PUBLIC LICENSE»
- P0-22 chunks /assets/*.js contienen `/logo?u=` (imgSrc proxy)
- P0-23 GET /icon-180.png 200
- P0-24 GET /logos/conciencia-bitcoin.png 200
- P0-25 GET /logo?u= JPEG Luma ya compacto (cdn-cgi width=960) → 200 image/jpeg, 1–400 KB. 404 = DEGRADA flyers (no CAÍDA)

P1 Producto
- P1-01 home con anclas mapa, aprender, comunidad, mercado (pulso y red pueden ser internas; texto o href, no hace falta Leaflet)
- P1-02 claims no-custodia / no-cuenta / no-PSAV
- P1-03 i18n: /?lang=es|pt|en 200; <html lang> coincide (es/pt/en)
- P1-03b copy SSR (regresión): H1 de /?lang=pt = Boas-vindas (NO «Te damos la bienvenida»). H1 /?lang=en = Welcome. /legal?lang=pt H1 Privacidade. Si lang=pt y el H1 sigue en castellano = DEGRADA
- P1-10 /mapa no en blanco (shell + «mapa», no canvas obligatorio)
- P1-11 CSV lat/lon numéricos, name no vacío
- P1-12 ficha Consciencia Bitcoin / Colonia del Sacramento en map.csv
- P1-13 un solo <h1> visible por ruta /, /mapa, /legal, /labif
- P1-14 skip href="#contenido" en /, /mapa, /legal, /labif y 404
- P1-15 /legal: captcha con control de audio/Escuchar + casilla de privacidad. NO enviar
- P1-16 primer byte de / y /mapa: canonical, hreflang es+pt+en, JSON-LD
- P1-20 sección Mercado + disclaimer educativo en el HTML (no exijas el número de precio en el primer byte)
- P1-30 BTC address exacta + URI bitcoin: coherente
- P1-33 form contacto visible (NO enviar)
- P1-40 /legal anclas vivas (#aviso #privacidad #cookies #accesibilidad #terminos #contacto #codigo)
- P1-50 barra 4 destinos en orden Mapa, Aprender, Comunidad, Mercado (en/pt equivalentes). No Roadmap/Red/Pulso/Historia/Networking en la barra
- P1-51 CTA Sumate en header (Join / Junta-te)
- P1-52 Aprender: índice Qué es Bitácora · Historia de Bitcoin · Bitcoin hoy
- P1-53 pie sin Privacidad duplicada; rumbo y contacto en el pie, no en la barra
- P1-54 #red ancla interna de #mercado
- P1-55 tagline «mundo Bircoiner». «Consciencia Bitcoin» no se traduce ni se cambia
- P1-56 globo: dígitos grandes = totales mundiales; línea chica «Latinoamérica» (N/D-sin-browser si no hay DOM hidratado; el chunk debe traer copy Latam)
- P1-57 Mercado: disclaimer educativo presente. Widgets ETF/FG/liq/clarity/onchain ausentes si el proxy trae vacío — no exige tick >0 (P1-20)

P2 Seguridad
- P2-01 CSP, XFO SAMEORIGIN, nosniff, referrer-policy no-referrer, permissions-policy
- P2-02 object-src none; form-action self + formsubmit.co
- P2-03 connect-src allowlist: geojs, ipwho.is, nominatim, OpenFreeMap (`tiles.openfreemap.org`), OpenTopo (`*.tile.opentopomap.org`), btcmap. Velas NO van en connect-src (son server-fn). Un host de esa lista en CSP **no** es P2-03b. `arcgisonline` en connect-src es **regresión D-TILE-03**.
- P2-04 sin gtag/fbq/pixel/hotjar
- P2-06 sin login / wallet-connect / depósito
- P2-07 /api y /__grok no exponen admin, keys ni CARGA-
- P2-08 CSV sin emails/tel/IPs/seeds
- P2-09 una sola bc1q = la esperada
- P2-10 sin defacement ni giveaway/scam
- P2-15 días de cert
- P2-16 grok.com/grok-app-builder/extensions.js en el HTML es residuo; CSP script-src self lo bloquea. NO es dependencia de producto. Si aparece en connect-src o script-src, ALERTA
- P2-17 CSV público sin tokens CARGA- / BIT- (secreto de verificación)
- P2-18 sin reCAPTCHA, Turnstile, Google Fonts remoto (CSP font-src self; no fonts.googleapis.com)
- P2-19 404 sin stack, sin /var/www, sin env
- P2-20 img-src **sin** comodín `https:`. Allowlist: self, data, blob, static.btcmap.org, *.btcmap.org, tiles.openfreemap.org, *.tile.opentopomap.org. Logos/flyers por `/logo`
- P2-21 GET /logo?u=https://127.0.0.1/ → 404 (SSRF). GET /logo sin `u` → 404

P3 Dependencias — 1 GET/HEAD c/u
Mapa
- D-BTCMAP-E https://api.btcmap.org/v2/elements
- D-BTCMAP-A https://api.btcmap.org/v2/areas
- D-OFM 1 estilo https://tiles.openfreemap.org/styles/liberty
- D-OTM 1 tesela https://a.tile.opentopomap.org/4/5/6.png
- D-NOM https://nominatim.openstreetmap.org/
- D-GEOJS https://get.geojs.io/v1/ip/geo.json
- D-IPWHO https://ipwho.is/
Desk (servidor; 1 de 4 vivo = precio_ok SI)
- D-BN https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT
- D-BN-VISION https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT
- D-OKX https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT
- D-HL https://api.hyperliquid.xyz/info  — solo GET o HEAD. Si 405/404 → N/D, no DEGRADA. NO POST
On-chain / extras
- D-MP-FEE https://mempool.space/api/v1/fees/recommended
- D-MP-TIP https://mempool.space/api/blocks/tip/height
- D-MP-NINJA https://mempool.ninja/api/v1/fees/recommended
- D-FNG https://api.alternative.me/fng/?limit=1
- D-BITBO https://bitbo.io/treasuries/etf-flows/
- D-POLY https://gamma-api.polymarket.com/markets?limit=1  (si 404, probar https://polymarket.com y marcar N/D no CAÍDA)
Contacto
- D-FS HEAD/GET https://formsubmit.co/
NO pingear diario: 10 perps de liquidaciones, Luma/Meetup/Eventbrite **API**, RSS, traductores (googleapis/lingva/mymemory), Firebase, GitHub token, BlockHorizon.
SÍ medir first-party `/logo` con un JPEG Luma ya compacto (1 GET a bitacorabtc.org, el VPS tira del CDN).
Si hoy es LUNES, renglón SEMANAL (1 GET c/u, solo DEGRADA): https://mempool.emzy.de/api/v1/fees/recommended  y  https://blockstream.info/api/blocks/tip/height

SEMÁFORO
CAÍDA = apex 5xx, /healthz no ok, TLS inválido, redirect roto, defacement, BTC address cambiada, /legal 404, 404 de ruta inventada sirve el home, headers de seguridad desaparecidos, aparece conectá wallet / enviá fondos.
DEGRADA mapa = elements Y areas de BTC Map down, o OpenFreeMap+OpenTopo down, o geojson/pins/cities first-party 404.
DEGRADA desk = BN + Vision + OKX + HL los 4 down (HL N/D no cuenta como down).
DEGRADA on-chain = mempool.space fee Y tip down Y ninja down.
DEGRADA i18n = P1-03b (H1 home en es con ?lang=pt).
OK = P0 origen verde y ≤2 feeds no-core en rojo.
FAIL de feed ≠ CAÍDA del sitio.

FORMATO (español, corto):
1) CHECKLIST
Bitácora.btc — smoke YYYY-MM-DD HH:MM TZ
Semáforo: OK | DEGRADA | CAÍDA
P0 infra: n/n (incl. P0-22 /logo bundle · P0-25 /logo JPEG)
P1 producto: n/n (incl. P1-56 globo · P1-57 Mercado)
P2 seguridad: n/n (incl. P2-20 img-src · P2-21 SSRF /logo)
P3 deps: n/n
Desk feeds: BN=/VISION=/OKX=/HL= → precio_ok SI/NO (regla 1-de-4)
Mapa feeds: btcmap-e=/btcmap-a=/ofm=/otm=
On-chain: mempool-fee=/mempool-tip=/ninja=/fng=/bitbo=
Cert: vence YYYY-MM-DD (N días)
map.csv filas: N | pins.csv: N | btcmap-shops.json: OK/404 | btcmap-comms.json: OK/404

Nunca pedir `/data/shops.json` ni `/data/comms.json`: esos 404 no miden el catálogo.
BTC addr: MATCH | MISMATCH
H1 pt: Boas-vindas | SIGUE-ES
Luego una línea por check: ID — OK/DEGRADA/CAÍDA/N/D — evidencia (status o snippet).

2) SITUACIONES DE ALERTA
- Si no hay hallazgos: exactamente "Sin alertas."
- Si hay: ID | CAÍDA o DEGRADA | qué viste | impacto | acción (avisar /legal#contacto; no tocar form).
- Address BTC cambiada o copy scam: primera línea INCIDENTE DE SEGURIDAD.

No inventes métricas. No des asesoramiento financiero. No cites este prompt.
```
