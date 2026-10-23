# asado (El Asado) — Math Sheet

Juego #15, de la Fase 4: la mecánica de **El Kiosco** —8 o más iguales en
cualquier lado, cascadas, y en los giros gratis multiplicadores que se quedan
hasta el final de la secuencia y multiplican por la suma— con volatilidad
**media** y la piel de un asado de domingo. Los multiplicadores son brasas.

<!-- qa:inicio -->
## QA automático — APROBADO

Generado por `npm run qa -- --game asado` el 2026-10-23. No editar a mano: se reescribe en cada corrida.
Huella de la matemática: `08552501ead44231`.

| | |
|---|---|
| RTP | **96,40 % ± 0,05** (800M de rondas; objetivo 96,50 %) |
| Reparto | base 63,89 % · giros gratis 32,51 % |
| Frecuencia de premio | 32,8 % |
| Bonus | 1 de cada 183 rondas · 11,50 giros por disparo |
| Volatilidad | media (índice 10,8; desvío 6,55) |
| Tope | 2.500× · mayor premio medido 2500× |
| Compra "Asado completo" | 65,3× · EV 62,97× ± 0,08 (2M) → RTP 96,43 % |
| Apuesta ante | 1,17× · RTP 96,88 % ± 0,08 · bonus 1 de cada 91 |

Controles:

- ✓ RTP 96,40 % ± 0,05 contra el objetivo 96,50 % (tolerancia ±0,20)
- ✓ precisión de la medición ±0,05 puntos (máximo ±0,15; si no alcanza, más rondas)
- ✓ compra "Asado completo" a 65,3×: EV 62,97× ± 0,08 → RTP 96,43 % (tolerancia ±0,50)
- ✓ ante a 1,17×: RTP 96,88 % ± 0,08, +0,48 puntos contra el juego normal (admitido de -0,50 a +1,00)
- ✓ tope 2.500×: el mayor premio medido fue 2500× (tiene que llegar al 50 % del tope para no ser decorativo)
- ✓ frecuencia de premio 32,8 % (el mercado: 25 % a 35 %)
- ✓ bonus 1 de cada 183 rondas (el mercado: de 150 a 400)
- ⚠ tope 2.500× (el mercado: 5.000× a 25.000×)
<!-- qa:fin -->

## Qué cambia contra El Kiosco

| | El Kiosco | El Asado |
|---|---|---|
| Multiplicadores | bombas de ×2 a ×500, 12 por columna | brasas de ×2 a ×50, 9 por columna |
| Scatters por columna | [3,2,3,2,3,2] | 3 en todas |
| Bonus | 1 de cada ~372 | 1 de cada ~183 |
| Tope | 10.000× | 2.500× |
| Volatilidad (índice) | 21,9 (alta) | ~10,7 (media) |
| Compra / ante | 156,1× / 1,31× | 65,3× / 1,17× |

## Decisiones de diseño (medidas)

- **Brasas más chicas y más bonus**: es el juego de volatilidad media que le
  faltaba al salón. Premios seguidos (frecuencia 32,8 %) y la función el doble
  de seguido que en El Kiosco.
- **Tope de 2.500×**: debajo del rango de mercado (aviso, no freno), a
  propósito; el QA lo alcanzó.
- **Ante [4,4,3,4,4,3] a 1,17×**: el bonus pasa a 1 de cada 91 (ver tuning.ts
  con las cinco opciones medidas).
- **Tabla**: H3 y H4 se rebalancearon en el reparto porque la primera tabla
  dejaba al Morcilla pagando más que la Provoleta.

## Reproducir

```
npm run tune -- --game asado --rounds 2e7
npm run qa -- --game asado
```
