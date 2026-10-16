/**
 * Resultado del QA. Lo escribe `npm run qa -- --game cataratas`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-16",
  "sourceHash": "6235398aca02d9ee",
  "rounds": 433759696,
  "targetRtp": 0.965,
  "rtp": 0.9647256666721331,
  "rtpCi": 0.0013424951523615927,
  "rtpBase": 0.5902573979541306,
  "rtpFeature": 0.37446826871623434,
  "hitFrequency": 0.32557732611468815,
  "triggerOneIn": 325.6730458364711,
  "freeSpinsPerTrigger": 13.644782177467008,
  "stdDev": 14.26531128043895,
  "volatilityIndex": 23.466437056322075,
  "volatilityLabel": "muy alta",
  "maxWinX": 10000,
  "maxObservedX": 10000,
  "buy": [
    {
      "variant": "simple",
      "label": "La Garganta del Diablo",
      "priceX": 129.2,
      "ev": 124.83587610000005,
      "evCi": 0.2923257006793255,
      "rtp": 0.9662219512383906,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.25,
    "rtp": 0.9632047040100182,
    "rtpCi": 0.0014110744682670222,
    "triggerOneIn": 196.1467942993857,
    "rounds": 400000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,47 % ± 0,13 contra el objetivo 96,50 % (tolerancia ±0,20)"
    },
    {
      "id": "rtp-precision",
      "level": "error",
      "ok": true,
      "msg": "precisión de la medición ±0,13 puntos (máximo ±0,15; si no alcanza, más rondas)"
    },
    {
      "id": "buy-simple",
      "level": "error",
      "ok": true,
      "msg": "compra \"La Garganta del Diablo\" a 129,2×: EV 124,84× ± 0,29 → RTP 96,62 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,25×: RTP 96,32 % ± 0,14, -0,15 puntos contra el juego normal (admitido de -0,50 a +1,00)"
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
  "passed": true
};
