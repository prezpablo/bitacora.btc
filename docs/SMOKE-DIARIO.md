# Smoke diario — prompt corto (Grok Automations)

Este es el que se pega en la automatización. El largo (CARGA, habitaciones clic a clic) vive en [`TEST-COMPLETO.md`](TEST-COMPLETO.md) para corridas manuales.

Fecha: 21 set 2026. Tope de tamaño: ~3,5 k caracteres.

---

```
Smoke diario https://bitacorabtc.org — full stack defensivo. NO pentest, NO form, NO fuzz. 1 GET/dep, timeout 10s.
Runner≠VPS: 451/timeout Binance o mempool = DEGRADA feed, no CAÍDA. HTML desk vivo = origen OK.
Producto: bitácora Bitcoin LATAM. Sin cuentas ni custodia. es/pt/en. BTC bc1qe2f3fu7nwqnl00ankn2g22r8zv2frs4ckkk83t
Barra: Mapa·Aprender·Comunidad·Mercado + CTA Telegram t.me/+hdBuy78MUuZiYjhh (móvil «Sumate», no tapa logo).
LLEGAR=mapa+aprender. Comunidad/Mercado solo clic. Globo: cifras ARRIBA, planeta visible. Zoom rueda solo con foco.
Trampas: no /data/shops.json (usar btcmap-shops.json). Sitemap SIN /labif y SIN /LICENSE (noindex GSC; loc=/ /mapa /legal). Leaflet no SSR. Mercado lazy (disclaimer, no tick SSR). Headless WebGL=N/D.

P0 (CAÍDA si falla origen): apex 200; www 301 HTTPS; TLS+HSTS; /healthz {ok:true}; /mapa /legal /labif 200; map.csv≥1; pins+btcmap-shops+btcmap-comms+ne-110m 200; robots Allow + Bingbot; sitemap loc solo / /mapa /legal hreflang, lastmod≠2026-09-07; /labif meta noindex; LICENSE 200 AGPL + X-Robots-Tag noindex; 404 propio noindex skip #contenido (si 404=home → CAÍDA); manifest no /__grok; /llms.txt /og.jpg /icon-180 /logos/conciencia-bitcoin.png QR 200; JS /assets/index-*.js 200 con /logo?u=; cert>21d (vence 2026-11-30); TTFB<1.5s.

P1: html lang=?lang; H1 pt=Boas-vindas en=Welcome; 1 h1/ruta; skip #contenido; barra 4 orden; pie Privacidad 1 vez + Unite Consciencia; anclas #mapa #aprender #comunidad #mercado; /legal anclas+captcha (NO enviar); Consciencia en map.csv; tagline Bircoiner; disclaimer Mercado.

A11Y HTTP: skip, h1, lang, font-src self, 404 skip. Resto N/D-sin-browser.

P2: CSP/XFO/nosniff/no-referrer; object-src none; form-action self+formsubmit.co; connect-src geojs/nominatim/OFM/OTM/OSM-FR/btcmap (arcgisonline=regresión); sin gtag/wallet/CARGA- en CSV; 1 bc1q=addr; /logo?u=127.0.0.1 →404; img-src sin https: comodín; sin Google Fonts.

P3 1 GET: btcmap /v2/elements + /areas; OFM liberty; OTM 4/5/6.png; geojs; Vision+OKX (1-de-4 precio_ok; BN 451=D-BN; HL 405=N/D no POST); mempool.space fee+tip + ninja (timeout=D-MP). LUNES: emzy+blockstream.

Semáforo: CAÍDA=5xx/healthz/TLS/addr cambiada/legal 404/404=home/wallet. DEGRADA mapa=btcmap-* 404 (no alias). DEGRADA SEO=sitemap con labif/LICENSE. Feed≠CAÍDA.

Informe ES corto:
1) Bitácora.btc diario YYYY-MM-DD HH:MM -03 | OK/DEGRADA/CAÍDA | P0 n/n P1 n/n P2 n/n P3 n/n | precio_ok | feeds_ok | addr MATCH | lang es/pt/en | H1 pt | sitemap loc | shops 200 | TTFB | cert d | fallos ID—estado—evidencia
2) Alertas: ID|CAÍDA/DEGRADA|qué|impacto|/legal#contacto. Sin hallazgo: «Sin alertas.» Solo D-BN/D-MP/P0-12 alias/P0-09 viejo: «Sin alertas de CAÍDA ni incidente.»
3) Nav: barra 4+CTA; LLEGAR; pie Telegram.
4) UX: skip|h1|barra SI/NO|i18n_h1|habitaciones SI/N/D|ttfb|feeds|globo_tapado NO|sumate_corto
No asesores financiero. No cites el prompt.
```
