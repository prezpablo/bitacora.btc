# Deuda legal — Bitácora.btc

**Origen:** Informe de auditoría legal y adecuación, 1 sep 2026.  
**Cotejado con:** código en `main` (legal-eu, footer, contacto, storage-banner, SQLite, Caddy).  
**Esto no es asesoramiento jurídico.** Es la cola de trabajo para estructurar la parte legal del producto.

La auditoría redactó un clausulado para pegar en `legal-eu.tsx` y pidió datos para inscribir la base ante la URCDP. Varios hallazgos **no coinciden con lo que el sitio hace hoy**. Implementar el texto tal cual haría declaraciones falsas (registro, autenticación, billeteras).

---

## 0. Qué es cierto hoy (no inventar)

| La auditoría dice | En el código |
|---|---|
| Módulos `auth/` = gestión de identidad | Auth **apagada**. Better Auth/PGLite son stub. **No hay registro ni login.** |
| Cookies de analítica a bloquear | **No hay** gtag, pixel ni ads. Solo `localStorage` (idioma, apodo, caché del mapa). |
| Vinculación de billetera cripto | **No hay** connect-wallet. Hay QR Lightning de contribución, pines públicos y menciones Nostr en el pulso. |
| Formulario de contacto recaba datos | **Sí:** nombre, email, motivo, mensaje → FormSubmit → Gmail. Casilla de privacidad **obligatoria** (P0). |
| Mapa / geolocalización | **Sí:** GPS del navegador (permiso) **y** ciudad por IP (GeoJS / ipwho.is) al cargar el mapa. |
| `www.bitacorabtc.org` inaccesible | Caddy redirige `www` → apex. Confirmar DNS/cert del `www` en el VPS. |

**No construir:** pantalla de registro, checkbox de “cuenta”, connect-wallet, ni un CMP de analíticas. No existen.

---

## P0 — Transparencia y consentimiento (producto)

Enlaces y opt-in **visibles**. Hoy el legal vive en `#legal` (home) y el pie solo tiene un ancla “Privacidad y accesibilidad”. El banner de storage no enlaza la política. El contacto se envía sin aceptación expresa.

| ID | Deuda | Dónde | Qué hacer |
|---|---|---|---|
| L0.1 | Textos legales “un clic lejos” en **todas** las vistas | `site-header.tsx` footer; `/labif` | **Hecho (P0):** footer con Aviso / Privacidad / Cookies / Accesibilidad. LABIF el mismo bloque. |
| L0.2 | Rutas propias, no solo un hash | `/legal` | **Hecho (P0):** `/legal` + anclas. El home ya no embebe el clausulado; `#legal` redirige a `/legal`. |
| L0.3 | Enlace “justo a tiempo” en formularios | contacto, pines, altas/votos del mapa | **Hecho (P0):** casilla desmarcada + link. Sin tilde no envía. |
| L0.4 | Banner de storage sin política | `storage-banner.tsx` | **Hecho (P0):** links a Cookies y Privacidad. |
| L0.5 | Terceros que pegan **antes** del consentimiento | `__root.tsx` Google Fonts; `geo.ts` GeoJS | **Hecho (P0):** Ubuntu autohospedada. Geo-IP del mapa solo si hay extras o botón de ubicación. |
| L0.6 | Clausulado desactualizado | `domain/legal-eu.ts` bloque Cookies | **Hecho (P0):** texto alineado al banner, fuentes locales y Geo-IP. |

---

## P1 — Estructura del clausulado (`legal-eu.tsx` + i18n)

Insertar el texto de la auditoría **adaptado**, no copiado. ES/EN/PT. Bloques propuestos, en este orden:

1. **Identidad del responsable** — Persona física según auditoría: Pablo Daniel Perez Correa, Colonia del Sacramento, Uruguay. Canal: formulario de Contacto. Hoy dice “Iniciativa Bitácora.btc · Consciencia Bitcoin…”: unificar marca vs responsable (la marca puede quedar; el responsable debe ser identificable, Ley 18.331).
2. **Marco normativo** — Ley 18.331 (primario, Uruguay) + RGPD para visitantes del EEE + ePrivacy (almacenamiento en terminal) + EAA/WCAG para accesibilidad. Hoy el lead es casi solo UE.
3. **Qué datos y para qué** — Contacto; fichas/pines públicos; IP hasheada (abuso); GPS (opt-in); ciudad por IP (mapa); localStorage. **No** registro, **no** wallet. Base: consentimiento (formularios, extras) e interés legítimo (seguridad, directorio público).
4. **Web3 e inmutabilidad** — Alcance real: lo que se publica en el mapa/CSV (GitHub) y lo que el usuario ponga en una red pública (Nostr, Lightning, on-chain) **no se puede borrar del todo**. No hablar de “vincular billetera” hasta que exista.
5. **Transferencias** — FormSubmit + Gmail, GitHub (CSV), Nominatim/OSM, GeoJS, APIs de mercado. Sin CCT/DPA documentados (brecha si hay interesados UE). Conservar el aviso honesto.
6. **Conservación** — Contacto: fijar plazo (p. ej. 12 meses). Pines: 7 días. Fichas: mientras la comunidad las mantenga. `localStorage`: hasta borrar o “Solo necesario”.
7. **Derechos ARCO / RGPD** — Acceso, rectificación, supresión, oposición, limitación, portabilidad. URCDP (UY) y autoridad UE (art. 77). El CSV/GitHub limita el olvido absoluto: dejarlo escrito.
8. **Cookies / almacenamiento** — No ads. Idioma = necesario. Apodo y caché del mapa = extras. Cómo retirar (banner + borrar datos del navegador).
9. **Accesibilidad** — Estado y brechas (no declarar conformidad WCAG 2.1/2.2 AA).
10. **Menores** — No dirigido a < 16. Sin verificación de edad.
11. **Descargo** — Sigue sin ser certificado de conformidad.

| ID | Deuda | Qué hacer |
|---|---|---|
| L1.1 | Un solo muro de 9 artículos | **Hecho:** Aviso / Privacidad (tabla) / Transferencias / Derechos / Cookies / Accesibilidad / Menores. Anclas iguales. |
| L1.2 | Identidad del responsable incompleta | **Hecho:** en público, persona física + domicilio en Colonia del Sacramento. Nombre civil **solo** en la ficha URCDP y ante un pedido de derechos acreditado. |
| L1.3 | Representante UE (art. 27) y DPO | **Hecho (honesto):** no hay. No se finge. Se documenta que el servicio se ofrece a Latam; si se dirige al EEE, hay que designar. |
| L1.4 | i18n | **Hecho:** ES/EN/PT en `LEGAL_EU`. Disclaimer intacto. |
| L1.5 | Contradicción Geo-IP | **Hecho:** el texto dice ciudad por IP solo con extras o botón. El código ya lo respeta (P0). |

---

## P2 — Accesibilidad (auditoría: WCAG 2.1 AA; el código ya apunta a 2.2 AA)

No es clausulado; es deuda de interfaz que el texto legal debe **no** sobreprometer.

| ID | Brecha ya escrita en `legal-eu.ts` | Prioridad |
|---|---|---|
| L2.1 | Captcha visual sin alternativa no visual | Alta (bloquea contacto y altas) |
| L2.2 | Errores de formulario no ligados al campo (`aria-describedby` / `aria-invalid`) | Alta |
| L2.3 | Skip-link: el i18n existe; verificar que el control sea el primero al tabular | **Hecho (P0 plan):** `SiteShell` lo pone primero. Clausulado actualizado. |
| L2.4 | Globo y velas sin teclado / lector | Media. `prefers-reduced-motion` **hecho** (sin auto-rotar ni vuelo) |
| L2.5 | Contraste del naranja Bitcoin y tamaños táctiles 24 px | Media |
| L2.6 | Imágenes de eventos con `alt` vacío | Baja |

El footer y los checkboxes de L0 cuentan como transparencia **y** como patrón accesible (foco, `aria-required`).

---

## P3 — URCDP (fuera del repo; habilita el formulario de inscripción)

Si se almacenan datos personales de forma estructurada, la base se inscribe en la URCDP. Borrador con lo que el código permite afirmar:

| Dato | Respuesta propuesta (confirmar) |
|---|---|
| Nombre de la base | `Contacto y directorio Bitácora.btc` |
| Tipos | Contacto: nombre, email, motivo, mensaje. Mapa/pines **públicos**: nombre de lugar o anuncio, descripción, dirección, horarios, redes, logo (URL), coords. Técnico: IP **hasheada** (rate-limit), tickets de captcha, idioma y (si acepta) apodo y caché local. **No:** contraseñas, KYC, billeteras, cuentas. |
| Hosting | VPS Njalla, app en `/var/www/bitacora`, SQLite `data/bitacora.sqlite`. **Confirmar país del datacenter.** Contacto además transita por FormSubmit y Gmail. CSV público en GitHub (EE.UU.). |
| Medidas | HTTPS (Caddy/Let’s Encrypt), SSH solo clave, root cerrado, `MemoryMax`, captcha + rate-limit, IP no en claro, backup gzip del SQLite, sin cookies de ads. |
| Cesión a terceros | FormSubmit, Google (Gmail + **hoy** Google Fonts), GitHub, OSM/Nominatim, GeoJS o ipwho, APIs de mercado/eventos. Sin cesión comercial. Redes públicas (Nostr, Lightning, chain) si el usuario publica ahí. |

| ID | Deuda | Quién |
|---|---|---|
| L3.1 | Completar país del VPS y si FormSubmit es “encargado” | Operador |
| L3.2 | Decidir si el CSV de GitHub es “base” o solo directorio público | Operador + abogado |
| L3.3 | Presentar inscripción URCDP cuando L3.1–3.2 estén cerrados | Guía: [`URCDP-INSCRIPCION.md`](URCDP-INSCRIPCION.md). Trámite en [SRCiudadanoWeb](https://www.datospersonales.gub.uy/SRCiudadanoWeb). |
| L3.4 | Plazo de borrado de mails de contacto (hoy: no hay) | Producto: 12 meses salvo reclamo |

---

## Orden de implementación (código)

1. Autohospedar fuentes + corregir el bloque Cookies (L0.5, L0.6). **Hecho.**  
2. Footer legal en todas las vistas + rutas `/privacidad` (L0.1, L0.2, L1.1). **Hecho** (`/legal` + anclas).  
3. Reescribir `LEGAL_EU` con los 11 bloques adaptados, ES/EN/PT (L1). **Hecho (sep 2026):** Ley 18.331 al frente, tabla de tratamientos, sin fingir WCAG ni telemetría. 
4. Casilla + enlace JIT en contacto y en altas del mapa (L0.3). **Hecho.**  
5. Banner: link a privacidad; Geo-IP solo con extras o con gesto (L0.4, L1.5). **Hecho.**  
6. Captcha y errores de formulario accesibles (L2.1–L2.2).  
7. Cerrar L3 con el operador; no bloquear el deploy del texto por la inscripción.

---

## Fuera de alcance de esta cola

- Abrir cuentas / Better Auth.  
- Banner de cookies de marketing.  
- Cláusula de “billetera vinculada” hasta que haya wallet.  
- Declarar “conformidad RGPD/WCAG certificada”.

---

## Informe 13 oct 2026 — qué entra, qué no

Origen: «Lista de mejoras» (Parte A código, Parte B trámites URCDP). No es dictamen. Los `[CORCHETES]` no se inventan: viven en una constante `LEGAL` hasta que Pablo los complete.

### Ya estaba (no reabrir)

| Ítem del informe | Estado |
|---|---|
| Pie con aviso, privacidad, cookies, accesibilidad, términos | Hecho (L0). |
| `/legal` con anclas | Hecho (L0.2). Falta índice y versión 2.0 (A4.2). |
| Casilla desmarcada y botón detenido sin ella | Hecho. El texto es el de Contacto en todos los formularios: eso es A1.1, abierto. |
| Fuentes sin Google Fonts | Hecho. |
| Repo 404 anónimo | Sigue siendo **D-FOSS**. A5.1 no es un hallazgo nuevo. |
| Firebase en el bundle | Sigue siendo **D-DEPS**. A3.4 no abre otra cola. |
| `og:locale` es_UY / pt_BR y alternate en_US | Ya está en el HTML de `/`. A6.5 no entra. |

### No entra

| Ítem | Por qué |
|---|---|
| A6.2 «Bircoiner» | No es un typo del build. El eslogan quedó así a pedido. No se revierte solo. |
| A3.3 sacar FormSubmit | El informe pide confirmación antes de codear. Hasta un sí, no hay fase. |
| A3.2 proxy de teselas e imágenes | P3 y choca con el uso de las teselas. Después de A3.1, no antes. |
| A4.9 «Patrocinado» en LABITCONF | Falta el sí o el no. Sin eso no se etiqueta. |
| A6.3 voseo de todo el sitio | Pasa de copy, no de esta cola legal. No se mezcla con un ZIP de textos legales. |
| Parte B (B1–B5, B7, B8) | Trámites de Pablo ante la URCDP. No son commits. B6 sí es código, cuando existan los números. |

### Tensión con la cola de septiembre

L1.2 dejó el nombre civil fuera del sitio. A4.1 pide nombre, domicilio y correo en `/legal#aviso` (art. 13). No se publica un nombre inventado. Cuando `LEGAL.controllerName` y `LEGAL.address` tengan valor, el aviso los muestra. Hasta entonces el aviso sigue como está y la fase no se da por cerrada.

A4.5 pide sacar del público las frases de brecha («no hay CCT», «el clone no responde 200»). Esas frases pasan a `docs/TODO-legal.md` en la fase L-PRIV. La brecha no desaparece: deja de estar en `/legal`.

### Parte B — Pablo, no el repo

| Id | Qué | Cuándo |
|---|---|---|
| B1 | Confirmar estado y anotar el número de expediente | Esta semana |
| B2 | Ampliar la inscripción: directorio del mapa y anuncios. Actualizar Contacto (FormSubmit + Gmail) y Seguridad (Njalla, hash de IP, 30 días) | 2 semanas |
| B3 | Dejar escrito en el expediente si la transferencia a EE.UU. es consentimiento (art. 23) o autorización con garantías | Junto con B2 |
| B4 | Carpeta con los términos de Njalla, FormSubmit, Google y GitHub. Borrado manual de Gmail a los 12 meses | 1 mes |
| B5 | Anotar la fecha real de inicio del sitio. Si es anterior al 4 jun 2026, el plazo de 90 días ya estaba vencido al presentar | Esta semana |
| B6 | Pasar los números de inscripción para publicarlos | Cuando la URCDP los dé |
| B7 | Aviso a la URCDP si cambia un proveedor. Revisión ene/abr/jul/oct | Recurrente |

---

## Checklist 13 oct 22:22 — informe vs .org (versión 2.4)

La pasada de las 21:19 miró la versión 2.0. El sitio publicado a las 22:22 es la 2.4. Cola máquina: `deuda-cola.json`.

### Cumple

- Nombre y ciudad en `/legal`. Sin cédula, sin RUT, sin calle.
- Casilla al publicar ficha y otra al publicar experiencia.
- Regla 10 y fila Experiencias. CC BY 4.0.
- Njalla: Finlandia. Pulso: botón Pausar ciclo.
- `/COPYRIGHT` a nombre de la iniciativa. Sin Ley 17.250 ni corchetes.
- Bircoiner no se toca.

### Abierto

Cotejo del `.org` a las 22:41: L-N1 y L-XFER ya están. L-IP está en GitHub `9bd3b6d` y no en el sitio. El informe v2 (22:23) entra abajo. Parte B no es código.

| Id | Pri | Falta |
|---|---|---|
| A-01 | P0 | Hecho en el repo (textos 2.5). Falta el ZIP. Sin calle. |
| L-URCDP (A-02) | P0 | Hecho en el repo (textos 2.6). Falta el ZIP. Sin número, la URCDP no lo asignó. |
| L-PAIS (A-03) | P0 | Hecho en el repo (textos 2.7). Falta el ZIP. Hungría solo con la fuente de OpenFreeMap. |
| A-04 | P0 | Hecho en el repo (textos 2.8). Falta el ZIP. Cita del inciso 2º, literal A. |
| L-IP | P1 | Falta el ZIP `9bd3b6d`. |
| A-07 | P1 | Hecho en el repo. Falta el ZIP. Hora de Uruguay con zona. La serie modelo dice que no es cotización. |
| A-08 | P1 | 14 reglas. Plazo de disputas oculto. ODbL de fichas derivadas, sin verificar, no se publica. |
| A-09 | P1 | Versión del consentimiento en el envío. IP nunca en claro. |
| A-10 | P1 | Título «Textos legales». Vigencia oculta si es un corchete. |
| A-11 | P1 | Sacar «Brechas en curso» y «Plan:» de la página. |
| A-13 | P1 | El aviso de vulneración no dice «cuando corresponda». |
| A-14 | P2 | Borrado de códigos y pines. Gmail no se borra desde el VPS. |
| A-15 | P2 | Tabla de almacenamiento real. |
| A-17 | P2 | `mailto:` junto al captcha. El audio queda. |
| A-18 | P2 | Anexo Brasil y Argentina. El párrafo del EEE no vino: no se inventa. |
| A-21 | P2 | Lenguaje claro. Allowlist no es «lista de fundadores». |
| A-22 | P2 | 24 px. |
| A-23 | P2 | Lista y resumen de precio en texto. |
| A-25 | P3 | Claves i18n muertas, si no se usan. |
| A-26 | P3 | Aviso junto al QR de sats. |
| A-29 | P3 | Errores anunciados. |
| A-31 | P3 | LGPD art. 14 solo para menores de 12, si se publica. |
| L-VALOR | P2 | Impugnación de valoraciones. El v2 no lo repite. Sigue. |
| L-PSAV | P2 | 20.446 y Circular 2507 solo después de leerlas. |
| L-MKT-COPY | P2 | Sacar «barre shorts». |
| L-LABIT (A-27) | P3 | No etiquetar LABITCONF hasta el sí o el no. |
| D-FOSS (A-05) | P1 | Repo 200 anónimo, o paquete de fuentes. Recién ahí el hash y el enlace. |

No entra: A-12 (Bircoiner, a pedido), A-06 (titular lo define Pablo), A-16 (FormSubmit, hasta un sí), A-20 (voseo, otro pase), A-28 (ya está), A-30 (después de los arreglos de accesibilidad), A-32 (proxy de teselas, no en esta VPS).

Pablo: B-01 bases, B-02 domicilio, B-03 fechas, B-04 número, B-05 plazos, B-06 copyright y ODbL, B-07 revisión trimestral, B-08 sí/no de producto, B-09 delegado (hoy no aplica).

