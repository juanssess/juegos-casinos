/**
 * Resultado del QA. Lo escribe `npm run qa -- --game asado`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-23",
  "sourceHash": "08552501ead44231",
  "rounds": 800000000,
  "targetRtp": 0.965,
  "rtp": 0.9639756555460226,
  "rtpCi": 0.0004539178718938295,
  "rtpBase": 0.6389136356506377,
  "rtpFeature": 0.32506201993749884,
  "hitFrequency": 0.3280666025,
  "triggerOneIn": 183.01711026963912,
  "freeSpinsPerTrigger": 11.500449993319876,
  "stdDev": 6.550375618732518,
  "volatilityIndex": 10.775367892814993,
  "volatilityLabel": "media",
  "maxWinX": 2500,
  "maxObservedX": 2500,
  "buy": [
    {
      "variant": "simple",
      "label": "Asado completo",
      "priceX": 65.3,
      "ev": 62.96658419999985,
      "evCi": 0.07901373266363984,
      "rtp": 0.9642662205206716,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.17,
    "rtp": 0.9687994136957946,
    "rtpCi": 0.0007536025182315358,
    "triggerOneIn": 90.64560062908046,
    "rounds": 400000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,40 % ± 0,05 contra el objetivo 96,50 % (tolerancia ±0,20)"
    },
    {
      "id": "rtp-precision",
      "level": "error",
      "ok": true,
      "msg": "precisión de la medición ±0,05 puntos (máximo ±0,15; si no alcanza, más rondas)"
    },
    {
      "id": "buy-simple",
      "level": "error",
      "ok": true,
      "msg": "compra \"Asado completo\" a 65,3×: EV 62,97× ± 0,08 → RTP 96,43 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,17×: RTP 96,88 % ± 0,08, +0,48 puntos contra el juego normal (admitido de -0,50 a +1,00)"
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
      "ok": true,
      "msg": "frecuencia de premio 32,8 % (el mercado: 25 % a 35 %)"
    },
    {
      "id": "bonus",
      "level": "warn",
      "ok": true,
      "msg": "bonus 1 de cada 183 rondas (el mercado: de 150 a 400)"
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
