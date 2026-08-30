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
