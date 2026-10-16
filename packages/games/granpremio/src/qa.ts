/**
 * Resultado del QA. Lo escribe `npm run qa -- --game granpremio`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-16",
  "sourceHash": "b0517a9ca3d1bb64",
  "rounds": 800000000,
  "targetRtp": 0.965,
  "rtp": 0.9664008658795401,
  "rtpCi": 0.0007996774960091205,
  "rtpBase": 0.6192235265569854,
  "rtpFeature": 0.34717733931250094,
  "hitFrequency": 0.32388086875,
  "triggerOneIn": 228.77301027533974,
  "freeSpinsPerTrigger": 14.285200731158541,
  "stdDev": 11.53994653449648,
  "volatilityIndex": 18.98321204924671,
  "volatilityLabel": "alta",
  "maxWinX": 5000,
  "maxObservedX": 5000,
  "buy": [
    {
      "variant": "simple",
      "label": "La Largada",
      "priceX": 84.8,
      "ev": 81.75011829999981,
      "evCi": 0.19403789407781266,
      "rtp": 0.9640344139150921,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.19,
    "rtp": 0.9664555266745081,
    "rtpCi": 0.0011239320726210268,
    "triggerOneIn": 151.71208989851598,
    "rounds": 400000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,64 % ± 0,08 contra el objetivo 96,50 % (tolerancia ±0,20)"
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
      "msg": "compra \"La Largada\" a 84,8×: EV 81,75× ± 0,19 → RTP 96,40 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,19×: RTP 96,65 % ± 0,11, +0,01 puntos contra el juego normal (admitido de -0,50 a +1,00)"
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
      "ok": true,
      "msg": "frecuencia de premio 32,4 % (el mercado: 25 % a 35 %)"
    },
    {
      "id": "bonus",
      "level": "warn",
      "ok": true,
      "msg": "bonus 1 de cada 229 rondas (el mercado: de 150 a 400)"
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
