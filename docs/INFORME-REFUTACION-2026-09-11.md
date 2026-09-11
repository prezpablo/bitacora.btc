# Recalibración acordada (11 set, tarde)

El autor del informe retiró los P0 de infra mal medidos. Bitácora acepta el resto **sin inflar severidad**.

| Ítem original | Estado acordado |
|---|---|
| Código no público | **Parcial.** Push autenticado ≠ clone anónimo. `github.com/prezpablo/bitacora.btc` responde **404 sin sesión**. LABIF ya decía «privado, 25 ago». Falta visibilidad pública + `LICENSE`. |
| Sin healthcheck | **Retirado.** `/healthz`. |
| CSV tokens | **Retirado como incidente.** Vigilar que la columna no se llene. |
| Overlay 2 filas = mapa inflado | **Retirado como mentira.** Queda D-STATS + D-PIN. |
| Sin snapshot | **Retirado.** |
| i18n / lang fijo | **Retirado para `?lang=`.** Queda D-418. |
| Legal por API | **Retirado** para el clausulado. |
| ServerFn opaco | **Retirado como P0 seguridad.** API v1 no es P0. |
| www / robots / SAN | **Retirado.** |
| Geo-IP vs GPS | **Retirado** condicionado al gate. |
| `/privacidad` 404 | **Retirado.** |
| CARGA SSRF abierto | **Retirado como P0.** Queda endurecimiento. |
| Mercado vacío = origen caído | **Retirado como down.** Queda UX del desk. |
| Globo = no hay mapa | **Retirado.** Queda juicio de producto: globo-first en desktop. |
| FormSubmit vs legal | **Retirado como ocultamiento.** |

**No vuelve como P0:** REST v1 antes de D-PIN; Forbidden como CVE; `/health` extra; columna `token` vacía como fuga; Esri/`/__grok/`/cifras mundiales como si negaran la federación.

**Sí queda (severidad justa):**

1. **D-FOSS** — visibilidad real. Hasta `git clone` anónimo 200, «también es FOSS» no es oponible a BTC Map. Ops: GitHub → Change repository visibility → Public. Luego `LICENSE` + link en `/legal` y 404.
2. **D-418** — `/` sin query + preferencia `en`.
3. **D-MKT** — desk que degrada en silencio (UX, no down).
4. **Globo-first desktop** — relato vs primera impresión. No P0; no se mata el globo.
5. P3 ya listado (PWA, img-src, LICENSE junto a D-FOSS).

Cuando el árbol liste anónimo, esta nota baja a `safe-fetch`, guards y LICENSE línea a línea. Hasta entonces la superficie oponible es: sitio + CSV + snapshots + `/healthz` + `/legal`.

---

# Refutación original (sigue valiendo para lo retirado)

**Objeto:** bitacorabtc.org  
**Informe:** crítica constructiva de superficie pública, 11 set 2026 (no pentest).  
**Cotejo:** origen `https://bitacorabtc.org` el mismo día. Repo **privado** (404 anónimo).  
**Deuda:** [`DEUDA-TECNICA.md`](DEUDA-TECNICA.md).

---

## 1. «El código no es público» — **parcial, no retirado**

Existe para quien tiene sesión GitHub (`git push` a `prezpablo/bitacora.btc` funciona). **No es recuperable anónimo:** HTML y raw.githubusercontent 404.

Eso no es «no hay código». Tampoco es FLOSS oponible. D-FOSS: hacer público el repo + `LICENSE` + enlace en legal/404. Hasta el 200 anónimo, el cotejo no puede bajar a línea a línea.

El User-Agent del scraper ya apunta a ese URL (`safe-fetch.ts`). LABIF línea 82 todavía dice «privado».

---

## 2. «Sin healthcheck (`/health` 404)» — **retirado**

```
GET https://bitacorabtc.org/healthz  →  200  {"ok":true}
```

---

## 3. «`map.csv` publica tokens CARGA» — **retirado como incidente**

Columna vacía + `stringifyMapCsvPublic` + test. Vigilar que no se llene.

---

## 4. Overlay vs 27 k — **retirado como mentira de datos**

Federación ≠ overlay. Queda D-STATS (copy) y D-PIN (`LIMIT 800` + bbox MVD).

---

## 5–14. Resto retirado

Snapshot first-party, i18n `?lang=`, legal escrito, server-fn Forbidden, www/robots, Geo-IP con gate, `/legal#privacidad`, CARGA con denylist, Mercado ≠ CAÍDA, Leaflet existe, FormSubmit declarado. Ver tabla de recalibración.

---

*La caja gris midió mal paths y confundió federación con overlay. El árbol no listable en GitHub **sí** deja abierto el punto FLOSS, con severidad de visibilidad, no de incidente de seguridad.*
