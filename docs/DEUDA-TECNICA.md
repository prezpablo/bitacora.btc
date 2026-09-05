# Deuda técnica vigente — Bitácora.btc

**Fecha:** 5 de setiembre de 2026  
**Alcance:** código en `main` + VPS Njalla (`45.158.116.49`, Caddy + Node). Canónica: `https://bitacorabtc.org`.  
**Legal:** [`DEUDA-LEGAL.md`](DEUDA-LEGAL.md) · **Plan híbrido:** [`DEUDA-PLAN-HIBRIDO.md`](DEUDA-PLAN-HIBRIDO.md) · **Auditoría 2 set:** [`DEUDA-AUDITORIA-2026-09-02.md`](DEUDA-AUDITORIA-2026-09-02.md)

## Clean Architecture (4 set)

| Capa | Qué vive ahí | ¿Cumple? |
|---|---|---|
| `domain/` | Entidades, CSV, guía, geo-fix, calle, legal, event-board | **Sí.** No importa infra. |
| `application/` | Mercado, `locateOnConsent` | **Sí.** Puertos de mercado; geo fuse sin fetch. |
| `infrastructure/` | OSRM, BTC Map, SQLite, Photon, GPS, server-fns | **Sí.** Adapters. |
| `components/` | UI. `use-map-guide` orquesta Leaflet | **Parcial.** `spend-map.tsx` sigue siendo el formulario + pines. |

Regla de oro: el dominio no sabe de Leaflet ni de OSRM. La ruta y el GPS se piden **después** del clic (consentimiento).

### Qué se partió en esta tanda
- `use-map-guide.ts` — Ir, GPS, pasos, Cancelar
- `leaflet-fix.ts` — círculo ⊙
- `domain/street-addr.ts` — validar calle
- `hydrateMapCsv` — CSV → store (dominio)
- `MIN_STREET_ACCURACY_M = 150` — aviso si el GPS es burdo
- `domain/event-board.ts` — página 9, filtros, `?ep=`
- `lib/in-view.ts` + `LazyMount` — IntersectionObserver (5 set)

### Qué queda gordo (no reescribir ahora)
- `spend-map.tsx` (~1.3k) — alta de comercio/comunidad + pines
- `extra-feeds.ts`, `btc-map.ts`, `i18n.ts`
- `leaflet-routing-machine` en package.json, casi sin uso (la línea la dibuja Leaflet a mano)

---

## Prioridades (UX / carga — 5 set)

Tabla corta. Código ya bajado o deuda abierta.

| Pri | Ítem | Código | Estado |
|---|---|---|---|
| **P0** | ZIP a VPS = `main` | procedimiento ZIP | Abierto cada release |
| **P1** | Lazy por viewport | `src/lib/in-view.ts`, `src/components/lazy-mount.tsx`, `desk.tsx` | **Hecho 5 set** |
| **P1** | Mercado/tick/on-chain sólo al llegar a `#mercado` | `wantLive` + `useInView` en `desk.tsx` | **Hecho 5 set** |
| **P1** | Afiches de eventos lazy | `network-events.tsx` `loading=lazy decoding=async` | **Hecho 5 set** |
| **P1** | Heatmap off en 3G | `heatOn = !slowNet()` | **Hecho 5 set** |
| **P1** | URCDP pendiente de revisión | — | Legal |
| **P2** | Lighthouse mobile 3G en `.org` | correr DevTools / CI | **Auditoría código 5 set** (ver § UX) |
| **P2** | Tiles Leaflet 1x en 3G | `spend-map.tsx` | Abierto |
| **P2** | Globo canvas liviano / diferido | `map-gate.tsx` ya salta globo en 3G | Parcial |
| **P2** | Fuentes 400-first | `src/styles.css` Ubuntu latin-ext+700+mono | Abierto |
| **P2** | Cluster pines zoom bajo | `spend-map.tsx` | Abierto |
| **P2** | Partir alta fuera de `spend-map` | Clean Architecture | Abierto |
| **P2** | PWA offline geo + catálogo | — | Abierto |
| **P3** | Proxy WebP afiches | eventos (Luma/Meetup) | Abierto |
| **P3** | Cursor `eafter=` | `event-board.ts` hoy offset | No: catálogo ~120 |
| **P3** | Sacar LRM del bundle | `package.json` | Abierto |
| **P3** | a11y captcha no visual, globo teclado | — | Abierto |
| **P3** | Táctiles ≥ 44 px (QR `h-7`) | `contribute-qr.tsx` | Abierto |

**No reabrir:** sslip.io como canónica (el `.org` ya manda). Nginx. CMP de ads. Connect-wallet.

### Alertas 5 set (runner ≠ VPS)

Verificadas. No son CAÍDA. UI no se tocó.

| Código | ¿Cierto? | Qué hay | Qué se hizo |
|---|---|---|---|
| **D-MP-FEE / D-MP-TIP** | Sí: el runner no llega a mempool.space | Fees ya iban a emzy + blockstream + bitcoiner.live + last-known | Suma `mempool.ninja`. Tip sigue Esplora (`blockstream.info`) si mempool cae. Cache `mergeLiveFees`. Avisar sólo si se repite 2–3 días **y** el VPS también vacío. |
| **P1-03** | Sí: `<html lang="es">` y title fijos en SSR | `hreflang` en sitemap sí; HTML no seguía `?lang=` | `html lang` + title/description/json-ld desde `?lang=`. `useT` lee el query en SSR. Selector ES/PT/EN igual. |
| **D-BN** | Sí en el runner (451 geo). VPS a veces no | Mercado ya cae a OKX (`loadMarket`) | Spot vía `data-api.binance.vision` (docs oficiales) → `api.binance.com`. No alertar “mercado caído”. |
| First-party 404 (30/08) | **Cerrado** | `ne-110m`, pins, shops/comms | Hoy 200. El VPS está más al día que esa deuda. |

Próxima corrida runner: **06/09 08:30 -03**.

### Lighthouse (auditoría de código, 5 set)

Sin run CI todavía. Lo que Lighthouse mobile va a marcar, y qué hay:

| Categoría | Hallazgo | Mitigación |
|---|---|---|
| LCP | Globo Three / mapa Leaflet | 3G → mapa directo (`map-gate`). Resto: globo en idle. |
| TBT | 5 queries de mercado al hidratar | **Hecho:** `enabled` espera `#mercado` (IO). |
| Network | 9 JPG de Luma a la vez | **Hecho:** `loading=lazy` + LazyMount del tablero. |
| CLS | globo/mapa | `min-h-[min(70dvh,640px)]` + fallback ₿. Afiches: `width/height`. |
| JS unused | LRM, Recharts, Three | Recharts sólo si IO del chart; LRM P3. |
| Fonts | 4 cortes Ubuntu | P2: 400 al inicio. |
| a11y | captcha visual, velas sin teclado | P3. Skip-link y `prefers-reduced-motion` globo **hecho**. |

**Cierre P2 Lighthouse:** en Chrome DevTools → Lighthouse → Mobile + Slow 4G sobre `https://bitacorabtc.org`. Pegar scores (Perf / a11y / BP) acá. Meta: Perf ≥ 80 en 4G simulado, ≥ 50 en 3G.

### IntersectionObserver — cómo quedó

```
desk (mapa + conciencia)
  └ LazyMount  → roadmap, pines, eventos, feed, pulso, historia, velas, contacto
#mercado ref=useInView("280px")
  └ wantLive habilita getMarket / extras / tick / onchain / etf / pulse
```

Una vez intersecta, **queda montado** (latch). Hash `#mercado|#red|#pulso|#datos` salta el gate.

---

## Estado 2 set 2026 (fases)

| Fase | Qué | Estado |
|---|---|---|
| P0 producto / VPS | `/legal`, 18.331, CSV sin tokens, skip-link, canónica `.org`, `node:fs` fuera del client, last-known de APIs | **Cerrado** |
| P0 deploy | ZIP a `/var/www/bitacora` (no hay `.git` en el VPS) | Procedimiento estable |
| P1 URCDP | `Contacto y seguridad — Bitácora.btc` | **Presentada 2 set**, pendiente de revisión |
| P1 DNS | SPF `-all`, DMARC `p=reject`, CAA Let’s Encrypt (DonWeb) | **Cerrado** |
| P1 pimienta IP | `/etc/bitacora.env` + drop-in systemd | **Cerrado en VPS** |
| P1 QR on-chain | `bc1q…kk83t` en texto + PNG | Cerrado. BIP-322 pendiente (UniSat no firma a mano) |
| P1 arquitectura | Facade `lib/btc` muerto; serie modelo en `application/`; `last-known.server.ts`; `boxAround` en dominio | **Esta tanda** |
| P2 | CSP sin `unsafe-inline`, BFF de APIs, Umbrel | Abierto |
| P3 a11y | Captcha no visual, aria-live/invalid, globo/velas con teclado, alt eventos | Abierto. `prefers-reduced-motion` globo/mapa **hecho** |
| Operador | Lightning, SMTP fuera de EE.UU., Telegram 403/429, backup SQLite semanal, HSTS preload | Abierto |

**No reabrir:** sslip.io como canónica (el `.org` ya manda). Nginx. CMP de ads. Connect-wallet. Turnstile.

---


---

## 1. Cómo está armado hoy

| Pieza | Hecho |
|---|---|
| Host | VPS Ubuntu 24.04, Caddy → `127.0.0.1:8080`. **Público HTTPS:** `https://45.158.116.49.sslip.io`. SSH: `bitacora@45.158.116.49` (root SSH **cerrado**). BNS `bitácora.btc` redirige `bitacora.btc.us` → sslip.io |
| Runtime | Nitro `node-server`, **un** proceso Node |
| RAM | VPS chico; swap 2 GB a veces **no se puede** (`swapon: Operation not permitted`) |
| systemd | `Restart=always`, `MemoryMax=700M` (unit `bitacora.service`) |
| Datos | SQLite `data/bitacora.sqlite`; CSV de respaldo en `public/data/` |
| Front pesado | `react-globe.gl` / Three (~4,3 MB en el output SSR) |

---

## 2. Prioridades

### P0 — el visitante no ve lo que el repo ya tiene

| Deuda | Efecto | Cómo se ve |
|---|---|---|
| Producción ≠ `main` | El VPS sirve un build anterior | **Cerrado (31 ago 2026 21:54 UTC):** ZIP + bootstrap. Verificado: `hashClientIp` ×2, CSP en Caddy (534), `p1-harden.sh` + `backup-sqlite.sh`. El `git log` decía `b0381a9` porque el ZIP no trae `.git` (bootstrap ahora lo borra). |
| Sin tope de RAM | Un globo + dump de BTC Map → OOM | Mitigado en unit (`MemoryMax=700M`) si el bootstrap corrió. |

**Cierre P0 restante:** Deploy de acá en más: ZIP (Code → Download ZIP → scp `/tmp/bitacora.btc-main.zip`) o token de solo lectura, nunca en el chat.

### 2.0 Seguridad del VPS — P0 cerrado (31 ago 2026)

Hecho en el server Njalla, no solo en el repo:

| Ítem | Estado | Cómo |
|---|---|---|
| HTTP en la IP (`:80` servía la app) | **Cerrado** | Caddy: `http://` → `https://45.158.116.49.sslip.io{uri}` permanent. Validate + `systemctl reload caddy`. |
| SSH como `root` | **Cerrado** | Usuario `bitacora` (uid 1000, sudo NOPASSWD, misma clave ed25519). `/etc/ssh/sshd_config.d/50-bitacora.conf`: `PermitRootLogin no`. Comprobado: `ssh root@…` → `Permission denied (publickey)`. |
| Entrada de admin | `ssh bitacora@45.158.116.49` | Adentro: `sudo …`. No reactivar root. |
| Scripts en repo | `deploy/p0-ssh-user.sh`, `deploy/p0-lock-root.sh`, `deploy/Caddyfile` | El VPS no los tenía (git sin auth); se aplicó el equivalente a mano. |
| PAT de GitHub pegado en el chat | **Cerrado (31 ago 2026):** revocado. |

**No hacer:** `Transfer Domain` en btc.us; `PermitRootLogin yes`; servir Node en `0.0.0.0`.

P1 de seguridad: fail2ban, unattended-upgrades, backup SQLite **en VPS**, CSP, hash IP, Caddy, `saveMapCsv` **cerrados**.

| Ítem | Estado |
|---|---|
| `cancelCommunityPin` sin token | **Cerrado en `main` (31 ago):** exige `token` CARGA |
| Tope global de pines | **Cerrado en `main`:** 30 altas/hora en todo el server + 8/IP + 80 pendientes |
| Copia SQLite **fuera** del VPS | **Primera copia (31 ago 2026 20:44):** `Documentos\bitacora-backups\bitacora-20260831-2140.sqlite.gz` (~1,5 KB). Repetir **semanal** con el mismo `scp`. El tamaño chico = el SQLite del VPS aún tiene poco; el backup está bien. |
| PAT GitHub pegado en el chat | **Cerrado (31 ago 2026):** revocado. Deploy: ZIP, nunca un token en el chat. |
| Firebase / better-auth en el bundle | **Cerrado (1 sep):** stub de Firebase sin claves; stub de Better Auth/PGLite si `VITE_AUTH_ENABLED=false`. |

El VPS no tiene aún el tope de pines ni el token de cancel: hace falta ZIP.

### P1 — arquitectura que no escala ni a un meetup grande

| Deuda | Dónde | Efecto |
|---|---|---|
| CSV como base de datos | `pins-io.ts`, `map-csv-io.ts` + `sqlite.ts` | **En curso (30 ago 2026):** SQLite WAL en `data/bitacora.sqlite` (node:sqlite). El CSV queda como copia de respaldo. Tope 80 pines pendientes. |
| BTC Map entero en RAM | `btc-map.ts`, TTL 6 h | **Mitigado (1 sep):** si el snap en `data/btcmap-*.json` tiene menos de 6 h, no se vuelve a bajar el dump. El cold start (snap viejo o ausente) sigue siendo el JSON entero. |
| Globo 3D en la primera visita | `world-globe.tsx` | Cliente ~1,9 MB gzip ~535 KB (lazy). **Nitro (31 ago):** stub 0,23 KB — salió el chunk de 4,3 MB del server. |
| **Dominio canónico** | BNS + btc.us + Caddy | Ver §2.1. Hoy el candado vive en sslip.io; la barra no queda en `bitacora.btc.us`. |
| Dependencias apagadas en el bundle | `firebase`, `better-auth`, PGLite | **Firebase + Better Auth/PGLite (1 sep 2026):** `VITE_AUTH_ENABLED=false` → stub en el build. Auth Grok sigue apagada. |

### 2.1 Dominio — aplazado a propósito (31 ago 2026)

**Decisión:** no comprar dominio clásico ahora. El sitio público con candado es **sslip.io**. El puente BNS queda como alias.

| Pieza | Estado |
|---|---|
| Nombre BNS | `bitácora.btc` — Active until 28-08-2031 (cuenta `SP2A10KV…`) |
| Panel btc.us | **Website Redirect** → `https://45.158.116.49.sslip.io` (no hay registro A) |
| Puente ASCII | `https://bitacora.btc.us` → 302 al sslip |
| Puente con tilde | `bitácora.btc.us` — NXDOMAIN (el puente no IDN-iza la á) |
| Caddy / Let's Encrypt | `45.158.116.49.sslip.io` (HTTPS). Catch-all HTTP redirige a ese host. |
| IP cruda HTTP | `http://45.158.116.49` → 301/308 a sslip HTTPS (P0, 31 ago 2026) |
| SSH | Solo `bitacora`; root denegado |

**Efecto:** la URL de compartir memorable es `bitacora.btc.us`; tras el salto la barra muestra sslip.io. SEO/AEO no consolidan una canónica. Sitemap y `robots.txt` no deben promover la á.

**Cierre (cuando se retome):** dominio ASCII en Njalla (`.org` / `.nl`) → registro A a `45.158.116.49` → site extra en Caddyfile → canónica única. No usar Transfer Domain del BNS para esto.

### P2 — se nota bajo carga, no en el día a día

| Deuda | Dónde | Efecto |
|---|---|---|
| Desk con `staleTime: 0` en precio | `desk.tsx` | **Cerrado en `main`:** market 8s, extras 20s, tick 1.5s, onchain 5s; sin refetch al foco. |
| Rate-limit en un `Map` | `rate-limit.ts` | **Mitigado (1 sep):** cada hit también va a SQLite `rate_hits`. Reinicio ya no borra el tope de la hora. |
| Scraper de pines en el request | `pin-verify.ts` + Jina | **Mitigado (1 sep):** GET de mapa/pines **encola** (1 job, tope 12). El botón “ya cargué” sigue scrapeando en el click. |
| Pins: 8/hora/IP + **30/h global** | `submitCommunityPin` | **Cerrado en `main` (31 ago).** Tablero sigue en 48. |

### P3 — higiene

- Healthcheck HTTP `GET /healthz` (`server/routes/healthz.get.ts`).
- Sin cola de scrapes ni de mails.
- Tests: pines CSV (`src/domain/community-pins.test.ts`) + guardas de mapa/rate-limit (`scripts/bitacora-guards.test.mjs`). Falta cobertura de feeds y de `applyPublicMapPatch` ejecutada.
- `i18n.ts` monolito (415 claves × 3): funciona, es difícil de revisar.
- Cancelar pin: ahora exige el código CARGA (ya no está en la UI).

**No es deuda:** paridad ES/EN/PT, captcha, POC semanal fijo al zoom, OSM con fallback Esri, **P0 SSH/HTTP** (31 ago 2026), Caddy+HTTPS en sslip.io.

---

## 3. Pines — límites reales

Código: `src/infrastructure/server-fns.ts`, `src/domain/community-pins.ts`.

| Límite | Número | Origen |
|---|---|---|
| En el tablero | **48** | `slice(0, 48)` |
| Vivos + pendientes | 7 días | `PIN_TTL_MS` |
| Altas por IP | **8 / hora** | `tooMany(..., 8, 1 h)` |
| Historial en CSV | ~40 semanas | `40 * PIN_TTL` |
| Redes por pin | 6 URLs | `links.slice(0, 6)` |
| Código | `CARGA-XXXXXX` | se aceptan `BIT-` viejos |

| Carga | Qué pasa |
|---|---|
| 20–40 pines vivos (meetup Latam) | Cómodo |
| ~100–200 filas en el CSV | Aguanta, no se nota |
| \> ~500 filas | Cada GET pega a GitHub + parsea todo |
| Carrera de dos `savePins` | Se puede perder el último pin (sin lock) |

Un anuncio **no se verifica** con Instagram solo (login wall). X, Nostr, lnk.bio o web sí.

---

## 4. Flujo que aguanta sin colapsar

Asume 1 GB RAM efectivo, un Node, globo opt-in a medias.

| Cosa | Cómodo | Se siente lento | Colapso |
|---|---|---|---|
| Visitantes a la vez (texto + mapa 2D) | 30–80 | ~150 | RAM + dump BTC Map + 3 globos |
| Primera carga **con globo 3D** | 5–15 | ~25 | Varios WebGL + JSON de países |
| Hits/min estáticos (Caddy) | cientos | miles | Caddy sigue; Node no |
| BTC Map cold start | 1 | 1 | El JSON entero; el resto espera |
| Eventos | cache 5 min | — | Timeout de Luma, no el VPS |
| Contacto | 5 mails/h por dirección | — | Tope FormSubmit |
| Meetup 40 celulares, mapa 2D + 1 anuncio | Bien | — | — |
| Taller 200 abriendo el globo a la vez | — | — | Node se traba o reinicia |
| Campaña ~1.000 visitas/h a Mercado | Caddy sí | `staleTime: 0` se nota | — |

**Regla:** el sitio aguanta un meetup. No aguanta “btcmap.org con globo” en este VPS.

---

## 5. Orden de cierre (sin inflar el producto)

1. Desplegar `main` en el VPS (P0).  
2. `MemoryMax` + `Restart=always` en systemd.  
3. `loadPins` / `loadMapCsv` leen **disco**; sync a GitHub cada N minutos, no en cada GET.  
4. Lock de archivo al guardar CSV (o SQLite de un archivo en el mismo disco).  
5. Tope global de pines pendientes (p. ej. 80), además de 8/IP.  
6. Sacar Firebase / Better Auth / PGLite del build de producción.  
7. Globo solo después de “Entrar al mapa” / “Sumate aquí” (no montar Three al pintar la sección).  
8. `GET /healthz` → Caddy o un cron de Njalla.

SQLite en el VPS alcanza para miles de pines. Postgres no hace falta hasta haber un nodo Umbrel + más de un proceso.

---

## 6. Relación con el roadmap

Las verificaciones de Q1 que ya corren en el VPS (globo local, teselas OSM, pines CARGA, acuse de contacto, captcha) **salieron del roadmap visual**. Q1 abierto: Umbrel en Colonia. Seguridad P0/P1 de VPS **cerrada** (SSH, fail2ban, HTTPS nip.io, backup SQLite, CSP). Pendiente de producto: P1.7 Better Auth/PGLite, P1.8 BTC Map en RAM, P1.5 backup semanal fuera del VPS.

Este documento describe el estado al **30/08/2026**. Actualizarlo en cada deploy que cierre una fila P0/P1.
