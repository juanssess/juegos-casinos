/**
 * Resultado del QA. Lo escribe `npm run qa -- --game kiosco`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-15",
  "sourceHash": "897e521178a3660d",
  "rounds": 800000000,
  "targetRtp": 0.965,
  "rtp": 0.9652048536770738,
  "rtpCi": 0.000921836370146931,
  "rtpBase": 0.570872247001224,
  "rtpFeature": 0.39433260662499986,
  "hitFrequency": 0.337964255,
  "triggerOneIn": 372.47918888931827,
  "freeSpinsPerTrigger": 10.794617768840347,
  "stdDev": 13.302790785209941,
  "volatilityIndex": 21.883090841670352,
  "volatilityLabel": "alta",
  "maxWinX": 10000,
  "maxObservedX": 10000,
  "buy": [
    {
      "variant": "simple",
      "label": "Vuelta al Kiosco",
      "priceX": 156.1,
      "ev": 150.69055464999968,
      "evCi": 0.2879569422081845,
      "rtp": 0.9653462821909012,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.31,
    "rtp": 0.9691905558238869,
    "rtpCi": 0.0014195858097936491,
    "triggerOneIn": 183.18037771793885,
    "rounds": 400000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,52 % ± 0,09 contra el objetivo 96,50 % (tolerancia ±0,20)"
    },
    {
      "id": "rtp-precision",
      "level": "error",
      "ok": true,
      "msg": "precisión de la medición ±0,09 puntos (máximo ±0,15; si no alcanza, más rondas)"
    },
    {
      "id": "buy-simple",
      "level": "error",
      "ok": true,
      "msg": "compra \"Vuelta al Kiosco\" a 156,1×: EV 150,69× ± 0,29 → RTP 96,53 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,31×: RTP 96,92 % ± 0,14, +0,40 puntos contra el juego normal (admitido de -0,50 a +1,00)"
    },
    {
      "id": "tope",
      "level": "error",
      "ok": true,
      "msg": "tope 10.000×: el mayor premio medido fue 10000× (tiene que llegar al 50 % del tope para no ser decorativo)"
    },
    {
      "id": "frecuencia",
      "level": "warn",
      "ok": true,
      "msg": "frecuencia de premio 33,8 % (el mercado: 25 % a 35 %)"
    },
    {
      "id": "bonus",
      "level": "warn",
      "ok": true,
      "msg": "bonus 1 de cada 372 rondas (el mercado: de 150 a 400)"
    },
    {
      "id": "tope-mercado",
      "level": "warn",
      "ok": true,
      "msg": "tope 10.000× (el mercado: 5.000× a 25.000×)"
    }
  ],
  "passed": true
};
