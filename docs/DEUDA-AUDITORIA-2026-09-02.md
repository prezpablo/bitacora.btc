# Auditoría 2 sep 2026 — cotejo con el código

**Origen:** [auditoria-bitacorabtc-2026-09-02.md](../attachments/auditoria-bitacorabtc-2026-09-02.md) (caja negra, sin repo).  
**Cotejado:** `main` del 2 sep 2026, después de P0 legal/mapa.  
**Esto no es dictamen jurídico.**

La auditoría describe el sitio **antes** de `/legal`, de la Ley 18.331 en el clausulado, del skip-link declarado y del CSV sin tokens. Varios P0 ya no aplican tal cual. Abajo: qué era cierto, qué se cierra ahora, qué queda fuera del repo.

---

## 0. La auditoría se equivoca (ya estaba en el código)

| Hallazgo | Realidad |
|---|---|
| §1.6 solo hashes, sin URL de privacidad | `/legal`, `/mapa`, `/labif`. Home no embebe el clausulado. |
| §3.0 «no hay skip-link» | Skip-link primero al tabular. El texto legal **ya no** lo niega. |
| §5.0 omite Ley 18.331 | Lead y bloques de `legal-eu.ts` parten de 18.331 + URCDP. RGPD solo si EEE. |
| §2.7 CSP / HSTS «sin datos» | Caddy: HSTS, CSP, nosniff, Referrer-Policy, Permissions-Policy. |
| §2.1 SSRF total | `safe-fetch.ts`: no loopback, no link-local, no el VPS, DNS antes de conectar, redirects revalidados. Faltaba **https-only** (se cierra ahora). |
| §2.6 IP en claro | `hashClientIp` ya hashea. Ahora HMAC + pimienta de entorno. |
| §2.9 CSV con PII | No hay mails ni teléfonos. Tokens CARGA **fuera** del CSV público. |
| §1.7 sitemap / robots | Existen. Faltaba `security.txt` (ahora). |
| Captcha «solo 5 letras» | Hay proof-of-work (`minePow`) + honeypot. Sigue siendo visual (P3). |

**No copiar** el informe al pie de la letra: declara Firebase, CMP, cuentas y «interés público» que el producto no tiene.

---

## 1. Cerrado en esta tanda (repo)

| # auditoría | Qué |
|---|---|
| 4 / §5.3 | Cláusula art. 13 junto a la casilla (contacto, pines, mapa). |
| 9 / §1.2 §5.10 | Leyenda educativa en Mercado; «Serie modelo» ya no parece cotización en vivo. |
| 3 / §2.2 | `rel="noopener noreferrer"` en `_blank`. Logos: `logoUrl` sigue bloqueando `javascript:` / `data:` peligrosos. |
| 6 / §3.1 | Token de texto/botón `#9a5600` (~4,6:1). El ₿ de marca sigue `#f7931a`. |
| 1 / §2.1 | Scraper **solo https**, 2 redirects, 5 s, cuerpo ≤ 200 KB. |
| 19 / §5.11 | Bloque Términos: no PSAV (20.345), UY + tribunales, retiro, ODbL, estrella ≠ sello BCU. |
| 13 / §5.5 | Derechos: **5 días hábiles** (arts. 14–15). |
| 10 / §5.0 §5.1 §5.7 §5.9 | DPO con 19.670 (no art. 37 RGPD); personas jurídicas art. 2; menores sin importar el 16 europeo como regla uruguaya. |
| 16 / §3.4 | Pausa del carrusel Pulso (además de `prefers-reduced-motion`). |
| 17 / §3.6 | Honeypot fuera del árbol a11y. |
| 7 / §3.2 | Lista textual de comunidades/comercios bajo el mapa. |
| 2 / §2.3 | Texto junto al QR: no custodia; dirección on-chain cuando el operador la publique (no se inventa). |
| 15 / §2.6 | HMAC-SHA256; `BITACORA_IP_PEPPER` en el VPS. |
| P2 §1.7 | `/.well-known/security.txt`. Bytespider alineado en robots con Caddy. |

---

## 2. Sigue abierto (no se finge)

| # | Por qué no se cierra aquí |
|---|---|
| 5 URCDP | Trámite del operador. Guía: [`URCDP-INSCRIPCION.md`](URCDP-INSCRIPCION.md). |
| 8 ALTCHA/Turnstile | El PoW ya está; el código visual sigue. Turnstile contradice soberanía. Cola L2.1. |
| 2 BIP-322 + monitoreo QR | Hace falta la dirección y una clave. El operador publica el texto; no se fabrica un addr. |
| 11 Relé fuera de EE.UU. | FormSubmit→Gmail sigue; el art. 13 ahora lo dice. Migrar SMTP es operación. |
| 12 Runbook 24/72 h | Plantilla: [`INCIDENTES-URCDP.md`](INCIDENTES-URCDP.md). Ejecutarlo es del operador. |
| 14 CAA / DMARC / preload | DNS y correo. Caddy ya manda HSTS. |
| 18 Caché de 8 APIs caídas | **Hecho:** `withLastKnown` en extras, ETF, pulso, on-chain live y eventos. UI: «último dato». |
| CSP sin `unsafe-inline` | Leaflet e inline del mapa. Queda P2. |
| Proxy BFF de 15 APIs | P2 del plan híbrido. |

---

## 3. Operador (fuera de git)

1. Inscripción URCDP (nombre civil **solo** en la ficha).  
2. `BITACORA_IP_PEPPER` largo en el unit systemd.  
3. Publicar dirección `bitcoin:` / `lightning:` (y, si hay, nota BIP-322).  
4. SPF/DKIM/DMARC y CAA.  
5. SMTP propio o DPA con el relé.  
6. Runbook de incidentes impreso / ensayado.
