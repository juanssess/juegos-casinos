/**
 * Resultado del QA. Lo escribe `npm run qa -- --game zonamuerta`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-16",
  "sourceHash": "9e523844b1311a10",
  "rounds": 200000000,
  "targetRtp": 0.965,
  "rtp": 0.9650278345024148,
  "rtpCi": 0.0009658991271783621,
  "rtpBase": 0.5433849152560931,
  "rtpFeature": 0.4216429192499998,
  "hitFrequency": 0.4640684,
  "triggerOneIn": 114.80469711937795,
  "freeSpinsPerTrigger": 8,
  "stdDev": 6.969324722142728,
  "volatilityIndex": 11.464539167924787,
  "volatilityLabel": "media-alta",
  "maxWinX": 5000,
  "maxObservedX": 4860.95,
  "buy": [
    {
      "variant": "simple",
      "label": "La cacería",
      "priceX": 54.7,
      "ev": 52.73871230000014,
      "evCi": 0.07041871837295485,
      "rtp": 0.964144648994518,
      "buys": 2000000
    },
    {
      "variant": "grande",
      "label": "Noche sin salida",
      "priceX": 94.5,
      "ev": 91.2126533750001,
      "evCi": 0.10744801946210784,
      "rtp": 0.9652132632275143,
      "buys": 2000000
    },
    {
      "variant": "reserva",
      "label": "Contagio avanzado",
      "priceX": 104,
      "ev": 100.12305334999989,
      "evCi": 0.12993142810604585,
      "rtp": 0.9627216668269221,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.59,
    "rtp": 0.9651028022070319,
    "rtpCi": 0.0013671668024974309,
    "triggerOneIn": 43.29982792648382,
    "rounds": 100000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,50 % ± 0,10 contra el objetivo 96,50 % (tolerancia ±0,20)"
    },
    {
      "id": "rtp-precision",
      "level": "error",
      "ok": true,
      "msg": "precisión de la medición ±0,10 puntos (máximo ±0,15; si no alcanza, más rondas)"
    },
    {
      "id": "buy-simple",
      "level": "error",
      "ok": true,
      "msg": "compra \"La cacería\" a 54,7×: EV 52,74× ± 0,07 → RTP 96,41 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-grande",
      "level": "error",
      "ok": true,
      "msg": "compra \"Noche sin salida\" a 94,5×: EV 91,21× ± 0,11 → RTP 96,52 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-reserva",
      "level": "error",
      "ok": true,
      "msg": "compra \"Contagio avanzado\" a 104×: EV 100,12× ± 0,13 → RTP 96,27 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,59×: RTP 96,51 % ± 0,14, +0,01 puntos contra el juego normal (admitido de -0,50 a +1,00)"
    },
    {
      "id": "tope",
      "level": "error",
      "ok": true,
      "msg": "tope 5.000×: el mayor premio medido fue 4861× (tiene que llegar al 50 % del tope para no ser decorativo)"
    },
    {
      "id": "frecuencia",
      "level": "warn",
      "ok": false,
      "msg": "frecuencia de premio 46,4 % (el mercado: 25 % a 35 %)"
    },
    {
      "id": "bonus",
      "level": "warn",
      "ok": false,
      "msg": "bonus 1 de cada 115 rondas (el mercado: de 150 a 400)"
    },
    {
      "id": "tope-mercado",
      "level": "warn",
      "ok": true,
      "msg": "tope 5.000× (el mercado: 5.000× a 25.000×)"
    }
  ],
  "passed": true
};
