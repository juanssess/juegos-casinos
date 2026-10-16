/**
 * Resultado del QA. Lo escribe `npm run qa -- --game feria`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-15",
  "sourceHash": "c5485dcdefaa871b",
  "rounds": 800000000,
  "targetRtp": 0.965,
  "rtp": 0.965289465625,
  "rtpCi": 0.0008853344689224879,
  "rtpBase": 0.7042706665625,
  "rtpFeature": 0.2610187990625,
  "hitFrequency": 0.2257934875,
  "triggerOneIn": 169.81215379547146,
  "freeSpinsPerTrigger": 5.904078845481129,
  "stdDev": 12.776040950883305,
  "volatilityIndex": 21.016587364203037,
  "volatilityLabel": "alta",
  "maxWinX": 5000,
  "maxObservedX": 5000,
  "buy": [
    {
      "variant": "simple",
      "label": "Hold & Win",
      "priceX": 46.2,
      "ev": 44.477707875,
      "evCi": 0.21453320537035941,
      "rtp": 0.9627209496753246,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.19,
    "rtp": 0.9628835351890757,
    "rtpCi": 0.0014699126858367855,
    "triggerOneIn": 86.16175447734172,
    "rounds": 400000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,53 % ± 0,09 contra el objetivo 96,50 % (tolerancia ±0,20)"
    },
    {
      "id": "rtp-precision",
      "level": "error",
      "ok": true,
      "msg": "precisión de la medición ±0,09 puntos (máximo ±0,15; si no alcanza, más rondas)"
    },
    {
      "id": "buy-simple",
      "level": "error",
      "ok": true,
      "msg": "compra \"Hold & Win\" a 46,2×: EV 44,48× ± 0,21 → RTP 96,27 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,19×: RTP 96,29 % ± 0,15, -0,24 puntos contra el juego normal (admitido de -0,50 a +1,00)"
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
