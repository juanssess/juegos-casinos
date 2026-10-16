/**
 * Resultado del QA. Lo escribe `npm run qa -- --game classic20`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-16",
  "sourceHash": "e0c664fe7f8b934d",
  "rounds": 800000000,
  "targetRtp": 0.965,
  "rtp": 0.9666453531052618,
  "rtpCi": 0.0006433906872936964,
  "rtpBase": 0.6093841745672354,
  "rtpFeature": 0.3572611785624723,
  "hitFrequency": 0.2972896125,
  "triggerOneIn": 209.24857789435248,
  "freeSpinsPerTrigger": 10.299090762616904,
  "stdDev": 9.284610570156044,
  "volatilityIndex": 15.273184387906692,
  "volatilityLabel": "media-alta",
  "maxWinX": null,
  "maxObservedX": 6978.5,
  "buy": [
    {
      "variant": "simple",
      "label": "La Escalinata",
      "priceX": 80,
      "ev": 77.46707372500057,
      "evCi": 0.147291601706947,
      "rtp": 0.9683384215625072,
      "buys": 2000000
    },
    {
      "variant": "dorada",
      "label": "Escalinata dorada",
      "priceX": 114,
      "ev": 109.77915135001798,
      "evCi": 0.17472975354201672,
      "rtp": 0.962975011842263,
      "buys": 2000000
    },
    {
      "variant": "cima",
      "label": "La Cima",
      "priceX": 292,
      "ev": 281.6558271999911,
      "evCi": 0.34788548743832887,
      "rtp": 0.9645747506849011,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.75,
    "rtp": 0.9678749745645535,
    "rtpCi": 0.0008889997832668162,
    "triggerOneIn": 68.86133479089825,
    "rounds": 400000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,66 % ± 0,06 contra el objetivo 96,50 % (tolerancia ±0,20)"
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
      "msg": "compra \"La Escalinata\" a 80×: EV 77,47× ± 0,15 → RTP 96,83 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-dorada",
      "level": "error",
      "ok": true,
      "msg": "compra \"Escalinata dorada\" a 114×: EV 109,78× ± 0,17 → RTP 96,30 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-cima",
      "level": "error",
      "ok": true,
      "msg": "compra \"La Cima\" a 292×: EV 281,66× ± 0,35 → RTP 96,46 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,75×: RTP 96,79 % ± 0,09, +0,12 puntos contra el juego normal (admitido de -0,50 a +1,00)"
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
