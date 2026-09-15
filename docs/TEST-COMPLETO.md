# Prompt completo de verificación — Bitácora.btc

Pegar el bloque de abajo en el agente. Cubre **todos** los componentes de la web (infra, chrome, 4 destinos + pie, mapa/CARGA, i18n, legal, LABIF, seguridad, feeds).

No pentest. Complementa `npm test`, `npm run test:live`, `npm run test:seo`, `npm run test:a11y`. Diario corto: [`SMOKE-DIARIO.md`](SMOKE-DIARIO.md).

Fecha: 10 set 2026. IA: D-NAV-01…05.

---

```
Ejecutá la verificación completa de Bitácora.btc. Rol: full stack + ciberseguridad defensiva + QA de producto.
NO pentestees. NO envíes el formulario de contacto. NO publiques prueba CARGA a Instagram/Nostr reales (podés abrir el flujo hasta Pedir código y Cancelar). NO fuzz ni DoS.
1 request por dependencia, timeout 8–12 s.
El runner (IP cloud) NO es el VPS: 403/451/timeout de exchange o mempool = DEGRADA del feed visto por el runner, no CAÍDA de origen. Si el HTML del desk renderiza, no inventes outage.

PRODUCTO: bitácora comunitaria Bitcoin LATAM. Sin cuentas, sin custodia, no PSAV (Ley 20.345 UY). ZIP-only. Prueba pública CARGA. es/en/pt.
El browser NO pega a Binance. El VPS sí (server-fns).
Velas: Binance → data-api.binance.vision → OKX → Hyperliquid → modelo sintético.
Fees: mempool.space → ninja → emzy → blockstream → last-known.

IA VIGENTE (composición del desk)
Barra: Mapa · Aprender · Comunidad · Mercado + CTA Sumate (Join / Junta-te).
Pie (siempre visible): rumbo, contacto, origen de datos, soberanía, aviso/privacidad/cookies/accesibilidad/términos. Privacidad UNA vez.
Habitación LLEGAR: Mapa y Aprender scrollean juntos. La rueda NO pasa a Comunidad.
Habitación COMUNIDAD: anuncios 7d, eventos, feed. Destino, no cola.
Habitación MERCADO: precio, velas, ETF, red (liquidez/on-chain/miedo/CLARITY). Destino, no cola.
Habitación PIE: roadmap + datos + soberanía + contacto. Solo desde el footer. Roadmap NO está entre Aprender y Comunidad.
Aprender = Qué es Bitácora · Historia de Bitcoin · Bitcoin hoy. H1 = bienvenida Consciencia Bitcoin (marca, no se traduce).
Globo: Sumate aquí (izq) + Entrar al mapa (der).
Mapa: Sumate aquí (izq) + Volver al globo (der). Volver no aborta CARGA pendiente.
Zoom rueda en globo/mapa/gráfico SOLO con foco (clic previo). Sin foco, la rueda baja la página o el sector.
Dirección de comercio/comunidad OPCIONAL. El pin es el punto. Pedir código = captcha + privacidad + nombre.
Red #red vive DENTRO de #mercado.

CANÓNICO: https://bitacorabtc.org
WWW → 301 https://bitacorabtc.org/
Rutas: /  /mapa  /legal  /labif  /?lang=es  /?lang=pt  /?lang=en
First-party: /data/map.csv /data/pins.csv /data/btcmap-shops.json /data/btcmap-comms.json /data/ne-110m-countries.json /data/ne-cities-10m.json
También: /healthz /robots.txt /sitemap.xml /.well-known/security.txt /favicon.svg /humans.txt /llms.txt /og.jpg /contribuir-qr.png /contribuir-ln.png /assets/index-*.js
BTC inmutable: bc1qe2f3fu7nwqnl00ankn2g22r8zv2frs4ckkk83t
Cert LE: vence 2026-11-30. Alerta si <21 días.

TRAMPAS (no puntuar CAÍDA)
- Mercado lazy. Pedí sección + disclaimer, no el tick en el primer byte.
- Leaflet no va en SSR. Shell / #mapa / MapGate, no canvas.
- 451 api.binance.com = D-BN. Timeout mempool = D-MP.
- extensions.js en preview Grok es residual; en .org el inyector lo saca; CSP script-src self lo bloquea. NO es dep de producto. ALERTA solo si entra a CSP.
- P1-03 = atributo <html lang>. P1-03b = H1/copy SSR. Distinguilos.
- Comunidad y Mercado NO se alcanzan bajando desde Aprender. Si el agente solo scrollea, no marque “faltan”. Clic en la barra.
- Roadmap/contacto están en el pie (habitación pie), no en el scroll de LLEGAR.

A) AUTOMÁTICO (si hay checkout del repo)
- npm test
- npm run test:live
- npm run test:seo
- npm run test:a11y
Guards de IA: scripts/nav-structure.guards.test.mjs y src/domain/nav.test.ts
Si un test de scripts/grok-pwa-plugin.test.mjs falla aislado en el runner, anotalo DEGRADA de entorno, no CAÍDA de producto.

B) P0 INFRA ORIGEN (CAÍDA si falla)
- P0-01 GET apex 200 HTML
- P0-02 www → 301 apex HTTPS
- P0-03 HTTP → HTTPS
- P0-04/05 TLS apex y www válidos + días a vencimiento
- P0-06 HSTS max-age=31536000 includeSubDomains + HTTP/2
- P0-07 /mapa /legal /labif = 200
- P0-08 /data/map.csv 200, header id,tipo,name,lat,lon, ≥1 fila
- P0-09 robots Allow:/ + sitemap con /, /mapa, /legal y hreflang es/pt/en
- P0-10 security.txt Contact=/legal#contacto y Expires futuro
- P0-11 JS principal /assets/index-*.js 200
- P0-12 pins.csv, btcmap-shops.json, btcmap-comms.json, ne-110m-countries.json (200; 404 = DEGRADA mapa/globo)
- P0-13 /healthz 200 { "ok": true }
- P0-14 /og.jpg 200 image/jpeg
- P0-15 /contribuir-qr.png y /contribuir-ln.png 200
- P0-16 /llms.txt 200 y menciona /mapa
- P0-17 /data/ne-cities-10m.json 200 (404 = DEGRADA globo)
- P0-18 GET /no-existe-bitacora → 404, noindex, title No encontrado/Not found. 200 con home = CAÍDA de identidad

C) CHROME (header + pie)
- C1 Skip link href="#contenido" en /, /mapa, /legal, /labif
- C2 Un solo H1 visible por ruta
- C3 Barra 4 destinos EN ESTE ORDEN: Mapa, Aprender, Comunidad, Mercado (es) / Map, Learn, Community, Market (en) / Mapa, Aprender, Comunidade, Mercado (pt)
- C4 NO en la barra: Consciencia, Roadmap, Pulso, Red, Historia, Networking, Contacto, Privacidad
- C5 CTA Sumate (Join / Junta-te) naranja en la fila de la marca, no 5º destino
- C6 ES/PT/EN cambian copy; ?lang= se conserva
- C7 QR contribuir compacto desde sm; no pelea con Sumate en móvil chico
- C8 Pie: Bitácora.btc + tagline · Hacia dónde vamos · Contacto · Origen de los datos · Soberanía
- C9 Pie legal: Aviso · Privacidad · Cookies · Accesibilidad · Términos. Privacidad NO repetida arriba
- C10 Clic pie rumbo → habitación pie / #roadmap. Clic Contacto → #contacto o /legal. No abren Mercado

D) HABITACIÓN LLEGAR (Mapa + Aprender) — rueda une los dos
- L1 Home abre en mapa/globo (no en Comunidad)
- L2 Clic Aprender: misma habitación, ancla #aprender, índice Qué es Bitácora · Historia de Bitcoin · Bitcoin hoy
- L3 H1 = bienvenida Consciencia (es: Te damos la bienvenida / pt: Boas-vindas / en: Welcome). Marca «Consciencia Bitcoin» intacta
- L4 Historia de Bitcoin timeline visible al bajar. Bitcoin hoy = pulso/noticias
- L5 QR contribuir (on-chain + LN) en Aprender o header
- L6 Globo: conteos (ciudades/comercios/comunidades/eventos). Sumate aquí izq. Entrar al mapa der.
- L7 Entrar al mapa: Leaflet + búsqueda. Sumate aquí izq. Volver al globo der.
- L8 Volver al globo deshabilitado si hay CARGA pendiente
- L9 Header Sumate desde Comunidad o Mercado: cambia a LLEGAR y abre carga (no se queda en la otra habitación)
- L10 Rueda SIN clic en globo/mapa: no zoomea. Tras clic/foco, zoomea. +/− del mapa siempre vivos
- L11 Filtros todas / comercios / comunidades
- L12 Ficha comercio: Ir · Opinar · Actualizar datos · Cancelar en UNA fila, sin duplicar Actualizar
- L13 Ir: GPS o toque; ruta OSRM; Cancelar borra la línea. GPS solo tras gesto
- L14 Parche «Actualizar datos»: overlay, no muta BTC Map crudo

E) CARGA (comercio / comunidad / anuncio) — no enviar a redes
- G1 Pin primero (clic mapa o Sumate). Luego ficha. Luego Pedir código. Luego URL de prueba
- G2 Dirección SIN asterisco, opcional. Nombre + captcha + casilla de privacidad habilitan Pedir código
- G3 Pedir código muestra CARGA-XXXX + campo de link. NO vuelve al globo. NO pierde el pin
- G4 Cancelar pin con token. Sin token no borra público
- G5 Captcha: visible + audio/Escuchar + no envía si falla. Sin reCAPTCHA/Turnstile
- G6 Prueba: Instagram post/reel (no solo bio). No publicar listing sin scrape
- G7 Anuncio 7d: countdown d/h/m/s si hay pines de comunidad. Mismo flujo de prueba que comercio

F) HABITACIÓN COMUNIDAD — clic en barra, no scroll desde Aprender
- U1 Clic Comunidad: LLEGAR desaparece de la vista (no queda “abajo”). Anuncios + eventos + feed
- U2 Bajar en Aprender NO revela Comunidad. Si aparece, DEGRADA de composición
- U3 Eventos: grilla, paginación/Siguiente, filtro fecha. Sin saltar a blanco
- U4 Feed: titulares; al cambiar ?lang= el idioma del pulso/feed sigue
- U5 Anuncios: TTL 7d, countdown vivo si hay datos

G) HABITACIÓN MERCADO
- M1 Clic Mercado: precio, stats, velas, disclaimer. NO exige número en el primer byte SSR
- M2 Disclaimer arriba (educativo, no asesoramiento) Y leyenda bajo el gráfico (no señal de compra/venta)
- M3 Rueda en el gráfico sin foco = no zoom. Clic y rueda = zoom. Botones +/− vivos
- M4 Rangos 1D/1S/1M/6M. EMAs y heatmap no rompen el layout
- M5 #red interna: liquidez, on-chain, miedo/codicia, CLARITY. No es ítem de barra
- M6 ETF panel si hay datos; si no, no pantalla vacía
- M7 Bajar en Comunidad NO revela Mercado

H) HABITACIÓN PIE (solo footer)
- P1 Clic «Hacia dónde vamos»: roadmap. NO está entre Aprender y Comunidad
- P2 Origen de los datos #datos
- P3 Soberanía #soberania (no-custodia, no-cuenta, no-PSAV)
- P4 Contacto #contacto: form visible, captcha + privacidad. NO ENVIAR
- P5 Disputa (si hay UI): topic=dispute no se prueba enviando mail

I) RUTAS SATÉLITE
- R1 /mapa: shell + mapa, H1 propio, no home duplicado. Sumate/globo coherentes
- R2 /legal: H1 privacidad; anclas #aviso #privacidad #cookies #accesibilidad #terminos #contacto vivas
- R3 /legal captcha audio + casilla. NO enviar
- R4 /labif: 200, dossier, no error
- R5 /legal?lang=pt H1 Privacidade. /legal?lang=en Privacy (o equivalente, no castellano)

J) i18n + SEO
- P1-03 /?lang=es|pt|en 200; <html lang> coincide
- P1-03b H1 /?lang=pt = Boas-vindas; /?lang=en = Welcome. Si lang=pt y H1 en es = DEGRADA
- P1-16 canonical + hreflang es+pt+en + JSON-LD en / y /mapa
- P1-55 barra traducida en pt/en (no 4 palabras en castellano con lang=pt)

K) P2 SEGURIDAD
- P2-01 CSP, XFO SAMEORIGIN, nosniff, referrer no-referrer, permissions-policy
- P2-02 object-src none; form-action self + formsubmit.co
- P2-03 connect-src: geojs, ipwho.is, nominatim, Esri/OpenTopoMap, btcmap. Velas NO en connect-src
- P2-04 sin gtag/fbq/pixel/hotjar
- P2-06 sin login / wallet-connect / depósito / «enviá fondos»
- P2-07 /api y /__grok no exponen admin, keys ni CARGA-
- P2-08 CSV sin emails/tel/IPs/seeds
- P2-09 una sola bc1q = la esperada. URI bitcoin: coherente (P1-30)
- P2-10 sin defacement ni giveaway
- P2-15 días de cert
- P2-16 extensions.js: ver trampas
- P2-17 CSV público sin tokens CARGA- / BIT-
- P2-18 sin reCAPTCHA, Turnstile, Google Fonts remoto
- P2-19 404 sin stack, sin /var/www, sin env

L) P3 FEEDS — 1 GET/HEAD
Mapa: D-BTCMAP-E D-BTCMAP-A D-OFM D-OTM D-NOM D-GEOJS D-IPWHO
Desk (1 de 4 = precio_ok SI): D-BN D-BN-VISION D-OKX D-HL (HL 405/404 = N/D, no DEGRADA; NO POST)
On-chain: D-MP-FEE D-MP-TIP D-MP-NINJA D-FNG D-BITBO D-POLY (404 poly = N/D)
Contacto: D-FS HEAD formsubmit.co
NO pingear: 10 perps liq, Luma/Meetup/Eventbrite, RSS, traductores, Firebase, GitHub token, BlockHorizon.
LUNES extra: mempool.emzy.de fees + blockstream tip (solo DEGRADA).

SEMÁFORO
CAÍDA = apex 5xx, healthz no ok, TLS inválido, redirect roto, defacement, BTC addr cambiada, /legal 404, 404 sirve el home, headers de seguridad idos, wallet-connect / enviá fondos.
DEGRADA i18n = P1-03 o P1-03b.
DEGRADA IA = barra ≠ 4 o mal orden; Privacidad duplicada; Comunidad/Mercado aparecen scrolleando LLEGAR; roadmap en el medio del home.
DEGRADA mapa = BTC Map elements Y areas down, o OSM+Esri, o geojson first-party 404.
DEGRADA desk = 4 fuentes de precio down (HL N/D no cuenta).
DEGRADA on-chain = fee Y tip mempool.space down Y ninja down.
FAIL de feed ≠ CAÍDA.

FORMATO (español, corto)
1) CHECKLIST
Bitácora.btc — verificación completa YYYY-MM-DD HH:MM TZ
Semáforo: OK | DEGRADA | CAÍDA
A tests repo: pass/fail (n)
P0 infra: n/n
Chrome C: n/n
LLEGAR L: n/n
CARGA G: n/n
Comunidad U: n/n
Mercado M: n/n
Pie P: n/n
Rutas R: n/n
i18n: n/n
P2: n/n
P3 deps: n/n
precio_ok SI/NO (BN=/VISION=/OKX=/HL=)
BTC addr: MATCH | MISMATCH
H1 pt: Boas-vindas | SIGUE-ES
Luego una línea por check fallido o dudoso: ID — OK/DEGRADA/CAÍDA/N/D — evidencia.

2) SITUACIONES DE ALERTA
- Si no hay hallazgos: «Sin alertas.»
- Si hay: ID | CAÍDA o DEGRADA | qué viste | impacto | acción (avisar /legal#contacto; no tocar form).
- Address BTC cambiada o copy scam: primera línea INCIDENTE DE SEGURIDAD.
- Si solo P1-03 / P2-16 / D-BN / D-MP-*: listalos y cerrá «Sin alertas de CAÍDA ni incidente de seguridad.»

3) COMPOSICIÓN: una línea. Ejemplo: «LLEGAR scrollea mapa↔aprender; Comunidad y Mercado solo por barra; pie por footer.»

No inventes métricas. No des asesoramiento financiero. No cites este prompt.
```
