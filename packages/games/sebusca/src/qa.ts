/**
 * Resultado del QA. Lo escribe `npm run qa -- --game sebusca`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-16",
  "sourceHash": "7beea30e144f9dc2",
  "rounds": 2703285120,
  "targetRtp": 0.965,
  "rtp": 0.9659237039876013,
  "rtpCi": 0.001357473344556722,
  "rtpBase": 0.41285034244138086,
  "rtpFeature": 0.5530733615944071,
  "hitFrequency": 0.3275800249290759,
  "triggerOneIn": 258.08562670051947,
  "freeSpinsPerTrigger": 8.068343661238721,
  "stdDev": 36.00983787612551,
  "volatilityIndex": 59.236183306226465,
  "volatilityLabel": "muy alta",
  "maxWinX": 10000,
  "maxObservedX": 10000,
  "buy": [
    {
      "variant": "simple",
      "label": "La Cacería",
      "priceX": 151,
      "ev": 145.89806513333758,
      "evCi": 0.775290280707172,
      "rtp": 0.9662123518764079,
      "buys": 2000000
    },
    {
      "variant": "larga",
      "label": "Cacería larga",
      "priceX": 472,
      "ev": 456.7637099333287,
      "evCi": 1.5667244695573135,
      "rtp": 0.9677197244350184,
      "buys": 2000000
    },
    {
      "variant": "completa",
      "label": "Cacería completa",
      "priceX": 1048,
      "ev": 1014.6825915333327,
      "evCi": 2.47941666970399,
      "rtp": 0.9682085797073785,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.8,
    "rtp": 0.9712997685016806,
    "rtpCi": 0.003039879350234951,
    "triggerOneIn": 107.74059619875015,
    "rounds": 400000000
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
      "msg": "compra \"La Cacería\" a 151×: EV 145,9× ± 0,78 → RTP 96,62 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-larga",
      "level": "error",
      "ok": true,
      "msg": "compra \"Cacería larga\" a 472×: EV 456,76× ± 1,57 → RTP 96,77 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-completa",
      "level": "error",
      "ok": true,
      "msg": "compra \"Cacería completa\" a 1.048×: EV 1.014,68× ± 2,48 → RTP 96,82 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,8×: RTP 97,13 % ± 0,30, +0,54 puntos contra el juego normal (admitido de -0,50 a +1,00)"
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
  "passed": true
};
