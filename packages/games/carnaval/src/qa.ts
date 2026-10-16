/**
 * Resultado del QA. Lo escribe `npm run qa -- --game carnaval`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-16",
  "sourceHash": "f64dbecb2e58dc66",
  "rounds": 800000000,
  "targetRtp": 0.965,
  "rtp": 0.9648857938243761,
  "rtpCi": 0.0008470047695660214,
  "rtpBase": 0.5429032156401823,
  "rtpFeature": 0.42198257818750096,
  "hitFrequency": 0.27966858375,
  "triggerOneIn": 386.47455016777826,
  "freeSpinsPerTrigger": 16.37728418536479,
  "stdDev": 12.222914617499649,
  "volatilityIndex": 20.106694545786922,
  "volatilityLabel": "alta",
  "maxWinX": 10000,
  "maxObservedX": 5899.3,
  "buy": [
    {
      "variant": "simple",
      "label": "Noche de Comparsas",
      "priceX": 172.5,
      "ev": 166.49279854999983,
      "evCi": 0.2296831491918497,
      "rtp": 0.9651756437681149,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.24,
    "rtp": 0.9718473571713884,
    "rtpCi": 0.0010964219097518294,
    "triggerOneIn": 302.15519748486014,
    "rounds": 400000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,49 % ± 0,08 contra el objetivo 96,50 % (tolerancia ±0,20)"
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
      "msg": "compra \"Noche de Comparsas\" a 172,5×: EV 166,49× ± 0,23 → RTP 96,52 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,24×: RTP 97,18 % ± 0,11, +0,70 puntos contra el juego normal (admitido de -0,50 a +1,00)"
    },
    {
      "id": "tope",
      "level": "error",
      "ok": true,
      "msg": "tope 10.000×: el mayor premio medido fue 5899× (tiene que llegar al 50 % del tope para no ser decorativo)"
    },
    {
      "id": "frecuencia",
      "level": "warn",
      "ok": true,
      "msg": "frecuencia de premio 28,0 % (el mercado: 25 % a 35 %)"
    },
    {
      "id": "bonus",
      "level": "warn",
      "ok": true,
      "msg": "bonus 1 de cada 386 rondas (el mercado: de 150 a 400)"
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
