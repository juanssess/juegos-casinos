/**
 * Resultado del QA. Lo escribe `npm run qa -- --game hinchada`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-23",
  "sourceHash": "554e0fe81e3998d2",
  "rounds": 800000000,
  "targetRtp": 0.965,
  "rtp": 0.9659290403307391,
  "rtpCi": 0.0012188240562167267,
  "rtpBase": 0.39759251356569,
  "rtpFeature": 0.56833652675,
  "hitFrequency": 0.2796684925,
  "triggerOneIn": 386.4857526858344,
  "freeSpinsPerTrigger": 16.306515086954462,
  "stdDev": 17.588546024982474,
  "volatilityIndex": 28.93315821109617,
  "volatilityLabel": "muy alta",
  "maxWinX": 15000,
  "maxObservedX": 11007.85,
  "buy": [
    {
      "variant": "simple",
      "label": "El Clásico",
      "priceX": 230.8,
      "ev": 222.93780122500038,
      "evCi": 0.3607453023822275,
      "rtp": 0.9659350139731385,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.21,
    "rtp": 0.9656238068286344,
    "rtpCi": 0.0016020326560815946,
    "triggerOneIn": 302.1563387112126,
    "rounds": 400000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,59 % ± 0,12 contra el objetivo 96,50 % (tolerancia ±0,20)"
    },
    {
      "id": "rtp-precision",
      "level": "error",
      "ok": true,
      "msg": "precisión de la medición ±0,12 puntos (máximo ±0,15; si no alcanza, más rondas)"
    },
    {
      "id": "buy-simple",
      "level": "error",
      "ok": true,
      "msg": "compra \"El Clásico\" a 230,8×: EV 222,94× ± 0,36 → RTP 96,59 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,21×: RTP 96,56 % ± 0,16, -0,03 puntos contra el juego normal (admitido de -0,50 a +1,00)"
    },
    {
      "id": "tope",
      "level": "error",
      "ok": true,
      "msg": "tope 15.000×: el mayor premio medido fue 11008× (tiene que llegar al 50 % del tope para no ser decorativo)"
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
      "msg": "tope 15.000× (el mercado: 5.000× a 25.000×)"
    }
  ],
  "passed": true
};
