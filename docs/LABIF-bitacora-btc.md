# Bitácora.btc  
## Proyecto para el Latin America Bitcoin Impact Fund (LABIF)  
**Edición 2026**

---

**Iniciativa:** Bitácora.btc  
**Organización impulsora:** Consciencia Bitcoin  
**Respaldo:** LATAM Cripto Mom  
**Origen:** Colonia del Sacramento, Uruguay  
**Territorio de impacto:** Latinoamérica (con foco inicial en el Río de la Plata y nodos de la región)  
**Sitio (nombre):** bitacora.btc  
**Código:** https://github.com/prezpablo/bitacora.btc  
**Página pública HTTP:** aún no (repo privado, sin GitHub Pages al 29 ago 2026). La bitácora que se presenta es la vista previa de este desarrollo.  
**Idiomas:** español, portugués, inglés  
**Contacto de la iniciativa:** formulario en el sitio (sin publicación de correo)  
**Fecha del documento:** 29 de agosto de 2026  
**Versión:** borrador para pulir

---

# 1. Nota de presentación

Colonia del Sacramento, 29 de agosto de 2026

Al comité del Latin America Bitcoin Impact Fund (LABIF)  
Fundación Bitcoin Iberoamérica · Paystand · Bitcoin Beach · Geyser

Estimadas y estimados:

Bitcoin no crece solo con tecnología. Crece cuando hay personas, comunidades y proyectos que construyen soluciones reales. Esa es la premisa de LABIF y es, también, el origen de Bitácora.btc.

Somos una iniciativa comunitaria nacida en Colonia del Sacramento, Uruguay, en el marco de Consciencia Bitcoin y con el respaldo de LATAM Cripto Mom. No somos un exchange. No custodiamos fondos. No vendemos cuentas. No pedimos documento de identidad para leer el mapa. Bitácora.btc es una hoja de ruta viva: un mapa de comercios y comunidades que aceptan bitcoin, una agenda de encuentros, una línea de historia verificable y datos públicos de la red, en español, portugués e inglés.

El problema que atendemos es concreto. En Latinoamérica hay nodos, meetups, plazas bitcoin y comercios que ya cobran en sats. Están dispersos. Quien da el primer paso no sabe a quién preguntar. Quien organiza un encuentro no tiene un tablero común. Quien enseña soberanía termina dependiendo de redes que no controla. Bitácora reúne eso en un solo lugar, abierto y colaborativo, con el tono de bitcoin.org: claro, naranja Bitcoin, sin ruido.

El producto ya está en marcha. Hay globo y mapa, altas de comercios y comunidades, verificación sin KYC, eventos, pulso de noticias, mercado con datos públicos, historia con llamados a la acción (White Paper, PizzaDAO, LABITCONF) y un plan de trabajo hasta el próximo halving (abril 2028). Pedimos al fondo no para inventar una idea, sino para sostener y extender una que ya funciona: que más ciudades del continente vean que **ya no están solas**.

Solicitamos el acompañamiento de LABIF —capital, red y visibilidad— para consolidar la infraestructura, completar la adopción territorial y llevar la bitácora a las comunidades que todavía no aparecen en el mapa.

Con respeto y en bitcoin,

**Consciencia Bitcoin**  
Iniciativa Bitácora.btc  
Colonia del Sacramento, Uruguay  
*Consciencia Bitcoin by LATAM Cripto Mom*

---

# 2. Resumen ejecutivo

| | |
|---|---|
| **Qué es** | Bitácora comunitaria, abierta y sin custodia, para visibilizar nodos, comercios, eventos y educación Bitcoin en Latinoamérica. |
| **Para quién** | Comunidades ya activas; familias y personas que dan el primer paso; comercios que quieren aceptar bitcoin; educadores. |
| **Qué hay hoy** | Sitio público trilingüe con mapa + globo, altas colaborativas, verificación por prueba de control (código en la red propia), eventos, historia, pulso y datos de mercado. |
| **Qué no es** | Empresa, exchange, custodio, token, ni producto de datos para vender perfiles. |
| **Impacto buscado** | Que cada ciudad con un nodo, un café o un meetup sea encontrable; que la educación no dependa de un algoritmo ajeno. |
| **Pedido a LABIF** | Apoyo 2026–2028 para operación, infraestructura soberana, verificación territorial y presencia en comunidades de Latam. |
| **Indicadores** | Puntos propios verificables + lectura en vivo de BTC Map; 3 idiomas; 22 hitos; plan hasta abr 2028. |

---

# 2.1 Cifras reales (corte 29 de agosto de 2026)

No inflamos visitas. Distinguimos **lo propio** de **lo que el mapa lee** de directorios abiertos.

### Lo propio (Bitácora / Consciencia Bitcoin)

| Dato | Cifra | Nota |
|---|---|---|
| Comunidad fundadora | 1 | Consciencia Bitcoin, Colonia del Sacramento, Uruguay |
| Overlay en `map.csv` | 1 comunidad + 1 ficha de comercio | El comercio no se cuenta como adopción Latam hasta verificarlo |
| Anuncios comunitarios activos | 0 | Tablero de 7 días listo; aún sin pines vigentes |
| Idiomas de la interfaz | 3 | ES · PT · EN (400 cadenas por idioma) |
| Secciones de la bitácora | 10 | Mapa, Consciencia, Roadmap, Comunidad, Pulso hoy, Historia, Red, Mercado, Privacidad, Contacto |
| Hitos de historia con relato y CTA | 21 | White Paper, Pizza Day, LABITCONF, fundaciones de la región, etc. |
| Bloques de origen de datos (sección Datos) | 14 | Cada fuente se declara |
| Fases hasta el halving | 4 | Q1 sep 2026 → Q4 abr 2028 |
| Exchanges en el promedio de liquidaciones | 10 | Binance, OKX, Bybit, Bitget, Hyperliquid, Gate, KuCoin, HTX, MEXC, Kraken |
| Componentes de interfaz / módulos | 49 / 80 | TypeScript |
| Repositorio | privado, creado 25 ago 2026 | https://github.com/prezpablo/bitacora.btc |

### Lo federado (BTC Map · no es “nuestro padrón”)

El mapa **guarda una copia local** del directorio (BTC Map). No lo consulta en cada visita. Orden de magnitud del diseño: **~25.000 comercios** y **~690 comunidades** en el mundo. Bitácora suma el overlay local (Colonia) y las altas que la comunidad cargue.

Eso es el impacto que pedimos crecer con LABIF: que el overlay Latam deje de ser una ficha y pase a ser decenas de comunidades verificadas.

---

# 3. El problema

En la región hay más Bitcoin de lo que se ve.

Los mapas globales (valiosos) no siempre cuentan la historia local: el meetup de un barrio, la comunidad que nació en una plaza, el comercio que cobra Lightning pero no está en un directorio. Quien busca “por dónde empiezo” tropieza con hilos, grupos cerrados o plataformas que exigen cuenta.

Al mismo tiempo, mucha “infraestructura web3” pide billetera para leer un texto, rastrea visitas o habla de la red cuando en realidad muestra el precio de un derivado. Para el arquetipo bitcoiner —privacidad por defecto, dinero entre pares, resistencia a la censura, herramientas para el mundo real— eso no sirve.

Falta un punto de encuentro **territorial y humano**, en los idiomas de la región, que no custodie nada y que se pueda auditar.

---

# 4. La solución: Bitácora.btc

Bitácora.btc es ese punto de encuentro.

Nace como espacio abierto para las comunidades bitcoiners de Latinoamérica y para quienes dan el primer paso. Es mapa, agenda, historia y datos públicos. El lema de trabajo es simple: *el nodo que te une al mundo Bitcoin*.

**Principios (no negociables)**

1. Sin custodia de fondos ni de llaves.  
2. Sin KYC para consultar información.  
3. Idiomas de la región: español, portugués, inglés.  
4. Aporte al proyecto solo en bitcoin (on-chain y Lightning).  
5. El mercado no se presenta como “el estado de la red”.  
6. El mapa se mira sin conectar una billetera.

---

# 5. Qué está construido (estado real del producto)

Lo siguiente está desarrollado y en uso, no es una lámina de promesas.

### 5.1 Territorio

- Globo de primera visita (la región en conjunto) y paso a mapa de calle.  
- Puntos de comercios y comunidades; directorio abierto (BTC Map) más registro propio para excepciones y comunidades de Latam.  
- Alta con nombre, descripción, dirección, horarios, medios de pago (on-chain, Lightning, sin contacto) y redes.  
- Calificación 1 a 5; baja calificación puede retirar el punto con reglas claras.  
- Verificación sin documento: código público en la red de la comunidad o del comercio, o reputación por votos. Marca naranja al verificarse.  
- Búsqueda con autocompletar (comercio, comunidad, ciudad).  
- Geolocalización a pedido de la persona, no por IP.  
- Anuncios comunitarios temporales (siete días), con la misma lógica de prueba de control.

### 5.2 Comunidad y tiempo

- Agenda de encuentros Bitcoin y afines, con filtro por cercanía, país, continente y plataforma.  
- Eventos en línea con horario UTC visible.  
- Historia de Bitcoin con relato, significado para quien usa la red, y llamados a la acción (White Paper, Pizza Day / PizzaDAO, hitos de la región como LABITCONF y fundaciones locales).  
- Pulso del día: titulares del ecosistema, traducidos al idioma elegido.  
- Contacto por formulario, sin exponer la casilla. Respuesta en el idioma de quien escribe.

### 5.3 Datos públicos (con honestidad)

- Precio y velas, medias, mapa de liquidaciones, miedo y codicia, flujos de ETF, referencia a debates regulatorios de fuentes públicas.  
- Se declara el origen de cada dato.  
- Se distingue: esto es mercado; esto otro es red.

### 5.4 Oficio de la web

- Tres idiomas en menús, secciones, formularios y legal.  
- Diseño alineado a bitcoin.org: blanco, naranja Bitcoin, lectura primero.  
- Hoja de ruta pública hasta el halving de abril de 2028.  
- Aviso de privacidad y accesibilidad; almacenamiento mínimo en el dispositivo.

---

# 6. A quién sirve

| Persona | Qué encuentra |
|---|---|
| Quien da el primer paso | Un mapa, una comunidad cerca, un texto de historia y el White Paper. |
| Quien ya organiza un nodo | Un lugar donde marcar el punto, las redes y los horarios. |
| Comercio que acepta bitcoin | Ficha, pagos, horarios, reputación. |
| Educador / familia | Relato claro, sin jerga innecesaria, en ES / PT / EN. |
| Bitcoiner exigente | Sin custodia, sin KYC de lectura, aporte en sats, datos con fuente. |

---

# 7. Impacto (educación, innovación, adopción)

LABIF pide soluciones reales en tres frentes. Así responde Bitácora:

**Educación.** La historia no es una línea de fechas: cada hito explica qué significó para quien usa Bitcoin y ofrece un acto (leer el White Paper, conocer PizzaDAO, acercarse a un encuentro). El pulso acerca noticias al idioma de la persona.

**Innovación.** Un registro colaborativo verificable sin plataforma de identidad. La prueba es pública (un código en la web o la red de quien se registra). Encaja con economía circular: el comercio se encuentra, se visita, se paga en bitcoin.

**Adopción.** Visibilidad territorial. El globo dice “ya no estás solo”. El mapa baja a la cuadra. La agenda acerca el próximo encuentro. Eso es adopción de uso, no de cotización.

**Geografía.** El proyecto nace en Uruguay y está pensado para Latinoamérica. El portugués no es un extra: es el puente con Brasil. El inglés, el puente con el resto de la red.

---

# 7.1 Indicadores de éxito

El comité necesita ver una herramienta en uso, no una lámina. Distinguimos **línea de base** (lo que ya existe, 29 ago 2026), **indicadores de proceso** (90 días) e **indicadores de territorio** (6 y 12 meses). No mezclamos el directorio federado de BTC Map con el overlay propio. No reportamos visitas únicas ni perfiles: Bitácora no rastrea personas.

**Criterio de éxito, en una frase.** Un extraño en una ciudad de Latam encuentra un punto naranja verificado, llega a un encuentro o a un comercio y puede pagar en bitcoin, sin entregar documento a la web.

### Cómo se mide (tres capas)

| Capa | Qué cuenta | Qué no cuenta |
|---|---|---|
| Overlay propio | Comunidades y comercios en el CSV de Bitácora, con verificación publicada | Puntos que sólo viven en BTC Map |
| Federada | Lectura en vivo de BTC Map (orden de ~25.000 comercios y ~690 comunidades) | Mérito de altas de Bitácora |
| Producto | Idiomas, hitos, altas intentadas, pines, contactos, CTAs de historia | Identidades, mails del mapa, “impresiones” |

### Línea de base — 29 de agosto de 2026

| Indicador | Valor | Lectura |
|---|---|---|
| Comunidad propia verificada | 1 | Consciencia Bitcoin, Colonia del Sacramento |
| Comercio propio contado como adopción Latam | 0 | Hay 1 ficha en cola, aún no verificada |
| Ciudades con overlay propio | 1 | Colonia |
| Anuncios comunitarios activos | 0 | Tablero de 7 días listo |
| Idiomas | 3 | ES · PT · EN |
| Hitos de historia con relato y acto | 21 | White Paper, PizzaDAO, LABITCONF, etc. |
| Nodos Bitcoin propios alimentando el mapa | 0 | El mapa lee directorios públicos + CSV |
| Analytics identificable | no | Privacidad por defecto |
| Custodia / KYC de lectura | no / no | No negociable |

No hay serie mensual de comercios propios verificados anterior a este corte. No se inventa. El grant se evalúa contra esta línea, no contra un gráfico retrospectivo.

### Territorio (lo que el fondo puede auditar)

Metas **proyectadas** (punteadas, no históricas). Criterio: verificados que se pueden visitar, no puntos en un CSV.

| Horizonte | Overlay propio verificado | Ciudades con ≥ 1 punto propio | Anuncios 7 días / mes | Lectura |
|---|---|---|---|---|
| Hoy | 1 comunidad | 1 | 0 | Línea de base |
| +90 días (Q1) | 8–15 | 3 | 4–8 | Primeros nodos del Río de la Plata y 1 ciudad extra |
| +6 meses | 25–40 | 8 | ~12 | Overlay reconocible en más de un país |
| +12 meses | 60–100 | 15 | tablero semanal vivo | Un extraño encuentra café o meetup cerca |

El directorio federado no es KPI de Bitácora: es contexto. El KPI es el **overlay Latam verificado**.

### Proceso (90 días, con o sin grant; el grant lo acelera)

| Indicador | Meta | Evidencia |
|---|---|---|
| Informe al fondo | 1 hoja / trimestre | Puntos, ciudades, pines, contactos, estado de infra — sin vanidad de tráfico |
| Tablero de uso sin cookies | Encendido | Conteos de búsqueda y de CTA de historia, sin user-id |
| Altas: intentadas vs. verificadas | Publicadas | Ratio visible; no se esconde el rechazo |
| Tiempo de verificación | Mediana en días | Código CARGA-XXXX en canal público → scraper |
| Contacto | Canal operativo | Formulario que entrega, sin exponer el correo |
| Reporte “ya no opera” | Política publicada | Captcha → 14 días a confirmar → 60 días rojo → baja a los 6 meses por nota 1–2 |

### Soberanía (quién puede apagar Bitácora)

| Indicador | Hoy | +6 a 12 meses (Q2) | Halving (abr 2028) |
|---|---|---|---|
| Nodo Bitcoin propio (Umbrel/Start9) | 0 | 1 | 1 + réplica |
| Mirror del front (IPFS u otro) | 0 | 1 CID o copia pública | 2 mirrors |
| Aportes | QR on-chain | + Lightning en el nodo (BTCPay) | El mapa nunca pide billetera |
| Fuentes del overlay | CSV en el repo | Mismo CSV + informe de altas | Overlay es la cara Latam |
| Analytics identificable / KYC de lectura / custodia | no / no / no | no / no / no | no / no / no |

Soberanía no es “cuántos nodos meten data al heatmap”. Es **quién custodia** y **quién puede apagar el sitio**.

### Calidad de verificación (spam y mapa limpio)

| Amenaza | Control | Éxito |
|---|---|---|
| Bots | Captcha + prueba de control en canal público | Alta no se “prende” sin código CARGA-XXXX visible |
| Fantasmas | Sin DNI; con prueba de que controlan web, X, Nostr o Telegram | Estrella naranja solo si el scraper encuentra el código |
| Comercio cerrado | Reporte comunitario + regla de 14 / 60 / 180 días | Overlay propio no acumula puntos muertos |
| Review bombing | Promedio = puntaje / votos en el CSV; 1–2 baja | Baja por regla publicada, no por moderación opaca |

La firma Lightning es fase Q3 (Identidad). No se presenta como si ya corriera.

### Lo que no vamos a reportar

Identidades, correos de quien usa el mapa, conversiones de exchange, impresiones, “usuarios mensuales” de un píxel. Si un indicador exige tratar al visitante como producto, no entra.

### Informe y después del halving

- **Durante el tramo:** una hoja por trimestre, contra esta tabla.  
- **Éxito de educación:** CTA de historia usados (White Paper, PizzaDAO, encuentros), no minutos de video.  
- **Éxito de innovación:** altas verificadas sin KYC / altas intentadas.  
- **Éxito de adopción:** ciudades con overlay propio visitable.  
- **Después de abril 2028:** Bitácora cabe en un nodo y en aportes Lightning. El grant compra 12–18 meses de overlay y un nodo; no una nómina perpetua. Si el opex no se cubre, el sitio queda estático (IPFS + CSV). El mapa federado sigue. No hay plan B de ads ni de token.

---

# 8. Gobernanza y sostenibilidad

- Iniciativa de **Consciencia Bitcoin**, con respaldo de **LATAM Cripto Mom**.  
- No hay accionistas de un producto financiero.  
- El mapa se nutre de directorios abiertos y de altas de la comunidad.  
- Costos actuales: operación del sitio, APIs públicas, tiempo de curaduría y verificación.  
- Ingresos actuales: aportes voluntarios en bitcoin (QR en el sitio). No hay pasarela de tarjetas.  
- Lo que no haremos con un grant: tokenizar la bitácora, vender datos de visitantes, exigir cuenta para leer.

**Uso previsto de un apoyo LABIF (orden de prioridad)**

1. Mantener el sitio en el aire con copias que no dependan de un solo proveedor.  
2. Nodo propio (Bitcoin + Lightning) para recibir aportes y verificar sin terceros de más.  
3. Curaduría y verificación humana de puntos y comunidades (Latam).  
4. Mejora de agenda de eventos y de la experiencia en telefonía móvil.  
5. Viajes y presencia en encuentros de comunidades (no stand de venta: taller y alta de puntos).  
6. Traducción y revisión nativa ES / PT / EN del material educativo.

Los montos exactos se ajustan al instrumento de LABIF (Geyser / grant directo). Este documento no inventa una cifra: estamos abiertos a la ronda y a la escala que el fondo considere para un proyecto ya construido, de base territorial.

---

# 9. Hoja de ruta (hasta el halving, abril 2028)

| Fase | Período | Enfoque |
|---|---|---|
| **Q1 · Consolidación** | sep 2026 – ene 2027 | Contacto fiable, menos abusos en el mapa, distinción nítida mercado / red. |
| **Q2 · Claridad y acceso** | feb 2027 – jun 2027 | Carga en el celular, gráfico legible, el sitio no se cae si falla una fuente. |
| **Q3 · Identidad sin custodia** | jul 2027 – nov 2027 | Altas y votos con perfil público o Lightning como firma, nunca para guardar plata. |
| **Q4 · Cercanía con la red** | dic 2027 – abr 2028 | Comisión y próximo bloque; aporte en sats; el mapa nunca pide billetera. |

---

# 10. Riesgos y cómo se mitigan

| Riesgo | Mitigación |
|---|---|
| Altas falsas o spam | Captcha, límites de envío, prueba de control, votos con reglas de baja. |
| Dependencia de un mapa global | BTC Map como base; CSV propio para comunidades y excepciones. |
| Dependencia de un correo o un host | Plan de soberanía: lectura estática, nodo propio, sin API de grandes plataformas en el cliente. |
| Confundir precio con red | Copy explícito en Mercado y en este documento. |
| Quemar el grant en marketing | Prioridad: infraestructura, curaduría, territorio. Cero pauta invasiva. |

---

# 11. Pedido concreto a LABIF

Solicitamos ser considerados como **proyecto de educación, innovación y adopción territorial** en la ronda 2026.

Pedimos:

1. **Inclusión en la red LABIF** (visibilidad ante donantes alineados, Geyser u el canal que definan).  
2. **Acompañamiento** de Bitcoin Beach / Fundación Bitcoin Iberoamérica en prácticas de economía circular (el mapa ya está pensado para el comercio que cobra en sats).  
3. **Capital de operación** para 12–18 meses, según el tramo que el fondo asigne a iniciativas de base comunitaria ya construidas.  
4. **Puente con comunidades** de la red iberoamericana para cargar y verificar puntos fuera de Uruguay.

A cambio, Bitácora.btc se compromete a:

- Mantener el código de conducta: sin custodia, sin KYC de lectura, tres idiomas.  
- Publicar de forma simple qué se hizo con el apoyo, contra la sección **7.1 Indicadores de éxito** (puntos verificados, ciudades, pines, contactos, estado del nodo — no vanidad de tráfico).  
- Ofrecer la bitácora como herramienta a otras comunidades de la red LABIF, sin cobrar licencia.

---

# 12. Cierre

Bitácora.btc no promete un protocolo nuevo. Promete algo más escaso: que una persona en Colonia, en Recife o en Medellín pueda ver un punto naranja, llegar a un encuentro y pagar un café en bitcoin, sin entregar el pasaporte a una web.

Eso es impacto. Eso es lo que pedimos sostener.

**Iniciativa Bitácora.btc**  
Consciencia Bitcoin by LATAM Cripto Mom  
Colonia del Sacramento, Uruguay  
Agosto 2026

---

# Anexo A — Ficha corta (para formulario / Geyser)

- **Nombre del proyecto:** Bitácora.btc  
- **Tipo:** educación + mapa de adopción + comunidad  
- **País de origen:** Uruguay  
- **Alcance:** Latinoamérica  
- **Estado:** producto en producción (no idea, no prototipo de lámina)  
- **Equipo:** Consciencia Bitcoin · LATAM Cripto Mom  
- **Sitio:** vista previa en esta sesión · código https://github.com/prezpablo/bitacora.btc (privado; sin Pages al 29 ago 2026) 
- **Aporte actual:** QR bitcoin / Lightning en el propio sitio  
- **Categorías LABIF:** educación, innovación, adopción  

# Anexo B — Frase para redes (si LABIF la pide)

Bitácora.btc es el punto de encuentro donde las comunidades y las personas se conectan con la libertad financiera. Mapa, historia y datos públicos de Bitcoin en Latinoamérica. Sin custodia. Sin KYC para leer. Una iniciativa de Consciencia Bitcoin, Colonia del Sacramento.

# Anexo C — Lo que este documento no inventa

No se declaran números de usuarios que no están medidos en este archivo.  
No se promete token, DAO de recaudación ni retorno financiero al fondo.  
No se presenta el panel de mercado como infraestructura de la red Bitcoin.
