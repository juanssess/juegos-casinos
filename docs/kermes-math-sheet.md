# kermes (La Kermés) — Math Sheet

El Plinko de la casa: la bolita de la kermés del barrio. Cae por un tablero
de clavos y termina en un casillero de abajo, que paga lo que dice. Se elige
cuántas filas (8, 12 o 16) y el riesgo (bajo, medio o alto).

<!-- qa:inicio -->
## QA automático — APROBADO

Generado por `npm run qa -- --game kermes` el 2026-10-16. No editar a mano: se reescribe en cada corrida.
Huella de la matemática: `5b3ad58cf9e8a2dc`.

| | |
|---|---|
| RTP exacto | **96,969 % a 97,063 %** en las 9 configuraciones (objetivo 97,00 %) |
| Motor simulado | 120M de jugadas en total |
| Volatilidad | baja (índice 2,4, en la configuración típica) |
| Tope | 1.000× |

| Configuración | RTP exacto | Motor (simulado) |
|---|---|---|
| 8 filas, riesgo bajo | 96,992 % | 96,98 % ± 0,04 |
| 8 filas, riesgo medio | 96,969 % | 96,96 % ± 0,07 |
| 8 filas, riesgo alto | 97,063 % | 97,05 % ± 0,15 |
| 12 filas, riesgo bajo | 96,996 % | 96,99 % ± 0,04 |
| 12 filas, riesgo medio | 97,062 % | 97,01 % ± 0,08 |
| 12 filas, riesgo alto | 96,981 % | 97,14 % ± 0,24 |
| 16 filas, riesgo bajo | 97,013 % | 97,02 % ± 0,04 |
| 16 filas, riesgo medio | 96,998 % | 96,99 % ± 0,10 |
| 16 filas, riesgo alto | 97,050 % | 97,46 % ± 0,40 |

Controles:

- ✓ RTP exacto en las 9 configuraciones: la más lejos del objetivo es "8 filas, riesgo alto" con 97,063 % (objetivo 97,00 %, tolerancia ±0,20)
- ✓ el motor paga lo que dice la fórmula: la mayor diferencia es "16 filas, riesgo alto", 97,46 % simulado contra 97,050 % exacto (2.0 desvíos; máximo 4,5)
- ✓ premio máximo 1.000× (los originales del mercado: de 1.000× para arriba)
<!-- qa:fin -->

## La matemática

En cada fila la bolita va a la izquierda o a la derecha con la misma
probabilidad: n sorteos de una moneda. Termina en el casillero k (las veces
que fue a la derecha) con probabilidad C(n, k) / 2^n. El retorno de una
tabla es Σ P(k) · pago(k), exacto.

| Tabla | Pagos (de la punta al centro) | RTP exacto |
|---|---|---|
| 8 filas, bajo | 5,6 · 2,7 · 1,35 · 0,75 · 0,49 | 96,99 % |
| 8 filas, medio | 13 · 3,6 · 1,26 · 0,59 · 0,4 | 96,97 % |
| 8 filas, alto | 29 · 4,8 · 1,08 · 0,35 · 0,2 | 97,06 % |
| 12 filas, bajo | 10 · 5,5 · 3,1 · 1,79 · 1,08 · 0,69 · 0,5 | 97,00 % |
| 12 filas, medio | 33 · 13 · 5 · 2,1 · 0,97 · 0,49 · 0,3 | 97,06 % |
| 12 filas, alto | 170 · 30 · 6,6 · 1,78 · 0,62 · 0,29 · 0,2 | 96,98 % |
| 16 filas, bajo | 16 · 9,6 · 5,8 · 3,6 · 2,2 · 1,45 · 0,96 · 0,67 · 0,5 | 97,01 % |
| 16 filas, medio | 110 · 42 · 17 · 7 · 3,1 · 1,48 · 0,76 · 0,43 · 0,3 | 97,00 % |
| 16 filas, alto | 1000 · 180 · 39 · 9,7 · 2,9 · 1,05 · 0,46 · 0,26 · 0,2 | 97,05 % |

## Cómo se armaron las tablas

No están copiadas de ningún lado: salen de un diseño de tres números —el
pago del centro, el de la punta y una curva entre los dos,
c · (E/c)^((d/D)^p)— con la curva resuelta para que la tabla devuelva el
97 %, redondeada a números que se leen y ajustada de a un paso (simétrico y
sin romper que pague más hacia la punta) hasta quedar a ±0,1 del objetivo.

## Decisiones

- **Se liquida al tirar**: el camino sale del RNG al tirar y la caída solo lo
  recorre. Por eso se pueden tirar varias bolitas seguidas (hasta 12 en el
  aire) y una recarga no pierde nada.
- **Pagos en fichas** con redondeo estocástico (`roundPay`).

## Reproducir

```
npm run qa -- --game kermes
```
