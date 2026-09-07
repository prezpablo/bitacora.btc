# Tests externos — bitacorabtc.org

**Fecha:** 5 de setiembre de 2026  
**Origen:** `https://bitacorabtc.org`  
**Correr:** `npm run test:live`  (o `node scripts/probe-live.mjs`)  
**Estricto (P1-03 = fallo):** `PROBE_STRICT=1 npm run test:live`

El probe pega al sitio público. **No** usa mempool.space ni Binance para decidir si Bitácora está caída. Esos van como `DEGRADA` del *runner*, no del VPS.

Internos (repo): `npm run test:bitacora` — 80 tests de dominio, CSV, fees, i18n, parches, pines.

---

## A. Núcleo del sitio (CAÍDA si falla)

| # | Qué | URL | Esperado |
|---|---|---|---|
| A1 | Home | `/` | 200, HTML con Bitácora |
| A2 | Mapa | `/mapa` | 200 |
| A3 | Legal / privacidad | `/legal` | 200, texto Ley 18.331 |
| A4 | LABIF | `/labif` | 200 |
| A5 | Health | `/healthz` | 200 `{ ok: true }` |
| A6 | Robots | `/robots.txt` | Sitemap `bitacorabtc.org/sitemap.xml`, `Disallow: /api/` |
| A7 | Sitemap | `/sitemap.xml` | hreflang es/pt/en + `/mapa` `/legal` |
| A8 | OG | `/og.jpg` | 200, JPEG (no el recorte de Velar) |
| A9 | Favicon | `/favicon.svg` | 200 |
| A10 | QR on-chain / LN | `/contribuir-qr.png` `/contribuir-ln.png` | 200 |
| A11 | humans / llms | `/humans.txt` `/llms.txt` | 200 |
| A12 | Globo | `/data/ne-110m-countries.json` | 200 (cerró el 404 del 30/08) |
| A13 | Ciudades | `/data/ne-cities-10m.json` | 200 |
| A14 | Overlay propio | `/data/map.csv` `/data/pins.csv` | 200 |
| A15 | Catálogo | `/data/btcmap-shops.json` `/data/btcmap-comms.json` | 200 |

`scripts/probe-live.mjs` cubre A1–A15. Exit `1` = sitio roto.

---

## B. i18n SSR (P1-03 — DEGRADA hasta el ZIP)

| # | URL | Esperado tras ZIP `9bb7e57`+ |
|---|---|---|
| B1 | `/?lang=es` | `<html lang="es">`, title en español |
| B2 | `/?lang=pt` | `<html lang="pt">`, title en portugués |
| B3 | `/?lang=en` | `<html lang="en">`, title en inglés |
| B4 | Selector ES/PT/EN | Cambia copy **en cliente** (zustand). No alcanza para Google. |

Hoy en producción B2/B3 siguen en `lang="es"` hasta el ZIP que incluye el inyector `?lang=`. El probe lo marca `DEGRADA`. Con `PROBE_STRICT=1` pasa a fallo.

---

## C. Terceros (nunca CAÍDA del .org)

| # | Origen | Uso en Bitácora | Cómo leerlo |
|---|---|---|---|
| C1 | mempool.space | Fees / tip | Timeout del runner = D-MP-FEE. El VPS tiene ninja + emzy + blockstream + cache. |
| C2 | mempool.ninja / emzy / blockstream | Respaldo | Si **estos** y el cache fallan 2–3 días → avisar. |
| C3 | api.binance.com | Velas | 451 geo = D-BN. **No** mercado caído. |
| C4 | data-api.binance.vision | Velas | Debe 200. |
| C5 | OKX | Precio / tick / libro | Debe 200. Cubridor de Binance. |

---

## D. Manual (calidad, no el probe)

| # | Qué | Cómo | Meta |
|---|---|---|---|
| D1 | Lighthouse mobile Slow 4G | Chrome DevTools → bitacorabtc.org | Perf ≥ 80 (4G), ≥ 50 (3G) |
| D2 | Mapa: pin comercio | Clic → Ir · Opinar · Actualizar datos · Cancelar (una fila) | Sin duplicar Actualizar |
| D3 | Ir | GPS o toque en mapa; ruta OSRM; Cancelar borra la línea | Consentimiento |
| D4 | Alta comercio/comunidad/pin | Prueba pública CARGA; Instagram = post/reel o bio | No se publica sin scrape |
| D5 | Parche de ficha | Actualizar datos → CARGA → aparece overlay | BTC Map también (overlay) |
| D6 | Disputa | `/?topic=dispute&listing=ID#contacto` → ticket TKT- | Mail + SQLite |
| D7 | Pulso / feed | Cambiar idioma → titulares en ese idioma | Server-side translate |
| D8 | Eventos | Grilla 3×3, Siguiente, filtro fecha | Sin saltar página |
| D9 | Anuncios | Countdown real d/h/m/s hasta TTL 7d | Tiquea en vivo |
| D10 | Copiar on-chain | Botón + toast en el idioma | Clipboard |

---

## E. Cómo usarlo en el runner / VPS

Desde cualquier máquina con Node 22:

```bash
node scripts/probe-live.mjs
```

En el VPS (mide lo que **él** ve, no el runner):

```bash
cd /var/www/bitacora
sudo -u bitacora node scripts/probe-live.mjs
```

Cron diario 08:20 -03 (antes de la corrida 08:30):

```
20 8 * * * cd /var/www/bitacora && node scripts/probe-live.mjs >> /var/log/bitacora-probe.log 2>&1
```

Lectura: `SITE FAIL` = pager. `DEGRADA` = anotar 2–3 días, no tumbar el desk.
