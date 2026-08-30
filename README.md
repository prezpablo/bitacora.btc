# bitacora.btc

El nodo que te une al mundo Bitcoin.

Desk de un gráfico: velas estilo Binance, EMAs (1D / 1S / 1M / 6M), mapa de liquidaciones (promedio de 10 exchanges), mapa de comercios y comunidades, pulso de noticias y la historia de Bitcoin.

Una iniciativa de Consciencia Bitcoin By LCM.

## Stack

- Vite + TanStack Start / Router / Query
- React 19 + TypeScript
- Leaflet + BTC Map (comercios)
- Feeds públicos: Binance, OKX, GeoJS, Nominatim, Polymarket, Alternative.me

## Correr en local

```bash
npm install
npm run dev
```

Abre `http://localhost:8080`.

```bash
npm run typecheck
npm run build
```

## Mapa

Al cargar, centra la ciudad por IP (GeoJS). El botón naranja pide GPS del navegador y ajusta el recuadro de la ciudad con Nominatim.

## Licencia

Código abierto para la comunidad Bitcoin.
