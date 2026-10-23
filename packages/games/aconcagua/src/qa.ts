/**
 * Resultado del QA. Lo escribe `npm run qa -- --game aconcagua`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-23",
  "sourceHash": "08dabc985bb523aa",
  "rounds": 800000000,
  "targetRtp": 0.965,
  "rtp": 0.9643907184375,
  "rtpCi": 0.0002804891492871329,
  "rtpBase": 0.8162450484375,
  "rtpFeature": 0.14814567,
  "hitFrequency": 0.29729172625,
  "triggerOneIn": 209.29510976743651,
  "freeSpinsPerTrigger": 10.690620753598436,
  "stdDev": 4.047668969595461,
  "volatilityIndex": 6.6584154549845325,
  "volatilityLabel": "media",
  "maxWinX": null,
  "maxObservedX": 1281,
  "buy": [
    {
      "variant": "simple",
      "label": "El Ascenso",
      "priceX": 34.9,
      "ev": 33.642461125,
      "evCi": 0.04884908411734488,
      "rtp": 0.96396736747851,
      "buys": 2000000
    },
    {
      "variant": "dorada",
      "label": "Campamento alto",
      "priceX": 50.1,
      "ev": 48.432503375,
      "evCi": 0.05888698826987434,
      "rtp": 0.966716634231537,
      "buys": 2000000
    },
    {
      "variant": "cima",
      "label": "La Cumbre",
      "priceX": 102.9,
      "ev": 99.49853325,
      "evCi": 0.09585345158548193,
      "rtp": 0.9669439577259474,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.14,
    "rtp": 0.9695966683114037,
    "rtpCi": 0.00045291794952802923,
    "triggerOneIn": 104.14334289716366,
    "rounds": 400000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,44 % ± 0,03 contra el objetivo 96,50 % (tolerancia ±0,20)"
    },
    {
      "id": "rtp-precision",
      "level": "error",
      "ok": true,
      "msg": "precisión de la medición ±0,03 puntos (máximo ±0,15; si no alcanza, más rondas)"
    },
    {
      "id": "buy-simple",
      "level": "error",
      "ok": true,
      "msg": "compra \"El Ascenso\" a 34,9×: EV 33,64× ± 0,05 → RTP 96,40 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-dorada",
      "level": "error",
      "ok": true,
      "msg": "compra \"Campamento alto\" a 50,1×: EV 48,43× ± 0,06 → RTP 96,67 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-cima",
      "level": "error",
      "ok": true,
      "msg": "compra \"La Cumbre\" a 102,9×: EV 99,5× ± 0,1 → RTP 96,69 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,14×: RTP 96,96 % ± 0,05, +0,52 puntos contra el juego normal (admitido de -0,50 a +1,00)"
    },
    {
      "id": "frecuencia",
      "level": "warn",
      "ok": true,
      "msg": "frecuencia de premio 29,7 % (el mercado: 25 % a 35 %)"
    },
    {
      "id": "bonus",
      "level": "warn",
      "ok": true,
      "msg": "bonus 1 de cada 209 rondas (el mercado: de 150 a 400)"
    }
  ],
  "passed": true
};
