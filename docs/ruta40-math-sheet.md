# ruta40 (Ruta 40) — Math Sheet

El Crash de la casa. Un camión de rally sale por la Ruta 40 y el
multiplicador sube con el tiempo hasta que el motor se funde. El jugador se
retira cuando quiere —o deja un retiro automático— y cobra el multiplicador
de ese momento; si el motor se funde antes, pierde la apuesta.

<!-- qa:inicio -->
## QA automático — APROBADO

Generado por `npm run qa -- --game ruta40` el 2026-10-16. No editar a mano: se reescribe en cada corrida.
Huella de la matemática: `24b98a8b1ed39a8e`.

| | |
|---|---|
| RTP exacto | **96,999 % a 97,000 %** en las 11 configuraciones (objetivo 97,00 %) |
| Motor simulado | 120M de jugadas en total |
| Volatilidad | baja (índice 1,6, en la configuración típica) |
| Tope | 10.000× |

| Configuración | RTP exacto | Motor (simulado) |
|---|---|---|
| retiro en ×1.01 | 97,000 % | 97,01 % ± 0,01 |
| retiro en ×1.2 | 97,000 % | 96,99 % ± 0,03 |
| retiro en ×1.5 | 97,000 % | 97,02 % ± 0,04 |
| retiro en ×2 | 97,000 % | 97,02 % ± 0,06 |
| retiro en ×3 | 97,000 % | 97,05 % ± 0,08 |
| retiro en ×5 | 97,000 % | 97,00 % ± 0,12 |
| retiro en ×10 | 97,000 % | 96,99 % ± 0,18 |
| retiro en ×25 | 97,000 % | 96,97 % ± 0,29 |
| retiro en ×100 | 97,000 % | 96,99 % ± 0,58 |
| retiro en ×1000 | 97,000 % | 96,75 % ± 1,84 |
| retiro en ×10000 | 96,999 % | 101,66 % ± 5,98 |

Controles:

- ✓ RTP exacto en las 11 configuraciones: la más lejos del objetivo es "retiro en ×10000" con 96,999 % (objetivo 97,00 %, tolerancia ±0,20)
- ✓ el motor paga lo que dice la fórmula: la mayor diferencia es "retiro en ×1.01", 97,01 % simulado contra 97,000 % exacto (1.7 desvíos; máximo 4,5)
- ✓ premio máximo 10.000× (los originales del mercado: de 1.000× para arriba)
<!-- qa:fin -->

## La matemática

El punto de quiebre sale de **un solo sorteo** al arrancar
(`crashPoint` en `packages/math/src/originals.ts`):

    u uniforme en (0, 1]        X = ⌊100 · 0,97 / u⌋ / 100     (entre ×1,00 y ×10.000)

Entonces P(X ≥ m) = 0,97 / m, y quien se retira en m cobra m con esa
probabilidad: **el retorno es 97 % para cualquier retiro**, manual o
automático. Un ~4 % de las salidas quiebra antes de ×1,01.

| | |
|---|---|
| RTP | 97 % para cualquier estrategia |
| Retiro mínimo | ×1,01 |
| Tope | ×10.000: es el quiebre más alto posible y el retiro más alto permitido, así que nunca recorta un pago |
| Sorteos por jugada | 1 (el quiebre) + 1 si el pago tiene centésimos (redondeo) |

## Decisiones

- **El retiro se liquida al pedirlo**, no al quebrar: lo cobrado ya es del
  jugador. La curva sigue hasta el quiebre (más rápido) para que se vea.
- **La curva es presentación**: m(t) = e^(0,00006·t), ×2 a los ~11,5 s. El
  quiebre ya está sorteado; la curva es el reloj.
- **Jugada a medias**: si se recarga la página con el camión en marcha, se
  liquida con lo único que el jugador decidió de antemano, el retiro
  automático. Sin retiro automático, el motor se fundió con él.
- **Pagos en fichas** con redondeo estocástico (`roundPay`): el valor
  esperado del pago es exactamente apuesta × multiplicador.

## Reproducir

```
npm run qa -- --game ruta40
```
