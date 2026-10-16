/**
 * Resultado del QA. Lo escribe `npm run qa -- --game dunas`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-16",
  "sourceHash": "57aa1e00521778f5",
  "rounds": 800000000,
  "targetRtp": 0.965,
  "rtp": 0.9659018995760058,
  "rtpCi": 0.0005773522677956342,
  "rtpBase": 0.6582222391752278,
  "rtpFeature": 0.3076796604166699,
  "hitFrequency": 0.2926146825,
  "triggerOneIn": 173.90858234506157,
  "freeSpinsPerTrigger": 8.08141117249601,
  "stdDev": 8.331626605953563,
  "volatilityIndex": 13.705525766793611,
  "volatilityLabel": "media-alta",
  "maxWinX": 5000,
  "maxObservedX": 5000,
  "buy": [
    {
      "variant": "simple",
      "label": "La Travesía",
      "priceX": 58.6,
      "ev": 56.600481499999766,
      "evCi": 0.12738883194580966,
      "rtp": 0.965878523890781,
      "buys": 2000000
    },
    {
      "variant": "larga",
      "label": "Travesía larga",
      "priceX": 166,
      "ev": 160.32447916666652,
      "evCi": 0.30250916561168917,
      "rtp": 0.9658101154618465,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.41,
    "rtp": 0.9691346513071488,
    "rtpCi": 0.0008613368995766087,
    "triggerOneIn": 76.8325032221631,
    "rounds": 400000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,59 % ± 0,06 contra el objetivo 96,50 % (tolerancia ±0,20)"
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
      "msg": "compra \"La Travesía\" a 58,6×: EV 56,6× ± 0,13 → RTP 96,59 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-larga",
      "level": "error",
      "ok": true,
      "msg": "compra \"Travesía larga\" a 166×: EV 160,32× ± 0,3 → RTP 96,58 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,41×: RTP 96,91 % ± 0,09, +0,32 puntos contra el juego normal (admitido de -0,50 a +1,00)"
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
      "msg": "frecuencia de premio 29,3 % (el mercado: 25 % a 35 %)"
    },
    {
      "id": "bonus",
      "level": "warn",
      "ok": true,
      "msg": "bonus 1 de cada 174 rondas (el mercado: de 150 a 400)"
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
