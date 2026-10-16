/**
 * Resultado del QA. Lo escribe `npm run qa -- --game cataratas`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-16",
  "sourceHash": "5c6f493d7ece06f4",
  "rounds": 800000000,
  "targetRtp": 0.965,
  "rtp": 0.9679870101349981,
  "rtpCi": 0.0009841943476986185,
  "rtpBase": 0.5906439613732897,
  "rtpFeature": 0.3773430487500001,
  "hitFrequency": 0.32557713,
  "triggerOneIn": 325.615433520318,
  "freeSpinsPerTrigger": 13.64740447867748,
  "stdDev": 14.202663209452323,
  "volatilityIndex": 23.36338097954907,
  "volatilityLabel": "muy alta",
  "maxWinX": 10000,
  "maxObservedX": 10000,
  "buy": [
    {
      "variant": "simple",
      "label": "La Garganta del Diablo",
      "priceX": 130.3,
      "ev": 125.1411994250001,
      "evCi": 0.29014196359751465,
      "rtp": 0.9604082841519577,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.25,
    "rtp": 0.9669404535972493,
    "rtpCi": 0.001399725780346085,
    "triggerOneIn": 196.31314105442732,
    "rounds": 400000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": false,
      "msg": "RTP 96,80 % ± 0,10 contra el objetivo 96,50 % (tolerancia ±0,20)"
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
      "msg": "compra \"La Garganta del Diablo\" a 130,3×: EV 125,14× ± 0,29 → RTP 96,04 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,25×: RTP 96,69 % ± 0,14, -0,10 puntos contra el juego normal (admitido de -0,50 a +1,00)"
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
      "msg": "frecuencia de premio 32,6 % (el mercado: 25 % a 35 %)"
    },
    {
      "id": "bonus",
      "level": "warn",
      "ok": true,
      "msg": "bonus 1 de cada 326 rondas (el mercado: de 150 a 400)"
    },
    {
      "id": "tope-mercado",
      "level": "warn",
      "ok": true,
      "msg": "tope 10.000× (el mercado: 5.000× a 25.000×)"
    }
  ],
  "passed": false
};
