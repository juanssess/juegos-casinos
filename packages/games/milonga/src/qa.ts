/**
 * Resultado del QA. Lo escribe `npm run qa -- --game milonga`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-22",
  "sourceHash": "b6cd089623d51f73",
  "rounds": 800000000,
  "targetRtp": 0.965,
  "rtp": 0.9645779430399074,
  "rtpCi": 0.0007779771800813588,
  "rtpBase": 0.5843820846138637,
  "rtpFeature": 0.38019585843750053,
  "hitFrequency": 0.4773494825,
  "triggerOneIn": 243.7194265403753,
  "freeSpinsPerTrigger": 8.022487686837596,
  "stdDev": 11.226794686610544,
  "volatilityIndex": 18.468077259474345,
  "volatilityLabel": "alta",
  "maxWinX": 10000,
  "maxObservedX": 10000,
  "buy": [
    {
      "variant": "simple",
      "label": "La Milonga",
      "priceX": 100.4,
      "ev": 96.9462479750002,
      "evCi": 0.1983520510983797,
      "rtp": 0.9656000794322729,
      "buys": 2000000
    },
    {
      "variant": "grande",
      "label": "Milonga larga",
      "priceX": 257.8,
      "ev": 248.60566494999978,
      "evCi": 0.33809390100377573,
      "rtp": 0.9643353954615972,
      "buys": 2000000
    },
    {
      "variant": "reserva",
      "label": "Tanda de lujo",
      "priceX": 172.5,
      "ev": 167.09772964999956,
      "evCi": 0.26147456450342876,
      "rtp": 0.9686824907246352,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.28,
    "rtp": 0.964621456250256,
    "rtpCi": 0.001231562149012479,
    "triggerOneIn": 114.91073016288884,
    "rounds": 400000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,46 % ± 0,08 contra el objetivo 96,50 % (tolerancia ±0,20)"
    },
    {
      "id": "rtp-precision",
      "level": "error",
      "ok": true,
      "msg": "precisión de la medición ±0,08 puntos (máximo ±0,15; si no alcanza, más rondas)"
    },
    {
      "id": "buy-simple",
      "level": "error",
      "ok": true,
      "msg": "compra \"La Milonga\" a 100,4×: EV 96,95× ± 0,2 → RTP 96,56 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-grande",
      "level": "error",
      "ok": true,
      "msg": "compra \"Milonga larga\" a 257,8×: EV 248,61× ± 0,34 → RTP 96,43 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-reserva",
      "level": "error",
      "ok": true,
      "msg": "compra \"Tanda de lujo\" a 172,5×: EV 167,1× ± 0,26 → RTP 96,87 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,28×: RTP 96,46 % ± 0,12, +0,00 puntos contra el juego normal (admitido de -0,50 a +1,00)"
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
      "ok": false,
      "msg": "frecuencia de premio 47,7 % (el mercado: 25 % a 35 %)"
    },
    {
      "id": "bonus",
      "level": "warn",
      "ok": true,
      "msg": "bonus 1 de cada 244 rondas (el mercado: de 150 a 400)"
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
