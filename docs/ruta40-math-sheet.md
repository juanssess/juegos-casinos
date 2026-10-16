# ruta40 (Ruta 40) — Math Sheet

El Crash de la casa. Un camión de rally sale por la Ruta 40 y el
multiplicador sube con el tiempo hasta que el motor se funde. El jugador se
retira cuando quiere —o deja un retiro automático— y cobra el multiplicador
de ese momento; si el motor se funde antes, pierde la apuesta.

<!-- qa:inicio -->
## QA automático — PENDIENTE

Todavía no pasó por `npm run qa -- --game ruta40`.
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
