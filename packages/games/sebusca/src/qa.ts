/**
 * Resultado del QA. Lo escribe `npm run qa -- --game sebusca`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-15",
  "sourceHash": "95dfdad4e772541a",
  "rounds": 3200000000,
  "targetRtp": 0.965,
  "rtp": 0.961142729529464,
  "rtpCi": 0.0012388101412604312,
  "rtpBase": 0.4113707782846775,
  "rtpFeature": 0.5497719509998756,
  "hitFrequency": 0.3275937465625,
  "triggerOneIn": 258.14041773895775,
  "freeSpinsPerTrigger": 8.068247970330631,
  "stdDev": 35.75392046889452,
  "volatilityIndex": 58.815199171331486,
  "volatilityLabel": "muy alta",
  "maxWinX": 10000,
  "maxObservedX": 10000,
  "buy": [
    {
      "variant": "simple",
      "label": "La Cacería",
      "priceX": 151,
      "ev": 145.2874347333376,
      "evCi": 0.7720226825534116,
      "rtp": 0.9621684419426331,
      "buys": 2000000
    },
    {
      "variant": "larga",
      "label": "Cacería larga",
      "priceX": 472,
      "ev": 454.87071876666255,
      "evCi": 1.5610930489734987,
      "rtp": 0.9637091499293698,
      "buys": 2000000
    },
    {
      "variant": "completa",
      "label": "Cacería completa",
      "priceX": 1048,
      "ev": 1010.6309872999988,
      "evCi": 2.4714879062269497,
      "rtp": 0.9643425451335866,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.8,
    "rtp": 0.9673504916506106,
    "rtpCi": 0.003027538597035269,
    "triggerOneIn": 107.7405671786678,
    "rounds": 400000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": false,
      "msg": "RTP 96,11 % ± 0,12 contra el objetivo 96,50 % (tolerancia ±0,20)"
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
      "msg": "compra \"La Cacería\" a 151×: EV 145,29× ± 0,77 → RTP 96,22 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-larga",
      "level": "error",
      "ok": true,
      "msg": "compra \"Cacería larga\" a 472×: EV 454,87× ± 1,56 → RTP 96,37 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-completa",
      "level": "error",
      "ok": true,
      "msg": "compra \"Cacería completa\" a 1.048×: EV 1.010,63× ± 2,47 → RTP 96,43 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,8×: RTP 96,74 % ± 0,30, +0,62 puntos contra el juego normal (admitido de -0,50 a +1,00)"
    },
    {
      "id": "tope",
      "level": "error",
      "ok": true,
      "msg": "tope 10.000×: el mayor premio medido fue 10000× (tiene que llegar al 50 % del tope para no ser decorativo)"
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
      "msg": "bonus 1 de cada 258 rondas (el mercado: de 150 a 400)"
    },
    {
      "id": "tope-mercado",
      "level": "warn",
      "ok": true,
      "msg": "tope 10.000× (el mercado: 5.000× a 25.000×)"
    }
  ],
  "passed": false
};
