/**
 * Resultado del QA. Lo escribe `npm run qa -- --game kermes`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-16",
  "sourceHash": "5b3ad58cf9e8a2dc",
  "rounds": 120000006,
  "targetRtp": 0.97,
  "rtp": 0.9696875,
  "rtpCi": 0,
  "rtpBase": 0.9706201171875,
  "rtpFeature": 0,
  "hitFrequency": 1,
  "triggerOneIn": 0,
  "freeSpinsPerTrigger": 0,
  "stdDev": 1.4823896528334317,
  "volatilityIndex": 2.438530978910995,
  "volatilityLabel": "baja",
  "maxWinX": 1000,
  "maxObservedX": 1000,
  "buy": [],
  "ante": null,
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP exacto en las 9 configuraciones: la más lejos del objetivo es \"8 filas, riesgo alto\" con 97,063 % (objetivo 97,00 %, tolerancia ±0,20)"
    },
    {
      "id": "motor",
      "level": "error",
      "ok": true,
      "msg": "el motor paga lo que dice la fórmula: la mayor diferencia es \"16 filas, riesgo alto\", 97,46 % simulado contra 97,050 % exacto (2.0 desvíos; máximo 4,5)"
    },
    {
      "id": "tope",
      "level": "warn",
      "ok": true,
      "msg": "premio máximo 1.000× (los originales del mercado: de 1.000× para arriba)"
    }
  ],
  "passed": true,
  "original": [
    {
      "label": "8 filas, riesgo bajo",
      "exact": 0.969921875,
      "sim": 0.9698355355016446,
      "simCi": 0.00036799717489457507,
      "n": 13333334
    },
    {
      "label": "8 filas, riesgo medio",
      "exact": 0.9696875,
      "sim": 0.9695641120233781,
      "simCi": 0.0007058029689858074,
      "n": 13333334
    },
    {
      "label": "8 filas, riesgo alto",
      "exact": 0.9706250000000001,
      "sim": 0.9704714402130601,
      "simCi": 0.0014573927847803102,
      "n": 13333334
    },
    {
      "label": "12 filas, riesgo bajo",
      "exact": 0.9699609375,
      "sim": 0.9699115884925736,
      "simCi": 0.0003648862330746532,
      "n": 13333334
    },
    {
      "label": "12 filas, riesgo medio",
      "exact": 0.9706201171875,
      "sim": 0.9700637477409078,
      "simCi": 0.0007956994669392536,
      "n": 13333334
    },
    {
      "label": "12 filas, riesgo alto",
      "exact": 0.9698144531249999,
      "sim": 0.9714062964310197,
      "simCi": 0.002428002982418272,
      "n": 13333334
    },
    {
      "label": "16 filas, riesgo bajo",
      "exact": 0.9701287841796875,
      "sim": 0.9701667527411278,
      "simCi": 0.0003545098945117485,
      "n": 13333334
    },
    {
      "label": "16 filas, riesgo medio",
      "exact": 0.9699835205078124,
      "sim": 0.9698562227661424,
      "simCi": 0.0009626416311779399,
      "n": 13333334
    },
    {
      "label": "16 filas, riesgo alto",
      "exact": 0.9705041503906251,
      "sim": 0.9745598730215737,
      "simCi": 0.004021869593059009,
      "n": 13333334
    }
  ]
};
