# Evaluación interna — privacidad por diseño

**Fecha:** 14 de octubre de 2026  
**Alcance:** bitacorabtc.org, código de este repo.  
**Uso:** nota interna. No se publica en `/legal` ni en el sitio.

No es dictamen. Describe lo que el código hace hoy y lo que queda abierto.

## Para qué trata datos

El sitio es un directorio público de comercios y comunidades, más anuncios, experiencias y un escritorio de precio educativo. No es exchange y no custodia fondos.

| Tratamiento | Qué hay | Base que ya dice `/legal` | Cuánto dura |
|---|---|---|---|
| Ficha del mapa | Nombre del lugar, texto, dirección, horarios, redes, URL de logo, coordenadas, votos | Consentimiento al publicar un directorio abierto | Mientras la ficha exista. El historial de GitHub puede quedar |
| Anuncio | Nombre, texto, URL de prueba, redes, código CARGA | Consentimiento, con caducidad semanal | 7 días en el tablero. El código CARGA, 30 días, y no sale en el CSV público |
| Experiencia | Actividad, ciudad, fecha o recurrente, precio en sats o convenio, URL de prueba | Consentimiento al publicar | Mientras exista. El código de edición se borra a los 30 días |
| GPS | Coordenadas del dispositivo | Permiso del navegador, después de un aviso | No se guarda en el servidor. Solo centra el mapa en esa sesión |
| Ciudad por IP | Ciudad aproximada (GeoJS) | Extras del dispositivo, o el botón de ubicación | No se guarda. Si hay abuso, queda un HMAC truncado de la IP |
| Tope de envíos | HMAC-SHA256 truncado de la IP, ticket de captcha | Necesario para frenar spam y abuso | Ventana de 2 horas. El captcha caduca |
| Este dispositivo | Idioma; si se acepta, apodo y caché del mapa | Idioma necesario. El resto, el aviso del banner | Hasta borrar los datos del navegador o elegir «Solo necesario» |

## Medidas que ya están

- La IP en claro no se escribe. `hashClientIp` hace HMAC-SHA256 con `BITACORA_IP_PEPPER` y guarda 24 caracteres.
- El GPS no se pide al cargar. En el globo y en el mapa, el primer toque muestra para qué es y que no se guarda. El permiso del navegador sale en el segundo toque.
- El CSV público no lleva códigos CARGA ni correos.
- Publicar no pide transcribir letras. Siguen la prueba de trabajo, el tope de envíos, el audio y el correo de accesibilidad.
- No hay analítica de terceros (ni gtag ni píxel).
- GitHub recibe el directorio público. FormSubmit reenvía Contacto a Gmail. Eso ya está dicho en `/legal`, con casilla al publicar y en Contacto.

## Riesgos que siguen

1. Si `BITACORA_IP_PEPPER` no está en el entorno, el código usa otra cadena del servidor o la frase fija `bitacora.btc`. En el VPS la pimienta está en `/etc/bitacora.env`. Se rotó el 14 de octubre de 2026. La clave anterior no se guardó. La próxima rotación es el 12 de enero de 2027. `/legal` (versión 2.18) nombra la fecha y no la clave.
2. Lo publicado en el mapa y en GitHub es público a propósito. Borrar la copia de Bitácora no borra el historial abierto.
3. La ciudad por IP sale del navegador hacia GeoJS cuando el usuario lo habilita.
4. Contacto sale hacia FormSubmit (Estados Unidos) y de ahí a Gmail. La casilla lo dice antes de enviar.
5. La regla 1 ya dice que leer el sitio no es aceptar. La aceptación queda en la casilla, al publicar o al escribir por Contacto.
6. El 14 oct se decidió no publicar un segundo plazo de denuncia. Los 5 días hábiles quedan para acceso, rectificación o supresión. Una disputa de ficha usa el formulario y no promete fecha.

## Qué no hace esta nota

No se agrega a `/legal`, al sitemap ni al pie. No declara conformidad con una norma. No reemplaza el texto que ya está publicado.
