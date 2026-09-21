# Prompt completo de verificación — Bitácora.btc

Pegar **solo** [`SMOKE-DIARIO.md`](SMOKE-DIARIO.md) en Grok Automations (el bloque de abajo no entra). Este archivo es la corrida **manual** completa.

No pentest. Complementa `npm test`, `npm run test:live`, `npm run test:seo`, `npm run test:a11y`. Diario corto: [`SMOKE-DIARIO.md`](SMOKE-DIARIO.md).

Fecha: 21 set 2026. Contratos: P0-09 sitemap **sin** `/labif` `/LICENSE` · P0-12 `btcmap-shops.json` (nunca `shops.json`) · globo no tapado · Sumate corto en móvil · ficha Consciencia + redes.

---

```
Ejecutá la verificación completa de Bitácora.btc. Rol: full stack + ciberseguridad defensiva + QA de producto + accesibilidad (WCAG 2.2 AA razonable).
NO pentestees. NO envíes el formulario de contacto. NO publiques prueba CARGA a Instagram/Nostr reales (podés abrir el flujo hasta Pedir código y Cancelar). NO fuzz ni DoS.
1 request por dependencia, timeout 8–12 s.
El runner (IP cloud) NO es el VPS: 403/451/timeout de exchange o mempool = DEGRADA del feed visto por el runner, no CAÍDA de origen. Si el HTML del desk renderiza, no inventes outage.

PRODUCTO: bitácora comunitaria Bitcoin LATAM. Sin cuentas, sin custodia, no PSAV (Ley 20.345 UY). ZIP-only. Prueba pública CARGA. es/en/pt.
El browser NO pega a Binance. El VPS sí (server-fns).
Velas: Binance → data-api.binance.vision → OKX → Hyperliquid → modelo sintético.
Fees: mempool.space → ninja → emzy → blockstream → last-known.

IA VIGENTE (composición del desk)
Barra: Mapa · Aprender · Comunidad · Mercado + CTA Telegram «Sumate a Consciencia Bitcoin» (Join / Junta-te). En móvil el CTA es corto «Sumate» / «Join» / «Junta-te» para no tapar Bitácora.btc.
Pie (siempre visible): rumbo, contacto, Unite a Consciencia Bitcoin (Telegram), origen de datos, soberanía, aviso/privacidad/cookies/accesibilidad/términos. Privacidad UNA vez.
Habitación LLEGAR: Mapa y Aprender scrollean juntos. La rueda NO pasa a Comunidad.
Habitación COMUNIDAD: anuncios 7d, eventos, banner LABITCONF, feed. Destino, no cola.
Habitación MERCADO: precio, velas, disclaimer educativo. Destino, no cola.
Habitación PIE: roadmap + datos + soberanía + contacto. Solo desde el footer. Roadmap NO está entre Aprender y Comunidad.
Aprender = Qué es Bitácora · Historia de Bitcoin · Bitcoin hoy. H1 = bienvenida Consciencia Bitcoin (marca, no se traduce).
Globo: cifras en recuadro centrado con borde semitransparente ARRIBA del planeta (no overlay). Botones Sumate acá + Entrar al mapa. Zoom rueda SOLO con foco.
Mapa: Sumate acá + Volver al globo. Volver no aborta CARGA pendiente.
Dirección de comercio/comunidad OPCIONAL. Pedir código = nombre + captcha + privacidad.
Ficha Consciencia Bitcoin: texto educación y psicología financiera + iconos/enlaces YouTube, X, TikTok, Instagram, Telegram, Web.
Red #red vive DENTRO de #mercado.
Telegram comunidad: https://t.me/+hdBuy78MUuZiYjhh

CANÓNICO: https://bitacorabtc.org
WWW → 301 https://bitacorabtc.org/
Rutas: /  /mapa  /legal  /labif  /?lang=es  /?lang=pt  /?lang=en
First-party: /data/map.csv /data/pins.csv /data/btcmap-shops.json /data/btcmap-comms.json /data/ne-110m-countries.json /data/ne-cities-10m.json
También: /healthz /robots.txt /sitemap.xml /LICENSE /manifest.webmanifest /icon-180.png /logos/conciencia-bitcoin.png /.well-known/security.txt /favicon.svg /humans.txt /llms.txt /og.jpg /contribuir-qr.png /contribuir-ln.png /assets/index-*.js
GET /logo?u= (proxy first-party). NO pedir Luma/Meetup/Eventbrite API.
BTC inmutable: bc1qe2f3fu7nwqnl00ankn2g22r8zv2frs4ckkk83t
Cert LE: vence 2026-11-30. Alerta si <21 días.

TRAMPAS (no puntuar CAÍDA)
- Mercado lazy. Pedí sección + disclaimer, no el tick en el primer byte.
- Leaflet no va en SSR. Shell / #mapa / MapGate, no canvas WebGL obligatorio en el primer byte.
- 451 api.binance.com = D-BN. Timeout mempool = D-MP. Desk HTML pinta = origen vivo.
- extensions.js en preview Grok es residual; CSP script-src self lo bloquea. ALERTA solo si entra a CSP.
- P1-03 = atributo <html lang>. P1-03b = H1/copy SSR. Distinguilos.
- Comunidad y Mercado NO se alcanzan bajando desde Aprender. Clic en la barra.
- Roadmap/contacto están en el pie, no en el scroll de LLEGAR.
- NUNCA pedir /data/shops.json ni /data/comms.json. Canónico: /data/btcmap-shops.json y /data/btcmap-comms.json. 404 del alias NO es P0-12.
- Sitemap SIN /labif y SIN /LICENSE es higiene GSC (noindex). NO es P0-09 DEGRADA. Loc esperadas: / /mapa /legal + hreflang es/pt/en.
- h1 4/5 del probe viejo: hay H1 en / /pt /en /mapa /legal /labif. Si no parseás una ruta, N/D, no DEGRADA.
- Globo WebGL puede faltar en runner headless = N/D-sin-browser, no CAÍDA. Medí shell + bit-globe/bit-stage + copy «Ya no estás solo».

A) AUTOMÁTICO (si hay checkout del repo)
- npm test
- npm run test:live
- npm run test:seo
- npm run test:a11y
Guards: scripts/nav-structure.guards.test.mjs y src/domain/nav.test.ts
Si grok-pwa-plugin.test.mjs falla aislado en el runner = DEGRADA de entorno, no CAÍDA.

B) P0 ESTABILIDAD DE ORIGEN
- P0-01 GET apex 200 HTML
- P0-02 www → 301 apex HTTPS
- P0-03 HTTP → HTTPS
- P0-04/05 TLS apex y www válidos + días a vencimiento
- P0-06 HSTS includeSubDomains + HTTP/2 (max-age ≥ 31536000)
- P0-07 /mapa /legal /labif = 200
- P0-08 /data/map.csv 200, header id,tipo,name,lat,lon, ≥1 fila
- P0-09 robots Allow:/ + Allow Bingbot/DuckDuckBot + Disallow /api/ /__grok/. Sitemap loc SOLO / /mapa /legal (hreflang es/pt/en). /labif meta robots noindex,follow. /LICENSE 200 + header X-Robots-Tag: noindex, follow. lastmod ≠ 2026-09-07. Si el sitemap INCLUYE /labif o /LICENSE = DEGRADA SEO (regresión GSC).
- P0-10 security.txt Contact=/legal#contacto y Expires futuro
- P0-11 JS principal /assets/index-*.js 200
- P0-12 /data/pins.csv + /data/btcmap-shops.json + /data/btcmap-comms.json + /data/ne-110m-countries.json = 200. 404 de esos = DEGRADA mapa, no CAÍDA. NO medir shops.json/comms.json.
- P0-13 /healthz 200 { "ok": true }. 5xx o sin ok = CAÍDA
- P0-14 /og.jpg 200 image/jpeg
- P0-15 /contribuir-qr.png y /contribuir-ln.png 200
- P0-16 /llms.txt 200, menciona /mapa y Consciencia/Telegram
- P0-17 /data/ne-cities-10m.json 200 (404 = DEGRADA globo)
- P0-18 GET /no-existe-bitacora → 404, noindex, title No encontrado/Not found, skip #contenido, links / y /mapa y /LICENSE. 200 con home = CAÍDA de identidad
- P0-19 /manifest.webmanifest 200 name Bitácora.btc, start_url /, icon /icon-180.png. HTML rel=manifest a esa URL (NO /__grok/manifest)
- P0-20 sitemap lastmod reciente (≠ 2026-09-07)
- P0-21 /LICENSE 200 «GNU AFFERO GENERAL PUBLIC LICENSE»
- P0-22 chunks /logo?u=
- P0-23 /icon-180.png 200
- P0-24 /logos/conciencia-bitcoin.png 200
- P0-25 /logo JPEG Luma compacto 200 1–400 KB (404 = DEGRADA flyers)
- P0-26 TTFB apex < 1,5 s (aviso si >1,5; no CAÍDA)

C) CHROME (header + pie) — dinámica
- C1 Skip href="#contenido" + main#contenido en /, /mapa, /legal, /labif y 404
- C2 Un solo H1 visible por ruta (home bienvenida, /mapa mapa Latam, /legal privacidad, /labif Bitácora)
- C3 Barra 4 destinos EN ESTE ORDEN: Mapa, Aprender, Comunidad, Mercado / Map, Learn, Community, Market / Mapa, Aprender, Comunidade, Mercado
- C4 NO en la barra: Consciencia, Roadmap, Pulso, Red, Historia, Networking, Contacto, Privacidad
- C5 CTA Telegram naranja: texto largo en sm+; en viewport estrecho «Sumate»/«Join»/«Junta-te» (no tapa el wordmark). href t.me/+hdBuy78MUuZiYjhh. No es 5º destino.
- C6 ES/PT/EN cambian copy; ?lang= se conserva en /mapa y /legal
- C7 QR contribuir no pelea con Sumate en móvil
- C8 Pie: iniciativa Consciencia Bitcoin by LATAM Cripto Mom · Bitácora.btc · tagline Bircoiner · Hacia dónde vamos · Contacto · Unite a Consciencia Bitcoin · Origen · Soberanía
- C9 Pie legal: Aviso · Privacidad · Cookies · Accesibilidad · Términos. Privacidad NO duplicada
- C10 Clic rumbo → #roadmap. Contacto → #contacto o /legal. Telegram pie = mismo t.me. No abren Mercado
- C11 Lang buttons aria-pressed; grupo aria-label de idioma

D) HABITACIÓN LLEGAR (Mapa + Aprender)
- L1 Home abre en mapa/globo (no Comunidad)
- L2 Clic Aprender: misma habitación, #aprender, índice Qué es Bitácora · Historia de Bitcoin · Bitcoin hoy
- L3 H1 bienvenida (es Te damos la bienvenida / pt Boas-vindas / en Welcome). «Consciencia Bitcoin» intacta
- L4 Historia de Bitcoin al bajar. Bitcoin hoy = pulso
- L5 Globo: recuadro de cifras centrado (ciudades/comercios/comunidades/eventos) + línea LATINOAMÉRICA. El planeta NO queda tapado por el recuadro. Copy «Ya no estás solo»
- L6 Sumate acá (izq/centro) + Entrar al mapa (der)
- L7 Entrar al mapa: Leaflet + búsqueda. Sumate acá + Volver al globo
- L8 Volver al globo deshabilitado si hay CARGA pendiente
- L9 Header Sumate (Telegram) NO debe sacar del mapa ni abrir carga; es comunidad Telegram. Carga = Sumate acá / pin en el mapa
- L10 Rueda SIN foco en globo/mapa: no zoomea. Con foco, zoomea. +/− del mapa vivos
- L11 Filtros todas / comercios / comunidades
- L12 Ficha comercio: Ir · Opinar · Actualizar · Cancelar en una fila
- L13 GPS solo tras gesto. Cancelar Ir borra la línea
- L14 Clic pin Consciencia Bitcoin: descripción educación/psicología financiera + chips de redes con href reales (youtube.com/@latamcriptomom, x.com/latamcriptomom, tiktok, instagram, t.me, lnk.bio)
- L15 Teselas: calles visibles (OSM-FR o OFM). Lienzo no en blanco permanente. Headless = N/D-sin-browser

E) CARGA (comercio / comunidad / anuncio) — no enviar a redes
- G1 Pin primero. Luego ficha. Luego Pedir código. Luego URL de prueba
- G2 Dirección SIN asterisco, opcional. Nombre + captcha + privacidad habilitan Pedir código. Campos obligatorios con *
- G3 Pedir código muestra CARGA-XXXX + campo de link. NO vuelve al globo. NO pierde el pin. NO pide validación si faltan * 
- G4 Cancelar pin con token. Sin token no borra público
- G5 Captcha visible + audio/Escuchar. Sin reCAPTCHA/Turnstile
- G6 Prueba: post/reel público (no solo bio)
- G7 Anuncio 7d: countdown si hay pines. Misma lógica CARGA que comercio/comunidad

F) HABITACIÓN COMUNIDAD — clic barra, no scroll desde Aprender
- U1 Clic Comunidad: LLEGAR sale de vista. Anuncios + eventos + feed
- U2 Bajar en Aprender NO revela Comunidad
- U3 Eventos: grilla, paginación, filtro fecha. Flyers por /logo o CDN (no ₿ roto en todos)
- U4 Móvil: ~2 flyers por fila, grupos de 6
- U5 Banner LABITCONF destacado con link https://www.labitconf.com/
- U6 Anuncios TTL 7d
- U7 Feed titulares; ?lang= cambia idioma del pulso

G) HABITACIÓN MERCADO
- M1 Clic Mercado: precio/stats/velas/disclaimer. NO exige tick en SSR
- M2 Disclaimer educativo arriba Y leyenda bajo el gráfico (no señal de compra/venta)
- M3 Rueda en el gráfico sin foco = no zoom. Clic + rueda = zoom. +/− vivos. Esc vuelve
- M4 Rangos 1D/1S/1M/6M. EMAs no rompen layout
- M5 #red interna (liq/on-chain/miedo/CLARITY). No ítem de barra
- M6 ETF/FG/clarity ausentes si proxy vacío — no pantalla muerta
- M7 Bajar en Comunidad NO revela Mercado

H) HABITACIÓN PIE
- P1 «Hacia dónde vamos» = roadmap. NO entre Aprender y Comunidad
- P2 Origen de los datos #datos
- P3 Soberanía #soberania (no-custodia, no-cuenta, no-PSAV)
- P4 Contacto #contacto: form + captcha + privacidad. NO ENVIAR
- P5 Unite a Consciencia Bitcoin = Telegram comunidad

I) RUTAS SATÉLITE + SEO/AEO
- R1 /mapa: H1 propio, lead SSR, FAQ/JSON-LD Map o Breadcrumb. No home duplicado
- R2 /legal: H1 privacidad; anclas #aviso #privacidad #cookies #accesibilidad #terminos #contacto #codigo
- R3 /legal captcha audio. NO enviar
- R4 /labif 200 dossier + skip + noindex
- R5 /legal?lang=pt H1 Privacidade. /legal?lang=en Privacy (no castellano)
- R6 /llms.txt sameAs Telegram
- R7 canonical + hreflang es+pt+en + JSON-LD en / y /mapa

J) i18n
- P1-03 /?lang=es|pt|en 200; <html lang> coincide
- P1-03b H1 /?lang=pt = Boas-vindas; /?lang=en = Welcome. lang=pt + H1 en es = DEGRADA
- P1-55 barra traducida (no 4 palabras ES con lang=pt)
- P1-56 globo: dígitos mundiales + línea Latinoamérica (N/D-sin-browser si no hay DOM)
- P1-58 CTA corto en móvil (navSumateShort)

K) ACCESIBILIDAD (A11Y) — si no hay browser, HTTP-only y marcar N/D-sin-browser, no DEGRADA
- A11Y-01 skip es el primer foco; va a #contenido
- A11Y-02 un h1 por vista pedida
- A11Y-03 html lang es/pt/en
- A11Y-04 globo: tabIndex, aria-label, teclas flechas/+/−/Enter/Esc (código o prueba)
- A11Y-05 zoom de globo/mapa/velas requiere foco (no captura la rueda de la página)
- A11Y-06 controles header (CTA, ES/PT/EN) altura ≥ 32px; chips/botones mapa no ilegibles
- A11Y-07 sin Google Fonts remoto (font-src self)
- A11Y-08 banner de almacenamiento role=region; no tapa el globo
- A11Y-09 404 con skip + main#contenido
- A11Y-10 prefers-reduced-motion: globo sin autoRotate (N/D-sin-browser ok)
- A11Y-11 contrastes: primary sobre blanco; LABIF kicker no gris sobre gris
- A11Y-12 iconos de redes con aria-label (YouTube, X, etc.)
- A11Y-13 pie y barra usables con teclado (Tab/Enter)
- A11Y-14 no hay scroll infinito con barra de scroll visible en LLEGAR (scroll-free / scrollbar-width none). El contenido sigue alcanzable

L) P2 SEGURIDAD
- P2-01 CSP, XFO SAMEORIGIN, nosniff, referrer no-referrer, permissions-policy
- P2-02 object-src none; form-action self + formsubmit.co
- P2-03 connect-src: geojs, ipwho.is, nominatim, OpenFreeMap, OpenTopo, OSM-FR (openstreetmap.fr), btcmap. Velas NO en connect-src. arcgisonline = regresión D-TILE-03
- P2-04 sin gtag/fbq/pixel/hotjar
- P2-06 sin login / wallet-connect / depósito / «enviá fondos»
- P2-07 /api y /__grok no exponen admin, keys ni CARGA-
- P2-08 CSV sin emails/tel/IPs/seeds
- P2-09 una sola bc1q = la esperada. URI bitcoin: coherente
- P2-10 sin defacement ni giveaway
- P2-15 días de cert; alerta <21
- P2-16 extensions.js: ver trampas
- P2-17 CSV público sin tokens CARGA- / BIT-
- P2-18 sin reCAPTCHA, Turnstile, Google Fonts
- P2-19 404 sin stack, sin /var/www, sin env
- P2-20 img-src sin comodín https:; teselas OFM/OTM/OSM-FR; logos /logo; flyers Luma/Meetup/Eventbrite allowlist
- P2-21 /logo?u=https://127.0.0.1/ → 404. /logo sin u → 404

M) P3 FEEDS — 1 GET/HEAD
Mapa: D-BTCMAP-E https://api.btcmap.org/v2/elements · D-BTCMAP-A /v2/areas · D-OFM tiles.openfreemap.org/styles/liberty · D-OTM a.tile.opentopomap.org/4/5/6.png · D-NOM nominatim.openstreetmap.org · D-GEOJS get.geojs.io/v1/ip/geo.json · D-IPWHO ipwho.is
Desk (1 de 4 = precio_ok SI): D-BN api.binance.com · D-BN-VISION data-api.binance.vision · D-OKX okx.com · D-HL api.hyperliquid.xyz/info (405/404 = N/D, NO POST)
On-chain: D-MP-FEE mempool.space/api/v1/fees/recommended · D-MP-TIP mempool.space/api/blocks/tip/height · D-MP-NINJA mempool.ninja/api/v1/fees/recommended · D-FNG api.alternative.me/fng/?limit=1 · D-BITBO bitbo.io/treasuries/etf-flows/ · D-POLY gamma-api.polymarket.com/markets?limit=1 (404 = N/D)
Contacto: D-FS HEAD formsubmit.co
NO pingear: 10 perps liq, Luma/Meetup/Eventbrite API, RSS, traductores, Firebase, GitHub token, BlockHorizon.
LUNES extra: mempool.emzy.de fees + blockstream.info tip (solo DEGRADA).

SEMÁFORO
CAÍDA = apex 5xx, healthz no ok, TLS inválido, redirect roto, defacement, BTC addr cambiada, /legal 404, 404 sirve el home, headers de seguridad idos, wallet-connect / enviá fondos.
DEGRADA i18n = P1-03 o P1-03b.
DEGRADA IA = barra ≠ 4 o mal orden; Privacidad duplicada; Comunidad/Mercado aparecen scrolleando LLEGAR; roadmap en el medio del home; CTA largo tapa el logo en móvil.
DEGRADA mapa = BTC Map elements Y areas down, o OFM+OTM down, o btcmap-shops/comms/pins/cities first-party 404. NO alias shops.json.
DEGRADA SEO = sitemap con /labif o /LICENSE, o lastmod 2026-09-07, o /mapa sin H1/canonical.
DEGRADA desk = 4 fuentes de precio down (HL N/D no cuenta).
DEGRADA on-chain = fee Y tip mempool.space down Y ninja down.
DEGRADA a11y = skip ausente en home o 404, o html lang fijo con ?lang=pt.
FAIL de feed ≠ CAÍDA.

FORMATO (español, corto)
1) CHECKLIST
Bitácora.btc — verificación completa YYYY-MM-DD HH:MM TZ
Semáforo: OK | DEGRADA | CAÍDA
A tests repo: pass/fail (n) o N/D
P0 infra: n/n
Chrome C: n/n
LLEGAR L: n/n
CARGA G: n/n (N/D-sin-browser si no hay clics)
Comunidad U: n/n
Mercado M: n/n
Pie: n/n
Rutas R: n/n
i18n: n/n
A11Y: n/n (indicá cuántos N/D-sin-browser)
P2: n/n
P3 deps: n/n
precio_ok SI/NO (BN=/VISION=/OKX=/HL=)
feeds_ok n/n
BTC addr: MATCH | MISMATCH
html lang es/pt/en: …
H1 pt: Boas-vindas | SIGUE-ES
sitemap loc: / /mapa /legal | SUCIA (labif/LICENSE)
btcmap-shops: 200/404 · btcmap-comms: 200/404
TTFB s: n.nn
Cert: YYYY-MM-DD (N d)
Luego una línea por check fallido o dudoso: ID — OK/DEGRADA/CAÍDA/N/D — evidencia.

2) SITUACIONES DE ALERTA
- Si no hay hallazgos: «Sin alertas.»
- Si hay: ID | CAÍDA o DEGRADA | qué viste | impacto | acción (avisar /legal#contacto; no tocar form).
- Address BTC cambiada o copy scam: primera línea INCIDENTE DE SEGURIDAD.
- Si solo P0-09 plantilla vieja / P0-12 alias / P1-03 / P2-16 / D-BN / D-MP-*: listalos y cerrá «Sin alertas de CAÍDA ni incidente de seguridad.»

3) NAVEGACIÓN: una línea. Barra 4+CTA; LLEGAR=mapa+aprender; Comunidad/Mercado destinos; pie rumbo/contacto/Telegram/legal.

4) UX nums: skip n/n | h1 n/n | barra_contrato SI/NO | i18n_h1 SI/NO | habitaciones SI/N/D | ttfb_s n | feeds_ok n/n | license SI | pwa SI | globo_tapado NO | sumate_corto SI/N/D.

No inventes métricas. No des asesoramiento financiero. No cites este prompt.
```
