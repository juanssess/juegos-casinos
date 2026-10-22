/**
 * Resultado del QA. Lo escribe `npm run qa -- --game glaciar`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-16",
  "sourceHash": "83b8e72c6f17e4f1",
  "rounds": 800000000,
  "targetRtp": 0.965,
  "rtp": 0.9633776397477354,
  "rtpCi": 0.0005941185324946504,
  "rtpBase": 0.6725502951954885,
  "rtpFeature": 0.2908273445624999,
  "hitFrequency": 0.22583967875,
  "triggerOneIn": 112.46278887473107,
  "freeSpinsPerTrigger": 5.877704730072438,
  "stdDev": 8.573576390929949,
  "volatilityIndex": 14.103533163079765,
  "volatilityLabel": "media-alta",
  "maxWinX": 2500,
  "maxObservedX": 2500,
  "buy": [
    {
      "variant": "simple",
      "label": "Hold & Win",
      "priceX": 34.1,
      "ev": 32.955911324999974,
      "evCi": 0.11011328031940262,
      "rtp": 0.9664490124633424,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.11,
    "rtp": 0.9679695523705972,
    "rtpCi": 0.0009297018171018014,
    "triggerOneIn": 72.27715687684623,
    "rounds": 400000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,34 % ± 0,06 contra el objetivo 96,50 % (tolerancia ±0,20)"
    },
    {
      "id": "rtp-precision",
      "level": "error",
      "ok": true,
      "msg": "precisión de la medición ±0,06 puntos (máximo ±0,15; si no alcanza, más rondas)"
    },
    {
      "id": "buy-simple",
      "level": "error",
      "ok": true,
      "msg": "compra \"Hold & Win\" a 34,1×: EV 32,96× ± 0,11 → RTP 96,64 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,11×: RTP 96,80 % ± 0,09, +0,46 puntos contra el juego normal (admitido de -0,50 a +1,00)"
    },
    {
      "id": "tope",
      "level": "error",
      "ok": true,
      "msg": "tope 2.500×: el mayor premio medido fue 2500× (tiene que llegar al 50 % del tope para no ser decorativo)"
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
      "ok": false,
      "msg": "bonus 1 de cada 112 rondas (el mercado: de 150 a 400)"
    },
    {
      "id": "tope-mercado",
      "level": "warn",
      "ok": false,
      "msg": "tope 2.500× (el mercado: 5.000× a 25.000×)"
    }
  ],
  "passed": true
};
