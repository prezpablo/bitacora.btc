# TODO legal (interno)

No se publica. Lo que salió de `/legal` en L-PRIV sigue abierto acá.

## Transferencias

No hay Cláusulas Contractuales Tipo ni evaluación de impacto documentada. Si hay titulares en el EEE, hay que cerrarlo antes de decir que la transferencia está cubierta. La casilla documenta el consentimiento (art. 23 A). No volver a escribir «brecha» en `/legal`.

## Repositorio

`https://github.com/prezpablo/bitacora.btc` no responde 200 a un clone anónimo (D-FOSS). Hasta ese 200, el código que sirve el sitio es el que se puede leer. No volver a escribir «clone anónimo» en `/legal`.

## Código CARGA

La política dice 30 días. El job `scripts/retain.mjs` (timer `bitacora-retain`) borra el token viejo y deja la ficha. Hay que tener el timer activo en el VPS.

## Datos que Pablo completa

Nombre, domicilio, país del VPS, licencia de aportes, expediente e inscripción siguen en `src/domain/legal-config.ts`. Cuando dejen de estar entre corchetes, el aviso muestra nombre y domicilio (A4.1).
