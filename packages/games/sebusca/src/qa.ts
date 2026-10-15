/**
 * Resultado del QA. Lo escribe `npm run qa -- --game sebusca`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-15",
  "sourceHash": "bd4ecdbf26420947",
  "rounds": 3200000000,
  "targetRtp": 0.965,
  "rtp": 0.9662331045942184,
  "rtpCi": 0.0012448028239861683,
  "rtpBase": 0.4135281171815496,
  "rtpFeature": 0.5527049871665446,
  "hitFrequency": 0.327593781875,
  "triggerOneIn": 258.1406676259819,
  "freeSpinsPerTrigger": 8.068225852432919,
  "stdDev": 35.92687828901159,
  "volatilityIndex": 59.09971478542407,
  "volatilityLabel": "muy alta",
  "maxWinX": 10000,
  "maxObservedX": 10000,
  "buy": [
    {
      "variant": "simple",
      "label": "La Cacería",
      "priceX": 151,
      "ev": 146.05085930000428,
      "evCi": 0.7757523706787123,
      "rtp": 0.9672242337748628,
      "buys": 2000000
    },
    {
      "variant": "larga",
      "label": "Cacería larga",
      "priceX": 472,
      "ev": 457.226438566662,
      "evCi": 1.5676351048135129,
      "rtp": 0.9687000817090297,
      "buys": 2000000
    },
    {
      "variant": "completa",
      "label": "Cacería completa",
      "priceX": 1048,
      "ev": 1015.6543359666655,
      "evCi": 2.4807062736527152,
      "rtp": 0.9691358167620854,
      "buys": 2000000
    }
  ],
  "ante": {
    "costX": 1.8,
    "rtp": 0.9724118514645507,
    "rtpCi": 0.0030417832227079816,
    "triggerOneIn": 107.74062521884815,
    "rounds": 400000000
  },
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP 96,62 % ± 0,12 contra el objetivo 96,50 % (tolerancia ±0,20)"
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
      "msg": "compra \"La Cacería\" a 151×: EV 146,05× ± 0,78 → RTP 96,72 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-larga",
      "level": "error",
      "ok": true,
      "msg": "compra \"Cacería larga\" a 472×: EV 457,23× ± 1,57 → RTP 96,87 % (tolerancia ±0,50)"
    },
    {
      "id": "buy-completa",
      "level": "error",
      "ok": true,
      "msg": "compra \"Cacería completa\" a 1.048×: EV 1.015,65× ± 2,48 → RTP 96,91 % (tolerancia ±0,50)"
    },
    {
      "id": "ante",
      "level": "error",
      "ok": true,
      "msg": "ante a 1,8×: RTP 97,24 % ± 0,30, +0,62 puntos contra el juego normal (admitido de -0,50 a +1,00)"
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
