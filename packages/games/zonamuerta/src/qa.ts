/**
 * Resultado del QA. Lo escribe `npm run qa -- --game zonamuerta`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-16",
  "sourceHash": "dcc410e0f6c4b937",
  "rounds": 200000000,
  "targetRtp": 0.965,
  "rtp": 0.9650132635066252,
  "rtpCi": 0.0011908899473036182,
  "rtpBase": 0.5269204895125812,
  "rtpFeature": 0.43809277400000773,
  "hitFrequency": 0.464044035,
  "triggerOneIn": 114.79006905196604,
  "freeSpinsPerTrigger": 8.022163092582208,
  "stdDev": 8.592717932502843,
  "volatilityIndex": 14.135020998967178,
  "volatilityLabel": "media-alta",
  "maxWinX": 5000,
  "maxObservedX": 5000,
  "buy": [
    {
      "variant": "simple",
      "label": "El búnker",
      "priceX": 56.6,
      "ev": 54.76193995000089,
      "evCi": 0.10216921684674699,
      "rtp": 0.9675254408127365,
      "buys": 2000000
    },
    {
      "variant": "grande",
      "label": "La azotea",
      "priceX": 138.6,
      "ev": 133.8097230499999,
      "evCi": 0.17371714063956678,
      "rtp": 0.9654381172438665,
      "buys": 2000000
    },
    {
      "variant": "reserva",
      "label": "El laboratorio",
      "priceX": 93.6,
      "ev": 90.5110746999985,
      "evCi": 0.1348280554599947,
      "rtp": 0.9669986613247704,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.63,
    "rtp": 0.9620700592115835,
    "rtpCi": 0.00166148169917747,
    "triggerOneIn": 43.33852239908192,
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
      "msg": "compra \"El búnker\" a 56,6×: EV 54,76× ± 0,1 → RTP 96,75 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-grande",
      "level": "error",
      "ok": true,
      "msg": "compra \"La azotea\" a 138,6×: EV 133,81× ± 0,17 → RTP 96,54 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-reserva",
      "level": "error",
      "ok": true,
      "msg": "compra \"El laboratorio\" a 93,6×: EV 90,51× ± 0,13 → RTP 96,70 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,63×: RTP 96,21 % ± 0,17, -0,29 puntos contra el juego normal (admitido de -0,50 a +1,00)"
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
