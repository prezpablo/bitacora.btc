# Smoke diario — prompt canónico

Pegar el bloque de abajo en el agente. No pentest. Complementa `npm run test:live` y `npm run test:seo`. Verificación larga (habitaciones, CARGA, A11Y): [`TEST-COMPLETO.md`](TEST-COMPLETO.md).

Fecha: 21 set 2026. P0-09 sitemap **sin** labif/LICENSE · P0-12 `btcmap-*` · globo no tapado · Sumate corto móvil.

---

```
Ejecutá el smoke diario de bitacorabtc.org. Rol: full stack + ciberseguridad defensiva + QA de dinámica y accesibilidad.
NO pentestees. NO envíes el formulario. NO fuzz ni DoS. 1 request por dependencia, timeout 8–12 s.
El runner (IP cloud) NO es el VPS: 403/451/timeout de exchange o mempool = DEGRADA del feed visto por el runner, no CAÍDA. Si el HTML del desk renderiza, no inventes outage.

PRODUCTO: bitácora comunitaria Bitcoin LATAM. Sin cuentas, sin custodia, no PSAV (Ley 20.345 UY).
Velas: Binance → Vision → OKX → Hyperliquid → sintético. Fees: mempool.space → ninja → emzy → blockstream → last-known.
Barra: Mapa · Aprender · Comunidad · Mercado + CTA Telegram. Pie: rumbo, contacto, Unite a Consciencia Bitcoin, legal (Privacidad una vez).
LLEGAR = mapa+aprender. Comunidad y Mercado = destinos (clic, no scroll). Globo: cifras ARRIBA, planeta visible. Móvil: CTA «Sumate».
Telegram: https://t.me/+hdBuy78MUuZiYjhh

CANÓNICO: https://bitacorabtc.org
WWW → 301 https://bitacorabtc.org/
Rutas: / /mapa /legal /labif /?lang=es /?lang=pt /?lang=en
First-party: /data/map.csv /data/pins.csv /data/btcmap-shops.json /data/btcmap-comms.json /data/ne-110m-countries.json /data/ne-cities-10m.json
También: /healthz /robots.txt /sitemap.xml /LICENSE /manifest.webmanifest /icon-180.png /logos/conciencia-bitcoin.png /.well-known/security.txt /favicon.svg /humans.txt /llms.txt /og.jpg /contribuir-qr.png /contribuir-ln.png /assets/index-*.js
GET /logo?u= first-party. NO pedir Luma/Meetup API.
BTC: bc1qe2f3fu7nwqnl00ankn2g22r8zv2frs4ckkk83t
Cert LE: 2026-11-30. Alerta si <21 días.

TRAMPAS
- Mercado lazy: sección + disclaimer, no tick en el primer byte.
- Leaflet no SSR: shell #mapa, no canvas.
- 451 Binance = D-BN. Timeout mempool = D-MP.
- NUNCA /data/shops.json ni /data/comms.json. Canónico btcmap-shops.json / btcmap-comms.json.
- Sitemap SIN /labif y SIN /LICENSE es correcto (noindex GSC). Loc = / /mapa /legal.
- Headless sin WebGL = N/D-sin-browser, no CAÍDA de globo.

CHECKS (OK / DEGRADA / CAÍDA / N/D):

P0 Infra
- P0-01 apex 200 HTML
- P0-02 www 301 apex HTTPS
- P0-03 HTTP → HTTPS
- P0-04/05 TLS + días
- P0-06 HSTS includeSubDomains + HTTP/2
- P0-07 /mapa /legal /labif 200
- P0-08 map.csv 200, ≥1 fila
- P0-09 robots Allow:/ + Bingbot/DuckDuckBot. Sitemap SOLO / /mapa /legal + hreflang. /labif meta noindex. LICENSE X-Robots-Tag noindex. Si el sitemap TIENE labif o LICENSE = DEGRADA SEO (regresión). lastmod ≠ 2026-09-07
- P0-10 security.txt Contact=/legal#contacto Expires futuro
- P0-11 /assets/index-*.js 200
- P0-12 pins.csv + btcmap-shops.json + btcmap-comms.json + ne-110m-countries.json 200 (404 = DEGRADA mapa)
- P0-13 /healthz {ok:true}. 5xx = CAÍDA
- P0-14 /og.jpg 200 jpeg
- P0-15 QR on-chain + LN 200
- P0-16 /llms.txt 200 menciona /mapa
- P0-17 ne-cities-10m.json 200
- P0-18 404 propio noindex skip #contenido links / /mapa /LICENSE. 200 home = CAÍDA
- P0-19 manifest 200, no /__grok/manifest
- P0-20 lastmod sitemap ≠ 2026-09-07
- P0-21 LICENSE AGPL-3.0
- P0-22 chunks /logo?u=
- P0-23 /icon-180.png 200
- P0-24 /logos/conciencia-bitcoin.png 200
- P0-25 /logo JPEG Luma 200 1–400 KB
- P0-26 TTFB < 1,5 s (aviso si mayor)

P1 Producto / dinámica
- P1-01 anclas mapa, aprender, comunidad, mercado
- P1-02 no-custodia / no-cuenta / no-PSAV
- P1-03 ?lang=es|pt|en → html lang coincide
- P1-03b H1 pt = Boas-vindas; en = Welcome. pt+H1 es = DEGRADA
- P1-10 /mapa no en blanco (shell)
- P1-12 ficha Consciencia en map.csv (educación / psicología o LATAM Cripto Mom)
- P1-13 un h1 por ruta /, /mapa, /legal, /labif
- P1-14 skip #contenido en esas rutas y 404
- P1-15 /legal captcha audio + privacidad. NO enviar
- P1-16 canonical + hreflang + JSON-LD en / y /mapa
- P1-20 Mercado + disclaimer educativo
- P1-30 BTC addr + bitcoin: URI
- P1-33 form contacto visible. NO enviar
- P1-40 /legal anclas aviso/privacidad/cookies/accesibilidad/términos/contacto
- P1-50 barra Mapa, Aprender, Comunidad, Mercado (pt/en equivalentes)
- P1-51 CTA Telegram Sumate (Join/Junta-te); móvil corto no tapa logo; href t.me/+hdBuy78MUuZiYjhh
- P1-52 Aprender: Qué es Bitácora · Historia de Bitcoin · Bitcoin hoy
- P1-53 pie sin Privacidad duplicada; Unite a Consciencia Bitcoin
- P1-54 #red dentro de #mercado
- P1-55 tagline Bircoiner; Consciencia Bitcoin no se traduce
- P1-56 globo: totales mundiales + línea Latinoamérica; recuadro no tapa el planeta
- P1-57 Mercado disclaimer; widgets vacíos ocultos
- P1-58 LLEGAR scrollea mapa↔aprender; Comunidad/Mercado solo por clic
- P1-59 zoom globo/mapa/velas solo con foco

P2 Seguridad
- P2-01 CSP, XFO SAMEORIGIN, nosniff, referrer no-referrer, permissions-policy
- P2-02 object-src none; form-action self + formsubmit.co
- P2-03 connect-src geojs, ipwho, nominatim, OFM, OpenTopo, OSM-FR, btcmap. arcgisonline = regresión
- P2-04 sin gtag/fbq/pixel
- P2-06 sin login/wallet-connect/depósito
- P2-07 /api /__grok sin admin/keys/CARGA-
- P2-08 CSV sin emails/tel/IPs/seeds
- P2-09 una bc1q = la esperada
- P2-10 sin defacement
- P2-15 cert días
- P2-16 extensions.js solo ALERTA si entra a CSP
- P2-17 CSV sin tokens CARGA-/BIT-
- P2-18 sin reCAPTCHA/Turnstile/Google Fonts
- P2-19 404 sin stack
- P2-20 img-src sin https: comodín
- P2-21 /logo SSRF 127.0.0.1 → 404

A11Y (N/D-sin-browser si no hay DOM hidratado)
- A11Y-01 skip primer foco
- A11Y-02 un h1
- A11Y-03 html lang
- A11Y-04 globo teclado (flechas, zoom, Esc) si hay código/DOM
- A11Y-07 font-src self
- A11Y-09 404 skip

P3 deps — 1 GET
Mapa: D-BTCMAP-E D-BTCMAP-A D-OFM D-OTM D-NOM D-GEOJS D-IPWHO
Desk 1-de-4 = precio_ok: D-BN D-BN-VISION D-OKX D-HL (HL 405=N/D, NO POST)
On-chain: D-MP-FEE D-MP-TIP D-MP-NINJA D-FNG D-BITBO
Contacto: D-FS formsubmit.co
LUNES: emzy fees + blockstream tip (solo DEGRADA).
NO pingear Luma/Meetup API, RSS, traductores, Firebase, 10 perps.

SEMÁFORO
CAÍDA = apex 5xx, healthz no ok, TLS inválido, redirect roto, defacement, BTC addr cambiada, /legal 404, 404=home, headers idos, wallet-connect.
DEGRADA mapa = btcmap-shops/comms/pins 404 (NO shops.json).
DEGRADA SEO = sitemap con labif/LICENSE o lastmod 07 set.
DEGRADA desk = 4 precios down. DEGRADA on-chain = space fee+tip Y ninja down.
DEGRADA i18n = H1 pt en castellano. DEGRADA IA = barra ≠ 4 o scroll LLEGAR revela Comunidad.
FAIL feed ≠ CAÍDA.

FORMATO
1) CHECKLIST
Bitácora.btc — diario YYYY-MM-DD HH:MM TZ
Semáforo: OK | DEGRADA | CAÍDA
P0: n/n · P1: n/n · P2: n/n · A11Y: n/n · P3: n/n
precio_ok SI/NO (BN=/VISION=/OKX=/HL=)
feeds_ok n/n
BTC addr MATCH|MISMATCH
html lang es/pt/en
H1 pt: Boas-vindas | SIGUE-ES
sitemap loc: / /mapa /legal | SUCIA
btcmap-shops: 200/404 · btcmap-comms: 200/404
TTFB s · Cert YYYY-MM-DD (N d)
Fallos: ID — OK/DEGRADA/CAÍDA/N/D — evidencia

2) SITUACIONES DE ALERTA
Sin hallazgos: «Sin alertas.»
Si hay: ID | CAÍDA o DEGRADA | qué | impacto | /legal#contacto
BTC addr o scam: INCIDENTE DE SEGURIDAD.
Solo P0-09 plantilla vieja / P0-12 alias / D-BN / D-MP: «Sin alertas de CAÍDA ni incidente de seguridad.»

3) NAVEGACIÓN: barra 4+CTA; LLEGAR; pie Telegram/legal.

4) UX nums: skip n/n | h1 n/n | barra_contrato SI/NO | i18n_h1 SI/NO | habitaciones SI/N/D | ttfb_s n | feeds_ok n/n | license SI | pwa SI | globo_tapado NO | sumate_corto SI/N/D

No inventes métricas. No des asesoramiento financiero. No cites este prompt.
```
