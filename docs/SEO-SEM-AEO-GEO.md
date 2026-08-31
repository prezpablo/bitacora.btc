# SEO · SEM · CTR · AEO · GEO — Bitácora.btc

**Fecha:** 30 ago 2026  
**Objetivo:** figurar en búsquedas de la comunidad bitcoiner (Latam, ES/PT/EN), no en “comprar crypto”.  
**Estado de indexación:** el sitio **vive** en `https://45.158.116.49.sslip.io`. `bitácora.btc.us` (con á) da NXDOMAIN. `http://bitacora.btc.us` redirige. Sin URL canónica estable, Google y los motores de respuesta no consolidan autoridad.

---

## 1. Diagnóstico (hoy)

| Capa | Qué hay | Hueco |
|---|---|---|
| Title / description | Listos en ES/PT/EN (`src/lib/seo.ts`) | Canonical apunta a un host que **no resuelve** |
| JSON-LD | Organization, WebSite, FAQPage, Place (Colonia) | Se inyecta **en el cliente**. Un bot sin JS no lo ve |
| `robots.txt` | Permite Google, GPTBot, Perplexity, Claude | Sitemap con `https://bitácora.btc.us` (roto) |
| `sitemap.xml` | 1 URL, 3 idiomas | Sin `/mapa`, sin ciudades, sin historia |
| OG / Twitter | `og.jpg`, naranja Bitcoin | Hay que verificar que el archivo exista en producción |
| Contenido | Texto real (Consciencia, FAQ, historia, mapa) | Una sola página con hashes (`#mapa`). Los hashes **no se indexan** como URLs |
| Velocidad | Globo 3D ~2 MB JS | Core Web Vitals flojos en 3G; Google lo usa como ranking |

Competencia directa en “mapa bitcoin”: [btcmap.org](https://btcmap.org) (global, OSM, años de enlaces). Bitácora no gana esa query genérica. Gana **Latam + ciudad + comunidad + sin custodia**.

---

## 2. Dónde busca un bitcoiner (no es solo Google)

Orden real de descubrimiento en esta tribu:

1. **X / Nostr / Telegram / Stacker News** — recomendación de pares  
2. **Grok, Perplexity, ChatGPT** — “dónde hay meetup bitcoin en Uruguay”  
3. **Google** — “comercios bitcoin colonia”, “comunidad bitcoin montevideo”  
4. **Google Ads** — cara, KYC, poco bitcoiner  

Si solo se trabaja SEO clásico, se llega tarde. AEO + GEO + el mapa social pesan más que un anuncio.

---

## 3. SEO (buscadores clásicos)

### Queries a atacar (intención local / educativa)

**ES (Uruguay + Latam)**  
- `comunidad bitcoin uruguay`  
- `comercios que aceptan bitcoin colonia` / `montevideo`  
- `meetup bitcoin uruguay`  
- `mapa bitcoin latinoamérica`  
- `dónde gastar bitcoin uruguay`  
- `nodo bitcoin colonia del sacramento`  
- `consciencia bitcoin` (marca)  
- `bitácora btc` (marca; hay que enseñarla)

**PT**  
- `comunidade bitcoin brasil` / `onde gastar bitcoin` / `mapa bitcoin latam`

**EN**  
- `bitcoin map latin america` / `bitcoin meetup uruguay` — cola larga, menos pelea que “bitcoin map”.

**No pelear:** `comprar bitcoin`, `exchange uruguay`, `precio btc`. Ahí ganan Binance y CoinMarketCap; además no es el arquetipo.

### Qué falta para rankear

1. **Un host canónico que resuelva** (ASCII `bitacora.btc.us` → sslip.io, o un `.org` / BNS sin á).  
2. **URLs reales**, no solo `#mapa`: `/mapa`, `/historia`, `/eventos`, `/contacto`. Google no trata el hash como página.  
3. **JSON-LD en el HTML del primer byte** (SSR), no solo `useEffect`.  
4. Sitemap con esas rutas + `lastmod`.  
5. Enlaces de entrada: bitcoin.org wiki no; sí **btcmap**, **LABITCONF**, **PizzaDAO**, grupos de Telegram, Nostr, Stacker News. Un enlace de btcmap.org o de un meetup vale más que 50 posts.  
6. Páginas de ciudad cuando haya ≥ 3 pines: “Bitcoin en Colonia del Sacramento”. Eso es SEO local de verdad.

### CTR (el clic en el resultado)

El title actual es largo y bueno. Para subir CTR:

| Ahora | Mejor snippet |
|---|---|
| Bitácora.btc \| Mapa de comunidades y comercios Bitcoin en Latinoamérica | Bitácora.btc — mapa Bitcoin Latam (comercios, nodos, meetups) |

Description: empezar con **verbo + lugar**.  
“Encontrá comunidades y comercios que aceptan Bitcoin en Uruguay y Latinoamérica. Sin cuentas, sin custodia.”

En SERP, el favicon naranja y el `og.jpg` importan. Comprobar que `/og.jpg` y `/favicon.svg` cargan en sslip.io.

CTR orgánico razonable al inicio: **2–5 %** en cola larga. Si el snippet dice “exchange” o “comprar”, el bitcoiner **no** entra.

---

## 4. SEM (pago)

**No conviene Google Ads** para este arquetipo: KYC del anunciante, puja de exchanges, y el visitante asocia anuncio con custodia.

Si hay sats para difusión:

| Canal | Por qué | CTR esperado |
|---|---|---|
| Stacker News (boost en sats) | La tribu ya está ahí | Alto en nicho, bajo volumen |
| X orgánico + community notes | Consciencia / LCM ya tienen voz | Depende del gancho |
| Nostr zaps | Soberano, lento | Nicho puro |
| Giftsats / meetups | Un QR en LABITCONF | El mejor “SEM” de Bitácora |

SEM clásico: **0 % del presupuesto** hasta tener URL estable e indexación. El “anuncio” es el pin en el mapa y el QR de contribuir.

---

## 5. AEO (Answer Engine Optimization)

Grok, Perplexity, ChatGPT y Google AI Overviews **citan páginas que responden en prosa**, con entidad clara y FAQ.

Bitácora ya tiene las 4 preguntas correctas en `FAQ`. Para que un modelo las elija:

1. La respuesta tiene que estar **en HTML visible**, no solo en JSON-LD (el bloque `#faq-seo` debe renderizar siempre, también sin JS).  
2. Frase exacta de marca: “Bitácora.btc es una bitácora comunitaria, no un exchange, sin custodia.” Eso es lo que pegan los modelos.  
3. Entidad: Consciencia Bitcoin, Colonia del Sacramento, LATAM Cripto Mom — **siempre juntos**.  
4. `llms.txt` en la raíz (corto: qué es, qué no es, URL del mapa, idiomas). Perplexity y algunos crawlers lo usan.  
5. Permitir bots (ya está en robots).  
6. Una URL por pregunta fuerte: `/faq` o anclas reales `/#que-es` indexables.

Preguntas que los motores van a recibir y **hoy no tenemos página propia**:

- “¿Dónde gastar bitcoin en Uruguay?”  
- “¿Hay meetups bitcoin en Colonia / Montevideo?”  
- “¿Bitácora es un wallet?” → FAQ ya lo cubre; hay que que el crawler lo lea en el primer HTML.

---

## 6. GEO — dos lecturas (las dos aplican)

### A. Generative Engine Optimization

Igual que AEO, pero para **citas** en respuestas largas: Wikipedia-style.

- Un párrafo “definición” de 40–60 palabras al tope de Consciencia Bitcoin (ya casi está).  
- Datos verificables: ciudad, año 2026, “sin custodia”, “mapa + historia + eventos”.  
- Evitar jerga de roadmap (Q1, Umbrel) en ese párrafo: el modelo copia el tono.  
- Menciones en fuentes que los LLMs ya tragan: Stacker News, Bitcoin Magazine (si sale una nota), LABITCONF, repos de GitHub públicos.

### B. SEO geográfico (local)

`geo.region: UY-CO` ya está. Falta:

- Google Business **no** (KYC, Maps). Un bitcoiner no busca “empresa”.  
- OSM + BTC Map: cada comercio de Bitácora que también esté en OSM refuerza “Colonia + bitcoin”.  
- Queries `bitcoin cerca de mí` las gana Google Maps / BTC Map. Bitácora gana `comunidad bitcoin colonia` y `consciencia bitcoin`.  
- Eventos con fecha + ciudad + país en HTML (ahora muchos vienen de Luma en JS).

---

## 7. Plan de 30 días (para empezar a figurar)

**Semana 1 — cimientos (sin esto no hay ranking)**  
1. Canónico ASCII: `https://bitacora.btc.us` → 302 a sslip.io, o A/AAAA cuando btc.us lo permita. Sacar la á del sitemap y de `robots.txt`.  
2. Search Console + Bing Webmaster en esa URL. Sitemap ping.  
3. Comprobar `/og.jpg`, `/favicon.svg`, `/sitemap.xml` en el host que sí abre.

**Semana 2 — AEO**  
4. FAQ y “qué es” en HTML SSR (visible sin ejecutar JS).  
5. `llms.txt` + párrafo entidad.  
6. Un post en Stacker News + hilo en X/Nostr con la URL **que resuelve**, no la de la á.

**Semana 3 — comunidad (el verdadero ranking bitcoiner)**  
7. Pedir mención a 5 nodos (Colonia, Montevideo, Buenos Aires, São Paulo, un meetup Luma).  
8. Enlace recíproco o “listed on Bitácora” en fichas de comunidad.  
9. PizzaDAO / Pizza Day ya linkeados en Historia: pedir el inverso.

**Semana 4 — páginas que Google pueda listar**  
10. Rutas `/mapa` `/historia` `/eventos` (aunque rendericen el mismo desk).  
11. Una landing “Bitcoin en Uruguay” (texto + 3 ciudades).  
12. Medir: impresiones Search Console, citas en Perplexity/Grok (“mapa bitcoin uruguay”).

KPI realistas a 90 días: **aparecer** en cola larga local (no top 3 de “mapa bitcoin”). Marca `consciencia bitcoin` y `bitácora.btc` en primera página si hay 8–10 enlaces de meetups.

---

## 8. Lo que no hacer

- Ads de Google sobre “bitcoin”.  
- Keyword stuffing de “crypto”, “nft”, “defi”.  
- Indexar `sslip.io` **y** `bitácora.btc.us` a la vez (contenido duplicado). Una canónica.  
- Pedir reviews de Google.  
- Esperar tráfico del globo 3D: es conversión, no SEO.

---

## 9. Relación con deuda técnica

Mientras el host público sea IDN roto, **SEO/AEO/GEO no arrancan**. Prioridad P0 de indexación = la misma P0 de DNS del informe de deuda.
