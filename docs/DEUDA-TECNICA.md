# Deuda técnica vigente — Bitácora.btc

**Fecha:** 5 de setiembre de 2026  
**Canónica:** `https://bitacorabtc.org` · VPS Njalla `45.158.116.49` (Caddy → Node :8080)  
**Repo:** `prezpablo/bitacora.btc` `main` (`9bb7e57`) · deploy = ZIP (el VPS no tiene `.git`)  
**Legal:** [`DEUDA-LEGAL.md`](DEUDA-LEGAL.md) · **Híbrido:** [`DEUDA-PLAN-HIBRIDO.md`](DEUDA-PLAN-HIBRIDO.md) · **Tests externos:** [`TEST-EXTERNO.md`](TEST-EXTERNO.md)

## Resumen (5 set)

Bitácora.btc es mapa + desk Bitcoin (Latam), educación y altas comunitarias con prueba pública `CARGA`. Stack: TanStack Start, Leaflet, SQLite, Caddy. Visitante sin cuenta.

**Estable en código:** mapa con overlay propio + BTC Map, Ir/OSRM con consentimiento, pines 7d, parches de ficha, tickets de disputa, Pulso traducido en servidor, eventos 3×3, lazy IO, fees multi-fuente, precio OKX si Binance 451.

**Hueco operativo:** el VPS a veces corre un build anterior al `main`. P1-03 (HTML `lang`) está hecho en repo y **sigue en español en producción**. El runner marca mempool/Binance desde *su* IP; eso no es CAÍDA del `.org`.

Internos: `npm run test:bitacora` (80). Externos: `npm run test:live`.

---

## Clean Architecture

| Capa | Qué | ¿Cumple? |
|---|---|---|
| `domain/` | CSV, guía, geo, legal, events, parches, fees | **Sí** |
| `application/` | mercado, locate, applyListingPatch | **Sí** |
| `infrastructure/` | OSRM, BTC Map, SQLite, server-fns, vision/OKX | **Sí** |
| `components/` | UI | **Parcial** — `spend-map.tsx` sigue gordo |

No reescribir el mapa ahora. Partir el alta (P2) cuando no haya ZIP pendiente.

---

## Deuda redefinida (5 set)

| Pri | Ítem | Estado | Nota |
|---|---|---|---|
| **P0** | ZIP VPS = `main` | **Abierto cada release** | P1-03 / P2-16 no se ven en `.org` hasta el ZIP de este main |
| **P0** | Sitio HTTPS / healthz / first-party 200 | **Cerrado** (30/08 404 cerrado) | Probe A1–A15 |
| **P1** | P1-03 `html lang` + title SSR | **Hecho en inyector** · **pendiente ZIP** | grok-pwa reescribe `lang`/`title`/`og:locale` según `?lang=` |
| **P1** | URCDP | Presentada 2 set | Revisión URCDP, no código |
| **P1** | Backup SQLite semanal fuera del VPS | Operador | `scp` a disco local |
| **P1** | Probe en el VPS (no en el runner) | **Nuevo** | `scripts/probe-live.mjs` · cron 08:20 |
| **P1** | Lazy viewport + mercado al #mercado | **Hecho** | `in-view` + `LazyMount` |
| **P2** | Lighthouse mobile 3G/4G en `.org` | Abierto | Meta Perf ≥ 80 4G / ≥ 50 3G |
| **P2** | Tiles 1× en 3G · cluster pines · fuente 400 | Abierto | UX, no bloquea |
| **P2** | Partir alta fuera de `spend-map` | Abierto | Clean Architecture |
| **P2** | PWA offline geo + catálogo | Abierto | No ahora |
| **P3** | LRM fuera del bundle · captcha no visual · táctiles 44px | Abierto | |
| **P3** | CSP sin unsafe-inline · Umbrel | Abierto | Plan híbrido |

**Alertas runner (no son CAÍDA):**

| Código | Qué hacer |
|---|---|
| D-MP-FEE / TIP | mempool.space mudo *en el runner*. Fees: ninja + emzy + blockstream + last-known. Avisar solo si el **probe VPS** también vacío 2–3 días. |
| D-BN | Binance 451. Vision + OKX cubren. Nunca “mercado caído”. |
| P1-03 | Hasta el ZIP, el HTML sigue `lang=es`. El inyector PWA reescribe `lang` + title al servir. |
| P2-16 | `extensions.js` se omite en `bitacorabtc.org` (CSP ya lo bloqueaba). Preview Grok lo conserva. |

**No reabrir:** sslip.io como canónica. Nginx. CMP ads. Connect-wallet. Turnstile. First-party 404 del 30/08.

---

## Tests

| Capa | Comando | Si falla |
|---|---|---|
| Dominio / guards | `npm run test:bitacora` | No mergear |
| Live `.org` | `npm run test:live` | Exit 1 = CAÍDA. `DEGRADA` = runner o SSR |
| Live estricto | `PROBE_STRICT=1 npm run test:live` | P1-03 cuenta como fallo |
| Manual mapa/desk | [`TEST-EXTERNO.md`](TEST-EXTERNO.md) § D | Checklist humano |

Lista completa de URLs y terceros: [`TEST-EXTERNO.md`](TEST-EXTERNO.md).

### IntersectionObserver

```
desk (mapa + conciencia)
  └ LazyMount → roadmap, pines, eventos, feed, pulso, historia, velas, contacto
#mercado ref=useInView("280px") → wantLive (market, extras, tick, onchain, etf, pulse)
```

Latch al intersectar. Hash `#mercado|#red|#pulso|#datos` salta el gate.

### Lighthouse (código, 5 set)

Sin CI. 3G: globo off (`map-gate`), heatmap off, afiches lazy, queries de mercado gated. Cierre: scores reales en DevTools sobre el `.org`.

---

## Estado por fase (histórico + vigente)

| Fase | Qué | Estado |
|---|---|---|
| P0 producto / VPS | `/legal`, 18.331, CSV sin tokens, skip-link, canónica `.org`, last-known | **Cerrado** |
| P0 deploy | ZIP a `/var/www/bitacora` | Procedimiento estable · **desfase frecuente** |
| P1 URCDP | Contacto y seguridad | Presentada 2 set |
| P1 DNS | SPF `-all`, DMARC `p=reject`, CAA | **Cerrado** |
| P1 pimienta IP | `/etc/bitacora.env` | **Cerrado en VPS** |
| P1 QR | on-chain + LN | Cerrado. BIP-322 pendiente |
| P1 i18n SSR | `?lang=` en HTML | Repo sí · **prod no** |
| P2 | CSP, BFF, Umbrel | Abierto |
| P3 a11y | Captcha no visual, globo teclado | Parcial (`prefers-reduced-motion` hecho) |
| Operador | LN inbound, SMTP no-US, backup semanal, HSTS preload | Abierto |

---

## Clean Architecture (detalle 4 set)

| Capa | Qué vive ahí | ¿Cumple? |
|---|---|---|
| `domain/` | Entidades, CSV, guía, geo-fix, calle, legal, event-board | **Sí.** No importa infra. |
| `application/` | Mercado, `locateOnConsent` | **Sí.** Puertos de mercado; geo fuse sin fetch. |
| `infrastructure/` | OSRM, BTC Map, SQLite, Photon, GPS, server-fns | **Sí.** Adapters. |
| `components/` | UI. `use-map-guide` orquesta Leaflet | **Parcial.** `spend-map.tsx` sigue siendo el formulario + pines. |

Regla de oro: el dominio no sabe de Leaflet ni de OSRM. La ruta y el GPS se piden **después** del clic (consentimiento).

### Qué se partió
- `use-map-guide.ts` — Ir, GPS, pasos, Cancelar
- `leaflet-fix.ts` — círculo ⊙
- `domain/street-addr.ts` — validar calle
- `hydrateMapCsv` — CSV → store
- `MIN_STREET_ACCURACY_M = 150`
- `domain/event-board.ts` — página 9, `?ep=`
- `lib/in-view.ts` + `LazyMount`

### Qué queda gordo (no reescribir ahora)
- `spend-map.tsx` (~1.3k)
- `extra-feeds.ts`, `btc-map.ts`, `i18n.ts`
- `leaflet-routing-machine` en package.json, casi sin uso

---

## Estado 2 set 2026 (fases, archivo)

Lo de abajo es el informe largo de agosto/2 set. La tabla **Deuda redefinida** de arriba manda. Canónica vigente = **bitacorabtc.org** (no sslip.io).
