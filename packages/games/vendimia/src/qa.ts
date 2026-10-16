/**
 * Resultado del QA. Lo escribe `npm run qa -- --game vendimia`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-16",
  "sourceHash": "dceab781bd3d0a5e",
  "rounds": 200000000,
  "targetRtp": 0.965,
  "rtp": 0.9650488860104178,
  "rtpCi": 0.0011928177224285672,
  "rtpBase": 0.5268682902488132,
  "rtpFeature": 0.43818059574999785,
  "hitFrequency": 0.46399846,
  "triggerOneIn": 114.79481288158513,
  "freeSpinsPerTrigger": 8.022468214751248,
  "stdDev": 8.606627553558498,
  "volatilityIndex": 14.157902325603729,
  "volatilityLabel": "media-alta",
  "maxWinX": 5000,
  "maxObservedX": 5000,
  "buy": [
    {
      "variant": "simple",
      "label": "La Cosecha",
      "priceX": 56.6,
      "ev": 54.687825649999915,
      "evCi": 0.10237065976787262,
      "rtp": 0.9662160008833907,
      "buys": 2000000
    },
    {
      "variant": "grande",
      "label": "Cosecha grande",
      "priceX": 138.6,
      "ev": 133.7796399250006,
      "evCi": 0.17317961044197497,
      "rtp": 0.9652210672799466,
      "buys": 2000000
    },
    {
      "variant": "reserva",
      "label": "Reserva",
      "priceX": 93.6,
      "ev": 90.50358502500207,
      "evCi": 0.13490591574113758,
      "rtp": 0.9669186434295093,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.63,
    "rtp": 0.9635263398787399,
    "rtpCi": 0.001669983007382738,
    "triggerOneIn": 43.3106674173849,
    "rounds": 100000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,50 % ± 0,12 contra el objetivo 96,50 % (tolerancia ±0,20)"
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
      "msg": "compra \"La Cosecha\" a 56,6×: EV 54,69× ± 0,1 → RTP 96,62 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-grande",
      "level": "error",
      "ok": true,
      "msg": "compra \"Cosecha grande\" a 138,6×: EV 133,78× ± 0,17 → RTP 96,52 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-reserva",
      "level": "error",
      "ok": true,
      "msg": "compra \"Reserva\" a 93,6×: EV 90,5× ± 0,13 → RTP 96,69 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,63×: RTP 96,35 % ± 0,17, -0,15 puntos contra el juego normal (admitido de -0,50 a +1,00)"
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
      "msg": "frecuencia de premio 46,4 % (el mercado: 25 % a 35 %)"
    },
    {
      "id": "bonus",
      "level": "warn",
      "ok": false,
      "msg": "bonus 1 de cada 115 rondas (el mercado: de 150 a 400)"
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
