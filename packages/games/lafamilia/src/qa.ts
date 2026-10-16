/**
 * Resultado del QA. Lo escribe `npm run qa -- --game lafamilia`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-16",
  "sourceHash": "afec58e7a4025c5b",
  "rounds": 264884064,
  "targetRtp": 0.965,
  "rtp": 0.9646616036199037,
  "rtpCi": 0.001350032881298039,
  "rtpBase": 0.706878078934781,
  "rtpFeature": 0.2577835246819584,
  "hitFrequency": 0.2255312686534438,
  "triggerOneIn": 169.7963884846892,
  "freeSpinsPerTrigger": 11.56653290684034,
  "stdDev": 11.210273037485177,
  "volatilityIndex": 18.440899146663117,
  "volatilityLabel": "alta",
  "maxWinX": 5000,
  "maxObservedX": 5000,
  "buy": [
    {
      "variant": "simple",
      "label": "Guerra de familias",
      "priceX": 45.4,
      "ev": 43.80037802498994,
      "evCi": 0.18226157048178085,
      "rtp": 0.96476603579273,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.218,
    "rtp": 0.9693467549280189,
    "rtpCi": 0.0024430522653481625,
    "triggerOneIn": 86.26222335704969,
    "rounds": 100000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,47 % ± 0,14 contra el objetivo 96,50 % (tolerancia ±0,20)"
    },
    {
      "id": "rtp-precision",
      "level": "error",
      "ok": true,
      "msg": "precisión de la medición ±0,14 puntos (máximo ±0,15; si no alcanza, más rondas)"
    },
    {
      "id": "buy-simple",
      "level": "error",
      "ok": true,
      "msg": "compra \"Guerra de familias\" a 45,4×: EV 43,8× ± 0,18 → RTP 96,48 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,22×: RTP 96,93 % ± 0,24, +0,47 puntos contra el juego normal (admitido de -0,50 a +1,00)"
    },
    {
      "id": "tope",
      "level": "error",
      "ok": true,
      "msg": "tope 5.000×: el mayor premio medido fue 5000× (tiene que llegar al 50 % del tope para no ser decorativo)"
    },
    {
      "id": "frecuencia",
      "level": "warn",
      "ok": false,
      "msg": "frecuencia de premio 22,6 % (el mercado: 25 % a 35 %)"
    },
    {
      "id": "bonus",
      "level": "warn",
      "ok": true,
      "msg": "bonus 1 de cada 170 rondas (el mercado: de 150 a 400)"
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
