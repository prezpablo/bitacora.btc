# TODO legal (interno)

No se publica. Lo que salió de `/legal` en L-PRIV sigue abierto acá.

## Accesibilidad

Salió de `/legal` en A-11. No volver a publicar «Brechas en curso» ni «Plan:».

El globo 3D y el gráfico de velas no son usables con teclado ni lector. Algunos controles pueden fallar el tamaño mínimo de 24 px (2.5.8). Eso se mira en A-22, no como estado de la página.

Avisos aria-live en todos los campos: trabajo interno, no un plan publicado.

## Transferencias

No hay Cláusulas Contractuales Tipo ni evaluación de impacto documentada. Si hay titulares en el EEE, hay que cerrarlo antes de decir que la transferencia está cubierta. La casilla documenta el consentimiento (art. 23 A). No volver a escribir «brecha» en `/legal`.

## Repositorio

`https://github.com/prezpablo/bitacora.btc` no responde 200 a un clone anónimo (D-FOSS). Hasta ese 200, el código que sirve el sitio es el que se puede leer. No volver a escribir «clone anónimo» en `/legal`.

## Código CARGA

La política dice 30 días para el código y 7 días para el anuncio. El job `scripts/retain.mjs` (timer `bitacora-retain`) borra el anuncio vencido y deja vacíos los códigos viejos de comercio y de experiencia. Hay que tener el timer activo en el VPS.

Gmail no se borra desde el VPS. El borrado de la casilla lo hace Pablo a mano. No hay un plazo de logs distinto del que el job ya usa.

## Datos que Pablo completa

Nombre, domicilio, país del VPS, licencia de aportes, expediente e inscripción siguen en `src/domain/legal-config.ts`. Cuando dejen de estar entre corchetes, el aviso muestra nombre y domicilio (A4.1).
