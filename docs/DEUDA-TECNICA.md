# Deuda técnica vigente — Bitácora.btc

**Fecha:** 31 de agosto de 2026  
**Alcance:** código en `main` + VPS Njalla (`45.158.116.49`, Caddy + Node un proceso).  
**No es** un load test de laboratorio: es el techo **antes de que se note**, leído del código y del servidor.

Marca: Consciencia Bitcoin. Producto: desk público (mapa, pines, pulso, mercado). Persistencia: SQLite (`data/bitacora.sqlite`) + CSV de respaldo. Sin cuentas.

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

**Cierre P0 restante:** PAT de GitHub a revocar a mano. Deploy de acá en más: ZIP (Code → Download ZIP → scp `/tmp/bitacora.btc-main.zip`) o token de solo lectura, nunca en el chat.

### 2.0 Seguridad del VPS — P0 cerrado (31 ago 2026)

Hecho en el server Njalla, no solo en el repo:

| Ítem | Estado | Cómo |
|---|---|---|
| HTTP en la IP (`:80` servía la app) | **Cerrado** | Caddy: `http://` → `https://45.158.116.49.sslip.io{uri}` permanent. Validate + `systemctl reload caddy`. |
| SSH como `root` | **Cerrado** | Usuario `bitacora` (uid 1000, sudo NOPASSWD, misma clave ed25519). `/etc/ssh/sshd_config.d/50-bitacora.conf`: `PermitRootLogin no`. Comprobado: `ssh root@…` → `Permission denied (publickey)`. |
| Entrada de admin | `ssh bitacora@45.158.116.49` | Adentro: `sudo …`. No reactivar root. |
| Scripts en repo | `deploy/p0-ssh-user.sh`, `deploy/p0-lock-root.sh`, `deploy/Caddyfile` | El VPS no los tenía (git sin auth); se aplicó el equivalente a mano. |
| PAT de GitHub pegado en el chat | **Pendiente (humano)** | Revocar en github.com/settings/tokens. No volver a pegar secretos. Deploy: ZIP o PAT nuevo de **solo lectura**, solo en SSH. |

**No hacer:** `Transfer Domain` en btc.us; `PermitRootLogin yes`; servir Node en `0.0.0.0`.

P1 de seguridad: fail2ban, unattended-upgrades, backup SQLite VPS, CSP Caddy **cerrados**. Hash de IP en rate-limit **en `main` (31 ago 2026)** — no aplica en el VPS hasta el próximo deploy. Sigue: copia fuera del VPS, `saveMapCsv` público (merge + tope 8 altas; aún POST abierto).

### P1 — arquitectura que no escala ni a un meetup grande

| Deuda | Dónde | Efecto |
|---|---|---|
| CSV como base de datos | `pins-io.ts`, `map-csv-io.ts` + `sqlite.ts` | **En curso (30 ago 2026):** SQLite WAL en `data/bitacora.sqlite` (node:sqlite). El CSV queda como copia de respaldo. Tope 80 pines pendientes. |
| BTC Map entero en RAM | `btc-map.ts`, TTL 6 h | `GET /v2/elements` (decenas de miles de puntos). El primer hit es el más caro. |
| Globo 3D en la primera visita | `world-globe.tsx` | Varios móviles a la vez pegan más que todo Mercado. |
| **Dominio canónico** | BNS + btc.us + Caddy | Ver §2.1. Hoy el candado vive en sslip.io; la barra no queda en `bitacora.btc.us`. |
| Dependencias apagadas en el bundle | `firebase`, `better-auth`, PGLite | Peso, superficie, no aportan (`VITE_AUTH_ENABLED=false`). |

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
| Desk con `staleTime: 0` en precio | `desk.tsx` | Cada foco de pestaña vuelve a Binance/OKX/mempool. |
| Rate-limit en un `Map` | `rate-limit.ts` | Reinicio = cero. IPs distintas = el Map crece sin techo. |
| Scraper de pines en el request | `pin-verify.ts` + Jina | Verificar varios pines juntos bloquea el event loop. |
| Pins: 8/hora/IP, **sin tope global** | `submitCommunityPin` | 50 IPs = 400 altas/h al CSV. El tablero igual muestra 48. |

### P3 — higiene

- Sin healthcheck HTTP (`/healthz`).
- Sin cola de scrapes ni de mails.
- Casi sin tests de pines, CSV ni fallback de feeds.
- `i18n.ts` monolito (415 claves × 3): funciona, es difícil de revisar.
- Cancelar pin sigue en el server y ya no está en la UI.

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

Las verificaciones de Q1 en el Roadmap Web3 **no están cumplidas** mientras el VPS no sirva `main` (globo local, teselas OSM, pines CARGA, acuse de contacto).

Este documento describe el estado al **30/08/2026**. Actualizarlo en cada deploy que cierre una fila P0/P1.
