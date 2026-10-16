/**
 * Resultado del QA. Lo escribe `npm run qa -- --game lafamilia`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-16",
  "sourceHash": "0fec65911159918b",
  "rounds": 346793344,
  "targetRtp": 0.965,
  "rtp": 0.9658706353372226,
  "rtpCi": 0.0013577548517815362,
  "rtpBase": 0.7045272378411046,
  "rtpFeature": 0.261343397496118,
  "hitFrequency": 0.22583522537272227,
  "triggerOneIn": 169.88298227755337,
  "freeSpinsPerTrigger": 5.903241750866822,
  "stdDev": 12.900325506796717,
  "volatilityIndex": 21.2210354586806,
  "volatilityLabel": "alta",
  "maxWinX": 5000,
  "maxObservedX": 5000,
  "buy": [
    {
      "variant": "simple",
      "label": "El golpe al banco",
      "priceX": 46.2,
      "ev": 44.435829625,
      "evCi": 0.21396358150143605,
      "rtp": 0.9618144940476189,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.19,
    "rtp": 0.9630900168067227,
    "rtpCi": 0.002958643450389706,
    "triggerOneIn": 86.1334603514762,
    "rounds": 100000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,59 % ± 0,14 contra el objetivo 96,50 % (tolerancia ±0,20)"
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
      "msg": "compra \"El golpe al banco\" a 46,2×: EV 44,44× ± 0,21 → RTP 96,18 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,19×: RTP 96,31 % ± 0,30, -0,28 puntos contra el juego normal (admitido de -0,50 a +1,00)"
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
