# Refutación — informe de caja gris 11 set 2026

**Objeto:** bitacorabtc.org  
**Informe:** crítica constructiva de superficie pública, 11 set 2026 (no pentest, no auditoría de fuente).  
**Cotejo:** repo público [`prezpablo/bitacora.btc`](https://github.com/prezpablo/bitacora.btc) + origen `https://bitacorabtc.org` el mismo día.  
**Deuda vigente:** [`DEUDA-TECNICA.md`](DEUDA-TECNICA.md).

El informe acierta en producto (pines, teselas corporativas, cifras Latam vs mundial, PWA `/__grok/`). **Esta nota solo refuta lo que es falso o mal medido.** Lo válido ya está en la cola del 16 set.

---

## 1. «El código no es público»

**Falso.** El overlay Latam está en GitHub, rama `main`, sin repo privado:

https://github.com/prezpablo/bitacora.btc

El User-Agent del scraper CARGA apunta a ese URL (`src/infrastructure/safe-fetch.ts`).  
Lo que falta es un archivo `LICENSE` (MIT o AGPL) — P3, no «directorio con dueño».

BTC Map es FOSS; Bitácora también lo es. El informe miró el CSV y concluyó opacidad.

---

## 2. «Sin healthcheck (`/health` 404)»

**Midió el path incorrecto.** Canónico:

```
GET https://bitacorabtc.org/healthz  →  200  {"ok":true}
```

Smoke P0-13. Un 404 en `/health` no es «operar un VPS a ciegas».

---

## 3. «`map.csv` publica tokens CARGA»

**El esquema tiene la columna; el estático no tiene secretos.**

- Header: `…,token,verifiedAt`
- Cuerpo 11 set: `token` vacío en las 2 filas. No hay `CARGA-` ni `BIT-` en el CSV público.
- Guardia: `stringifyMapCsvPublic` + test `privacy-a11y-guards` (`doesNotMatch /CARGA-|BIT-/`).

Publicar la columna vacía es trazabilidad (el overlay no esconde el campo). Un token de verificación **nunca** se serializa al estático.

---

## 4. «Overlay de 2 filas = el mapa no existe / infla 27 k»

**Confunde dataset propio con federación.** Diseño declarado:

| Capa | Qué | Dónde |
|---|---|---|
| Federación | ~27 k comercios BTC Map | `public/data/btcmap-shops.json` + SQLite + `api.btcmap.org` (caché 6 h) |
| Overlay | Consciencia Bitcoin + altas CARGA | `map.csv` (sí: 2 filas hoy) |

Los 27 k **están**. El bug real es otro: `LIMIT 800` sin orden + bbox inicial en Montevideo (D-PIN). No es que el dump no exista.

Presentar totales mundiales bajo el título «Latam» **sí** es un error de copy (D-STATS). Eso no convierte la federación en mentira.

---

## 5. «Sin snapshot si BTC Map cae»

**Falso.** Hay snapshot first-party:

- `/data/btcmap-shops.json` (~2,8 MB, 200)
- `/data/btcmap-comms.json` (200)
- Catálogo SQLite en `data/` del VPS (`rsync --exclude data` **conserva** el catálogo en cada ZIP)

El informe pidió exactamente lo que ya corre: stale-while-revalidate local.

---

## 6. «i18n SSR roto / `html lang` fijo en es»

**Cerrado en origen.** `/?lang=pt` 11 set:

- `<html lang="pt">`
- H1: `Boas-vindas à Bitácora.btc` (no el castellano)

`/?lang=en` → Welcome. `/legal?lang=pt` → Privacidade.  
Queda **por verificar** un #418 si el visitante tiene `localStorage` en `en` y entra a `/` sin query (D-418). Eso no es «i18n solo cliente».

Legal ES/PT/EN está **escrito** en `src/domain/legal-eu.ts`, no pasa por traductor genérico. El riesgo jurídico de “API de traducción” no aplica al clausulado.

---

## 7. «`POST /_serverFn` Forbidden = backend opaco / inseguro»

**Es el contrato de TanStack Start.** Sin el envelope firmado de la sesión del framework la función **debe** responder Forbidden. El informe lo registra como hallazgo positivo en §5.1 y lo reinterpreta como problema en §5.2. No hay API REST pública **a propósito** (superficie: sin cuentas, sin custodia). Una API v1 tiene sentido **después** de D-PIN y de un overlay con más de 2 filas, no como P0.

`/api` 404 + `Disallow: /api/` es coherente con «no hay REST».

---

## 8. «Sin `/healthz`, sin robots, www caído, cert sin www»

| Afirmación | Origen 11 set |
|---|---|
| www inaccesible | `https://www.bitacorabtc.org/` **200** (Caddy redirige o sirve el apex) |
| robots incompleto | `Allow:/` + sitemap + `Disallow: /__grok/` |
| SAN solo apex | El www responde; no es incidente |

---

## 9. «Geo-IP choca con “GPS, no IP”»

**El código ya cumple el copy.** GeoJS / ipwho.is **no** corren al pintar el mapa: solo con extras aceptados o con el botón de ubicar (`L0.5` / `geo.ts`). El informe cita el legal y no el gate.

---

## 10. «`/privacidad` y `/cookies` 404»

**Anclas, no rutas huérfanas.** Canónico: `/legal#privacidad` `/legal#cookies`. El banner de storage ya enlaza esas anclas. D-NAV rechazó rutas sueltas para no partir el clausulado.

---

## 11. «CARGA es un scraper SSRF abierto»

**Hay controles.** `safe-fetch.ts`:

- solo `https`
- denylist RFC1918, link-local, CGNAT, metadata, `bitacorabtc.org`, IP del VPS
- timeout
- tests: loopback y self-host rechazados

El informe describe el riesgo genérico de un scraper y no el código. Caducidad, HMAC y un hop están en deuda de endurecimiento, no es «sin denylist».

---

## 12. «Mercado vacío = el producto no puede mantener el terminal»

**El runner cloud no es el VPS.** Cadena de velas: Binance → Vision → OKX → Hyperliquid → last-known. 451 de Binance o timeout de mempool.space desde IP de datacenter = **DEGRADA del probe**, no CAÍDA. `/healthz` OK y el HTML del desk renderiza. Widgets vacíos en una sesión de caja gris no prueban que el origen esté mudo.

---

## 13. «Globo como puerta = el mapa no existe»

El globo es **relato** («ya no estás solo»). En 3G / Save-Data el default es Leaflet (`slowNet()`). «Entrar al mapa» no es el único camino. El mapa 2D existe en `/` y `/mapa`. Lo que falla es el recorte de pines (D-PIN), no la ausencia de Leaflet.

---

## 14. «FormSubmit+Gmail contradice el legal / habeas data muerto»

`/legal` **nombra** FormSubmit y Gmail. La casilla de privacidad es obligatoria. El canal ARCO es el formulario + `/legal#contacto`. SMTP propio está en **Ops**, no es una omisión de transparencia. No hay pixel, no hay cuenta, no hay wallet: la superficie de datos es la que el legal describe.

---

## Qué **sí** queda (para no parecer que se desestima el informe)

Estos puntos del informe coinciden con la deuda y se implementan **desde el 16 set**, un ZIP cada vez:

1. D-PIN — bbox real + Supercluster (los 27 k no caben en `LIMIT 800`).
2. D-STATS — Latam vs mundial.
3. D-CTA — Sumate ≠ donar.
4. D-TILE-03 — salir de Esri (OpenFreeMap).
5. P3 — `/__grok/` → PWA propio, `LICENSE`, `img-src` allowlist, skip 404.

Nada de eso invalida no-custodia, no-KYC, CARGA, legal 18.331, Njalla, Caddy ni la federación con BTC Map.

---

*Refutación de observaciones, no de la intención del informe. El tono constructivo se agradece; las P0 inventadas no deben entrar al backlog.*
