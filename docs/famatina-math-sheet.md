# famatina (Famatina) — Math Sheet

El Mines de la casa, en la vieja mina de oro de La Rioja. Un frente de 5×5
rocas: debajo de cada una hay una pepita de oro o una carga de dinamita. El
jugador elige cuántas cargas hay (de 1 a 24) y destapa rocas de a una; cada
pepita sube el multiplicador y puede cobrar cuando quiera. La dinamita se
lleva la apuesta.

<!-- qa:inicio -->
## QA automático — APROBADO

Generado por `npm run qa -- --game famatina` el 2026-10-16. No editar a mano: se reescribe en cada corrida.
Huella de la matemática: `819db7d7b0a60992`.

| | |
|---|---|
| RTP exacto | **97,000 % a 97,000 %** en las 256 configuraciones (objetivo 97,00 %) |
| Motor simulado | 120M de jugadas en total |
| Volatilidad | baja (índice 1,1, en la configuración típica) |
| Tope | 10.000× |

| Configuración | RTP exacto | Motor (simulado) |
|---|---|---|
| 1 minas, 1 casillas | 97,000 % | 96,97 % ± 0,06 |
| 1 minas, 8 casillas | 97,000 % | 96,90 % ± 0,19 |
| 1 minas, 15 casillas | 97,000 % | 96,96 % ± 0,34 |
| 1 minas, 22 casillas | 97,000 % | 96,93 % ± 0,75 |
| 2 minas, 5 casillas | 97,000 % | 96,83 % ± 0,21 |
| 2 minas, 12 casillas | 97,000 % | 96,69 % ± 0,47 |
| 2 minas, 19 casillas | 97,000 % | 96,56 % ± 1,21 |
| 3 minas, 3 casillas | 97,000 % | 97,04 % ± 0,20 |
| 3 minas, 10 casillas | 97,000 % | 96,83 % ± 0,56 |
| 3 minas, 17 casillas | 97,000 % | 96,58 % ± 1,75 |
| 4 minas, 2 casillas | 97,000 % | 96,77 % ± 0,18 |
| 4 minas, 9 casillas | 97,000 % | 96,62 % ± 0,68 |
| 4 minas, 16 casillas | 97,000 % | 94,38 % ± 2,73 |
| 5 minas, 3 casillas | 97,000 % | 96,86 % ± 0,28 |
| 5 minas, 10 casillas | 97,000 % | 97,20 % ± 1,14 |
| 5 minas, 17 casillas | 97,000 % | 94,43 % ± 8,44 |
| 6 minas, 5 casillas | 97,000 % | 97,08 % ± 0,52 |
| 6 minas, 12 casillas | 97,000 % | 98,58 % ± 2,83 |
| 7 minas, 2 casillas | 97,000 % | 97,14 % ± 0,27 |
| 7 minas, 9 casillas | 97,000 % | 99,46 % ± 1,80 |
| 8 minas, 1 casillas | 97,000 % | 96,93 % ± 0,19 |
| 8 minas, 8 casillas | 97,000 % | 97,00 % ± 1,83 |
| 9 minas, 1 casillas | 97,000 % | 97,05 % ± 0,21 |
| 9 minas, 8 casillas | 97,000 % | 98,90 % ± 2,55 |
| 10 minas, 2 casillas | 97,000 % | 97,20 % ± 0,38 |
| 10 minas, 9 casillas | 97,000 % | 97,22 % ± 5,61 |
| 11 minas, 5 casillas | 97,000 % | 95,40 % ± 1,39 |
| 12 minas, 2 casillas | 97,000 % | 96,66 % ± 0,47 |
| 12 minas, 9 casillas | 97,000 % | 112,93 % ± 16,01 |
| 13 minas, 7 casillas | 97,000 % | 94,70 % ± 6,75 |
| 14 minas, 5 casillas | 97,000 % | 94,95 % ± 2,93 |
| 15 minas, 4 casillas | 97,000 % | 97,03 % ± 2,14 |
| 16 minas, 4 casillas | 97,000 % | 97,10 % ± 2,77 |
| 17 minas, 5 casillas | 97,000 % | 96,40 % ± 8,52 |
| 19 minas, 1 casillas | 97,000 % | 97,35 % ± 0,49 |
| 20 minas, 3 casillas | 97,000 % | 95,19 % ± 4,16 |
| 22 minas, 3 casillas | 97,000 % | 113,75 % ± 14,42 |

(256 configuraciones en total; la tabla muestra una de cada 7. Todas están en `src/qa.ts`.)

Controles:

- ✓ RTP exacto en las 256 configuraciones: la más lejos del objetivo es "1 minas, 1 casillas" con 97,000 % (objetivo 97,00 %, tolerancia ±0,20)
- ✓ el motor paga lo que dice la fórmula: la mayor diferencia es "3 minas, 16 casillas", 95,05 % simulado contra 97,000 % exacto (2.7 desvíos; máximo 4,5)
- ✓ premio máximo 10.000× (los originales del mercado: de 1.000× para arriba)
<!-- qa:fin -->

## La matemática

Las cargas se ubican **al apostar** (Fisher-Yates parcial, un sorteo por
carga) y quedan guardadas con la jugada. Después de k pepitas con m cargas:

    P(sobrevivir k) = C(25 − m, k) / C(25, k)
    multiplicador   = 0,97 / P(sobrevivir k)

así que el retorno es **97 % para cualquier cantidad de cargas y cualquier
momento de cobro**. El QA lo controla en las 256 combinaciones de cargas y
rocas que se pueden jugar.

| | |
|---|---|
| RTP | 97 % para cualquier estrategia |
| Primera pepita | ×1,01 con 1 carga · ×1,10 con 3 · ×24,25 con 24 |
| Tope | ×10.000: si la próxima roca lo pasaría, la jugada se cobra sola antes; nunca se recorta un pago |

## Decisiones

- **La jugada se retoma**: las cargas, las rocas destapadas y lo apostado
  están en la jugada pendiente, no en la pantalla. Recargar la página no
  cambia nada.
- **"Al azar" no decide nada**: elige qué roca destapar con el azar de la
  interfaz; lo que hay debajo ya estaba puesto.
- **Pagos en fichas** con redondeo estocástico (`roundPay`).

## Reproducir

```
npm run qa -- --game famatina
```
