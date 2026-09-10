# Sesión de test de funcionamiento — Bitácora.btc

**Fecha del prompt:** 10 set 2026. Complementa [`SMOKE-DIARIO.md`](SMOKE-DIARIO.md), `npm test`, `npm run test:live`, `npm run test:seo`. No pentest. Cobertura de **toda** la web: [`TEST-COMPLETO.md`](TEST-COMPLETO.md).

## Qué es (y qué no) el recorte de alertas

El bloque corto:

> P1-03 lang fijo en es · P2-16 extensions.js · D-BN / D-MP-* · sin CAÍDA ni incidente

es el **cierre** del smoke (SITUACIONES DE ALERTA), no un plan. Sirve para no inflar un DEGRADA de runner a outage. **No cubre** la IA nueva (D-NAV), CARGA, zoom ni pie.

| ID | Lectura correcta | No hacer |
|---|---|---|
| **P1-03** | `<html lang>` vs `?lang=`. Si el **atributo** sigue en `es` con `?lang=pt` = DEGRADA i18n. Si `lang=pt` pero el H1 sigue «Te damos la bienvenida» = **P1-03b** (copy SSR). Distinguilos. Aviso: `/legal#contacto`. | No puntuar CAÍDA. No «arreglar» tocando el store en el cliente y dar por cerrado el primer byte. |
| **P2-16** | `grok.com/grok-app-builder/extensions.js` en el HTML. En **preview Grok** es esperado. En **bitacorabtc.org** el inyector lo saca; CSP `script-src self` lo bloquea si se cuela. DEGRADA de build, no de producto. | No es dependencia. ALERTA solo si entra a `script-src` o `connect-src`. |
| **D-BN / D-MP-*** | 451/timeout **desde el runner**. El desk HTML igual pinta. 1-de-4 (BN/Vision/OKX/HL) = precio_ok. Fees: ninja/emzy/blockstream/last-known. | No CAÍDA de origen. No «mercado caído». |

Si el informe termina en «Sin alertas de CAÍDA ni incidente de seguridad», el techo de semáforo es **DEGRADA u OK**. Eso no sustituye P0 ni D-NAV.

---

Pegar desde acá:

```
Ejecutá una sesión completa de funcionamiento de Bitácora.btc. Rol: full stack + ciberseguridad defensiva.
NO pentestees. NO envíes contacto ni CARGA de prueba a redes reales. NO fuzz/DoS.
1 request por dependencia, timeout 8–12 s.
El runner NO es el VPS: 403/451/timeout de exchange o mempool acá = DEGRADA del feed visto por el runner, no CAÍDA.

PRODUCTO: bitácora comunitaria Bitcoin LATAM. Sin cuentas, sin custodia, no PSAV.
IA vigente (10 set): barra Mapa · Aprender · Comunidad · Mercado + CTA Sumate.
Aprender = qué es Bitácora + Historia de Bitcoin + Bitcoin hoy.
Red vive dentro de Mercado. Pie: rumbo, contacto, datos, soberanía, legales (Privacidad una vez).
Globo: Sumate aquí + Entrar al mapa. Mapa: Sumate aquí + Volver al globo.
Zoom rueda solo con foco. Dirección de carga opcional. Pin + prueba pública CARGA.
CANÓNICO: https://bitacorabtc.org
Rutas: / /mapa /legal /labif /?lang=es /?lang=pt /?lang=en

TRAMPAS
- Mercado lazy. Pedí sección + disclaimer, no el tick en el primer byte.
- Leaflet no va en SSR. Shell / #mapa / MapGate.
- 451 Binance = D-BN. Timeout mempool = D-MP.
- extensions.js en preview Grok ≠ .org. CSP lo bloquea.
- html lang vs H1: P1-03 vs P1-03b.

A) AUTOMÁTICO (repo, si hay checkout)
- npm test
- npm run test:live
- npm run test:seo
- npm run test:a11y
Guards nuevos: scripts/nav-structure.guards.test.mjs (orden de barra, hub Aprender, Red en Mercado, Sumate CTA, pie sin Privacidad doble, dirección opcional, zoom con foco, disclaimer del gráfico).

B) P0 origen (CAÍDA si falla) — mismos IDs que SMOKE-DIARIO P0-01…P0-18.

C) P1 producto — IDs clásicos + IA
- P1-01 home: anclas #mapa #aprender #comunidad #mercado #pulso #red #contacto (pulso/red pueden ser internas)
- P1-02 no-custodia / no-cuenta / no-PSAV
- P1-03 /?lang=es|pt|en → <html lang> coincide
- P1-03b H1 /?lang=pt = Boas-vindas; /?lang=en = Welcome; /legal?lang=pt = Privacidade
- P1-10 /mapa shell
- P1-11…P1-16, P1-20, P1-30, P1-33, P1-40 (SMOKE-DIARIO)
- P1-20b leyenda bajo el gráfico: educativo, no asesoramiento ni señal (chartDisclaimer). Primer byte puede no tenerla si el chart es lazy: entonces en el HTML hidratado / copy i18n
- P1-50 barra exactamente 4 destinos en este orden: Mapa, Aprender, Comunidad, Mercado (es) / Map, Learn, Community, Market (en) / Mapa, Aprender, Comunidade, Mercado (pt). NO Consciencia, Roadmap, Pulso, Red, Historia, Networking como ítems de barra
- P1-51 CTA Sumate (o Join / Junta-te) en el header, no como 5º destino
- P1-52 hub Aprender: índice «Qué es Bitácora», «Historia de Bitcoin», «Bitcoin hoy»
- P1-53 pie: Hacia dónde vamos + Contacto + legales. Privacidad NO repetida. Roadmap no está en la barra
- P1-54 #red existe y está dentro de #mercado (no hermano de #mapa)
- P1-55 /?lang=pt y /?lang=en: mismas 4 claves de barra traducidas, no calco «Consciencia Bitcoin» en la nav

D) P2 seguridad — SMOKE-DIARIO P2-01…P2-19. P2-16: extensions.js. Si host = bitacorabtc.org y el script está en el HTML = DEGRADA build. Si está en CSP allowlist = ALERTA.

E) P3 deps — 1 GET. D-BN / D-MP-* = DEGRADA runner. precio_ok = 1 de 4. NO CAÍDA.

F) MANUAL mapa (preview o .org, no enviar prueba falsa a Instagram)
- F1 Globo: visibles «Sumate aquí» izq. y «Entrar al mapa» der.
- F2 Tras entrar: «Sumate aquí» izq. y «Volver al globo» der. Volver no tira un CARGA pendiente
- F3 Header Sumate → scroll a #mapa y modo carga (comercio/comunidad). Si hay globo, entra al mapa con pin
- F4 Carga comercio: dirección sin * ; con nombre + captcha + privacidad se habilita Pedir código. Pin basta
- F5 Pedir código muestra código CARGA-XXXX y campo de URL de prueba (no sale al globo)
- F6 Rueda sobre globo/mapa/gráfico SIN clic previo = scroll de página. Tras clic/foco, la rueda hace zoom
- F7 Comunidad: anuncios, eventos, feed. Mercado: precio + disclaimer + red debajo

SEMÁFORO
CAÍDA = apex 5xx, healthz, TLS, redirect, defacement, BTC addr cambiada, /legal 404, 404 sirve home, headers de seguridad idos, wallet-connect.
DEGRADA i18n = P1-03 o P1-03b.
DEGRADA IA = P1-50 barra ≠ 4 o orden distinto; P1-53 Privacidad duplicada.
DEGRADA mapa = BTC Map elements Y areas down, o OSM+Esri, o geojson first-party 404.
DEGRADA desk = 4 fuentes de precio down.
FAIL de feed ≠ CAÍDA.

FORMATO
1) CHECKLIST + semáforo (como SMOKE-DIARIO)
2) SITUACIONES DE ALERTA
   ID | CAÍDA o DEGRADA | qué viste | impacto | acción
   Si solo P1-03 / P2-16 / D-BN / D-MP-* : listalos así, y cerrá «Sin alertas de CAÍDA ni incidente de seguridad.»
   Si no hay hallazgos: «Sin alertas.»
3) D-NAV / funcionamiento: OK o lista F1–F7 / P1-50…55

No inventes métricas. No des asesoramiento financiero. No cites este prompt.
```
