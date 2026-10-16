/**
 * Resultado del QA. Lo escribe `npm run qa -- --game ruta40`; no editar a mano.
 */

import type { QaSummary } from '@casino/math';

export const QA: QaSummary | null = {
  "date": "2026-10-16",
  "sourceHash": "24b98a8b1ed39a8e",
  "rounds": 120000056,
  "targetRtp": 0.97,
  "rtp": 0.9699910879135132,
  "rtpCi": 0,
  "rtpBase": 0.9699999988079071,
  "rtpFeature": 0,
  "hitFrequency": 0.4851211319434718,
  "triggerOneIn": 0,
  "freeSpinsPerTrigger": 0,
  "stdDev": 0.9995571405084482,
  "volatilityIndex": 1.6442714961363973,
  "volatilityLabel": "baja",
  "maxWinX": 10000,
  "maxObservedX": 10000,
  "buy": [],
  "ante": null,
  "checks": [
    {
      "id": "rtp",
      "level": "error",
      "ok": true,
      "msg": "RTP exacto en las 11 configuraciones: la más lejos del objetivo es \"retiro en ×10000\" con 96,999 % (objetivo 97,00 %, tolerancia ±0,20)"
    },
    {
      "id": "motor",
      "level": "error",
      "ok": true,
      "msg": "el motor paga lo que dice la fórmula: la mayor diferencia es \"retiro en ×1.01\", 97,01 % simulado contra 97,000 % exacto (1.7 desvíos; máximo 4,5)"
    },
    {
      "id": "tope",
      "level": "warn",
      "ok": true,
      "msg": "premio máximo 10.000× (los originales del mercado: de 1.000× para arriba)"
    }
  ],
  "passed": true,
  "original": [
    {
      "label": "retiro en ×1.01",
      "exact": 0.9699999996926636,
      "sim": 0.9701029902093652,
      "simCi": 0.00011674567076295936,
      "n": 10909096
    },
    {
      "label": "retiro en ×1.2",
      "exact": 0.9699999991804361,
      "sim": 0.9699392873481621,
      "simCi": 0.00028032071700640127,
      "n": 10909096
    },
    {
      "label": "retiro en ×1.5",
      "exact": 0.9699999997392297,
      "sim": 0.9701582972594612,
      "simCi": 0.0004254573782895863,
      "n": 10909096
    },
    {
      "label": "retiro en ×2",
      "exact": 0.9699999988079071,
      "sim": 0.9702422638869436,
      "simCi": 0.0005931565295554375,
      "n": 10909096
    },
    {
      "label": "retiro en ×3",
      "exact": 0.9699999997392297,
      "sim": 0.9704896721048197,
      "simCi": 0.0008328231359671172,
      "n": 10909096
    },
    {
      "label": "retiro en ×5",
      "exact": 0.9699999960139394,
      "sim": 0.9700290473197779,
      "simCi": 0.0011732890489723196,
      "n": 10909096
    },
    {
      "label": "retiro en ×10",
      "exact": 0.9699999913573265,
      "sim": 0.9698814640553167,
      "simCi": 0.0017561748156027647,
      "n": 10909096
    },
    {
      "label": "retiro en ×25",
      "exact": 0.9699999820441008,
      "sim": 0.9697297557927806,
      "simCi": 0.002864615767278951,
      "n": 10909096
    },
    {
      "label": "retiro en ×100",
      "exact": 0.969999935477972,
      "sim": 0.9699428806933224,
      "simCi": 0.005815918127556098,
      "n": 10909096
    },
    {
      "label": "retiro en ×1000",
      "exact": 0.9699994698166847,
      "sim": 0.967541215147433,
      "simCi": 0.018449569039863764,
      "n": 10909096
    },
    {
      "label": "retiro en ×10000",
      "exact": 0.9699910879135132,
      "sim": 1.0165828589279993,
      "simCi": 0.05982889818880835,
      "n": 10909096
    }
  ]
};
