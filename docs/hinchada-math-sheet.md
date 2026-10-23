# hinchada (La Hinchada) — Math Sheet

Juego #16, de la Fase 4: la mecánica de **El Carnaval** —8 o más iguales en
cualquier lado, cascadas y multiplicadores que en la función se acumulan en un
total que no vuelve a cero— con volatilidad más alta y la piel de la tribuna
en noche de clásico. Los multiplicadores son bengalas.

<!-- qa:inicio -->
## QA automático — APROBADO

Generado por `npm run qa -- --game hinchada` el 2026-10-23. No editar a mano: se reescribe en cada corrida.
Huella de la matemática: `554e0fe81e3998d2`.

| | |
|---|---|
| RTP | **96,59 % ± 0,12** (800M de rondas; objetivo 96,50 %) |
| Reparto | base 39,76 % · giros gratis 56,83 % |
| Frecuencia de premio | 28,0 % |
| Bonus | 1 de cada 386 rondas · 16,31 giros por disparo |
| Volatilidad | muy alta (índice 28,9; desvío 17,59) |
| Tope | 15.000× · mayor premio medido 11008× |
| Compra "El Clásico" | 230,8× · EV 222,94× ± 0,36 (2M) → RTP 96,59 % |
| Apuesta ante | 1,21× · RTP 96,56 % ± 0,16 · bonus 1 de cada 302 |

Controles:

- ✓ RTP 96,59 % ± 0,12 contra el objetivo 96,50 % (tolerancia ±0,20)
- ✓ precisión de la medición ±0,12 puntos (máximo ±0,15; si no alcanza, más rondas)
- ✓ compra "El Clásico" a 230,8×: EV 222,94× ± 0,36 → RTP 96,59 % (tolerancia ±0,50)
- ✓ ante a 1,21×: RTP 96,56 % ± 0,16, -0,03 puntos contra el juego normal (admitido de -0,50 a +1,00)
- ✓ tope 15.000×: el mayor premio medido fue 11008× (tiene que llegar al 50 % del tope para no ser decorativo)
- ✓ frecuencia de premio 28,0 % (el mercado: 25 % a 35 %)
- ✓ bonus 1 de cada 386 rondas (el mercado: de 150 a 400)
- ✓ tope 15.000× (el mercado: 5.000× a 25.000×)
<!-- qa:fin -->

## Qué cambia contra El Carnaval

| | El Carnaval | La Hinchada |
|---|---|---|
| Multiplicadores de la función | hasta ×500, 6 por columna | hasta ×1000, 8 por columna, cola más pesada |
| Tope | 10.000× | 15.000× |
| Volatilidad (índice) | 20,1 (alta) | ~29 (muy alta) |
| Peso de la función en el RTP | menor | ~59 % |
| Compra / ante | 172,5× / 1,24× | 230,8× / 1,21× |

## Decisiones de diseño (medidas)

- **Tope de 15.000×, no 20.000×**: con 20.000× el mayor premio en 80M de
  rondas fue ~6.800×; hubiera sido decorativo. En el QA completo el mayor
  premio medido fue 11.008×.
- **Precisión**: con bengalas de ×1000 que se acumulan, el QA necesita varios
  miles de millones de rondas para fijar el RTP a ±0,15 (precisión adaptativa).
- **Ante [3,2,3,3,3,2] a 1,21×**: bonus 1 de cada ~301 (ver tuning.ts).
- **Tabla**: se ajustó la forma de H4 y L1 porque la primera dejaba a la
  Bufanda pagando más que el Silbato en 12+.

## Reproducir

```
npm run tune -- --game hinchada --rounds 2e7
npm run qa -- --game hinchada
```
