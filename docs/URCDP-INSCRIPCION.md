# Inscripción URCDP — Bitácora.btc

**Esto no es un escrito para presentar tal cual.** Es la guía operativa para que el responsable (persona física) inscriba la base ante la [Unidad Reguladora y de Control de Datos Personales](https://www.gub.uy/unidad-reguladora-control-datos-personales/).  
Trámite oficial (sin costo): [Inscripción de bases de datos personales](https://www.gub.uy/tramites/inscripcion-bases-datos-personales) → [SRCiudadanoWeb](https://www.datospersonales.gub.uy/SRCiudadanoWeb).  
Consultas: 2901 0065, opción 3.

Norma: Ley n.º 18.331 art. 29 + Decreto n.º 414/009 arts. 16–20. Toda base pública o privada se inscribe. **No** entra la excepción doméstica del art. 3 A: el sitio es un servicio abierto, no una agenda personal.

El plazo reglamentario es **90 días desde el inicio de actividades**. Si el sitio ya está en el aire, presentar **a la mayor brevedad**; no esperar un rediseño.

---

## 0. Qué inscribir (y qué no)

| Base | ¿Se inscribe? | Por qué |
|---|---|---|
| Contacto (nombre, email, motivo, mensaje) | **Sí** | Datos de personas físicas, soporte informatizado. |
| Seguridad (hash de IP, captcha, topes) | **Sí, junto con contacto** o como base técnica anexa | Identificadores de red, aunque hasheados, pueden ser datos personales. |
| Mapa / anuncios públicos (nombre de lugar, redes, coords) | **Informar** en la misma ficha como directorio abierto | Muchos registros son de comercios/comunidades, no de personas. Lo que un titular carga de sí mismo es consentimiento. Decisión fina: L3.2 en `DEUDA-LEGAL.md`. |
| localStorage en el dispositivo del visitante | No como base propia | Está en el terminal del titular; se informa en la política. |
| Precio BTC, mempool, eventos de terceros | No | No son datos personales nuestros. |

Recomendación: **una sola inscripción** llamada `Contacto y seguridad — Bitácora.btc`, y en “naturaleza de los datos” mencionar el directorio público del mapa.

---

## 1. Antes de entrar al sistema (checklist)

1. Cédula vigente. El ingreso es **individual, por persona física** (no hay usuario compartido de organización).
2. Medio de identidad electrónica, uno de:
   - Usuario [gub.uy](https://www.gub.uy/tramites/identidad-digital-usuario-gubuy-creacion-usuario-gubuy-0#contenido-seleccion)
   - CI digital con lector
   - [Identidad Digital Abitab](https://iddigital.com.uy/es/)
   - [TuID Antel](https://www.tuid.uy/user/auth)
3. Tener a mano: nombre completo del responsable, domicilio en Colonia del Sacramento, cédula, correo de contacto, descripción de finalidades, destinatarios, plazos, medidas de seguridad.
4. Política publicada en `https://bitacorabtc.org/legal` (ya alineada al art. 13).
5. Confirmar **país del datacenter del VPS Njalla** (L3.1). Hasta entonces, en el formulario: “servidor virtual contratado a Njalla; jurisdicción del centro de datos a consignar”.
6. No hace falta DPO ni representante UE para esta presentación uruguaya.

---

## 2. Paso a paso en SRCiudadanoWeb

1. Abrir [https://www.datospersonales.gub.uy/SRCiudadanoWeb](https://www.datospersonales.gub.uy/SRCiudadanoWeb).
2. Identificarse con gub.uy / CI digital / Abitab / TuID.
3. En la bandeja **Mis Registros**, pulsar **Nuevo Registro**.
4. Completar los pasos del formulario (Decreto 414/009 art. 16). Usar los textos del §3; no copiar marketing.
5. Revisar que el domicilio de notificaciones coincida con Colonia y que el canal de derechos sea el formulario de Contacto del sitio.
6. Enviar. El sistema deja el registro en revisión de la URCDP.
7. Guardar el comprobante / número de registro. Cuando esté **aprobado**, anotar el código en este archivo y, si se quiere, en el aviso legal (hoy dice “en trámite de presentación”).
8. **Actualización trimestral** (Decreto 414/009 art. 20): si cambia finalidad, destinatarios, hosting o tipos de dato, comunicar. Si no cambió nada material, igual entrar a la bandeja y confirmar vigencia cuando el sistema lo pida.

Si alguna vez se usó el sistema viejo con un usuario compartido: opción **Migración Usuarios** (mail + usuario anterior). No aplica a un alta nueva.

---

## 3. Texto para pegar en el formulario

Ajustar solo lo que esté entre corchetes.

**Identificación de la base**  
`Contacto y seguridad — Bitácora.btc`  
Marca del sitio: Bitácora.btc. Iniciativa Consciencia Bitcoin by LATAM Cripto Mom.

**Responsable**  
Pablo Daniel Perez Correa, persona física.  
Domicilio: Colonia del Sacramento, Departamento de Colonia, Uruguay.  
Canal: formulario de Contacto en https://bitacorabtc.org/#contacto (https://bitacorabtc.org/legal#aviso).  
**No publicar el nombre civil en el sitio.** En el aviso público solo va el domicilio (ciudad) y la marca; la identidad civil queda en esta ficha y se entrega a quien ejerza derechos, acreditando la suya.

**Naturaleza de los datos**  
Contacto: nombre, correo electrónico, motivo y mensaje.  
Seguridad: identificador de red reducido a hash, tickets de captcha, contadores de envío.  
Directorio público (mapa y anuncios comunitarios, cargado por el propio titular): nombre de lugar o anuncio, descripción, dirección, horarios, redes sociales, URL de logo, coordenadas, recuento de votos. **No** se recaban contraseñas, documentos de identidad, datos biométricos, historial financiero ni claves de criptoactivos. **No** hay registro de usuarios.

**Finalidad**  
Responder solicitudes de contacto; mantener un directorio comunitario abierto de nodos, comercios y anuncios Bitcoin; mitigar spam y abuso del servicio. Sin scoring, sin cesión comercial, sin publicidad comportamental.

**Obtención y tratamiento**  
Formulario web con casilla de consentimiento desmarcada por defecto. Publicación voluntaria en el mapa. Geolocalización GPS solo con permiso del navegador. Ciudad por IP solo con extras o botón de ubicación. Captcha y topes de envío en el servidor.

**Destinatarios / transmisiones**  
- FormSubmit (relé del formulario) → Gmail (correo del responsable).  
- GitHub, EE.UU.: CSV público del mapa y anuncios, **sin** correos ni códigos de verificación.  
- Nominatim/OpenStreetMap: resolución de direcciones.  
- GeoJS / ipwho.is: ciudad aproximada si hay consentimiento.  
- APIs de mercado y eventos: no reciben datos de titulares.  
No hay cesión onerosa.

**Transferencias internacionales**  
EE.UU. (GitHub, Gmail) y prestadores de geolocalización / mapas. El país de destino no es adecuado. Base: consentimiento inequívoco del titular (Ley 18.331 art. 23 A), informado en https://bitacorabtc.org/legal. Pendiente: cláusulas contractuales tipo y/o relé de correo en jurisdicción adecuada.

**Plazo de conservación**  
Contacto: 12 meses, salvo reclamo o deber legal.  
Anuncios comunitarios: 7 días en tablero.  
Fichas del mapa: mientras la comunidad las mantenga; el historial de GitHub puede sobrevivir a un borrado aparente (se informa antes de publicar).  
Hash de IP / captcha: ventana corta del tope (horas).  
localStorage: en el dispositivo del titular, hasta que lo borre.

**Medidas de seguridad (art. 16 C)**  
HTTPS (Caddy / Let’s Encrypt). SSH solo con clave; usuario root cerrado. Un proceso de aplicación con tope de memoria. Captcha y rate-limit. IP no almacenada en claro. Copia gzip periódica de SQLite fuera del VPS. Sin cookies de analítica ni de ads. Códigos de verificación fuera del CSV público.

**Ejercicio de derechos**  
Formulario de Contacto, con acreditación de identidad. Política: https://bitacorabtc.org/legal#privacidad. Autoridad de control: URCDP.

**Soporte técnico**  
Informatizado. Aplicación web + SQLite en el VPS; CSV de respaldo público en GitHub.

---

## 4. Después de aprobarse

1. Sustituir en `legal-eu.ts` la frase “está en trámite de presentación” por el **número de inscripción**.  
2. Calendario trimestral (recordatorio en el mismo mail del responsable).  
3. Si se abre registro de usuarios, se conecta una billetera o se cambia el relé de correo: **nueva comunicación** a la URCDP antes o al mismo tiempo.  
4. Vulneración de seguridad: guía AGESIC/URCDP de notificación. No hay DPO; el responsable firma.

---

## 5. Lo que este trámite no arregla

- Representante UE (art. 27 RGPD) si se apunta de hecho al EEE.  
- CCT / DPA con GitHub, Google y FormSubmit.  
- Relé de correo en el EEE.  
- Captcha accesible y el resto de WCAG (cola P3).

Inscribir no declara conformidad RGPD. Declara la base uruguaya.
