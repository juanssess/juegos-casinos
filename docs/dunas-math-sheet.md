# dunas (Las Dunas) — Math Sheet

Juego #11, primero de la Fase 4. Nacido de **sebusca** con `npm run new-game`
y re-ajustado entero: misma mecánica, otra volatilidad.

<!-- qa:inicio -->
## QA automático — APROBADO

Generado por `npm run qa -- --game dunas` el 2026-10-16. No editar a mano: se reescribe en cada corrida.
Huella de la matemática: `57aa1e00521778f5`.

| | |
|---|---|
| RTP | **96,59 % ± 0,06** (800M de rondas; objetivo 96,50 %) |
| Reparto | base 65,82 % · giros gratis 30,77 % |
| Frecuencia de premio | 29,3 % |
| Bonus | 1 de cada 174 rondas · 8,08 giros por disparo |
| Volatilidad | media-alta (índice 13,7; desvío 8,33) |
| Tope | 5.000× · mayor premio medido 5000× |
| Compra "La Travesía" | 58,6× · EV 56,6× ± 0,13 (2M) → RTP 96,59 % |
| Compra "Travesía larga" | 166× · EV 160,32× ± 0,3 (2M) → RTP 96,58 % |
| Apuesta ante | 1,41× · RTP 96,91 % ± 0,09 · bonus 1 de cada 77 |

Controles:

- ✓ RTP 96,59 % ± 0,06 contra el objetivo 96,50 % (tolerancia ±0,20)
- ✓ precisión de la medición ±0,06 puntos (máximo ±0,15; si no alcanza, más rondas)
- ✓ compra "La Travesía" a 58,6×: EV 56,6× ± 0,13 → RTP 96,59 % (tolerancia ±0,50)
- ✓ compra "Travesía larga" a 166×: EV 160,32× ± 0,3 → RTP 96,58 % (tolerancia ±0,50)
- ✓ ante a 1,41×: RTP 96,91 % ± 0,09, +0,32 puntos contra el juego normal (admitido de -0,50 a +1,00)
- ✓ tope 5.000×: el mayor premio medido fue 5000× (tiene que llegar al 50 % del tope para no ser decorativo)
- ✓ frecuencia de premio 29,3 % (el mercado: 25 % a 35 %)
- ✓ bonus 1 de cada 174 rondas (el mercado: de 150 a 400)
- ✓ tope 5.000× (el mercado: 5.000× a 25.000×)
<!-- qa:fin -->

## Concepto

Rally de motos en las dunas de Fiambalá. 5×5, 15 líneas, y en la función los
pilotos (wilds) caen con multiplicador y se quedan pegados hasta el final,
multiplicándose entre sí en una línea, como en Se Busca. La diferencia es la
volatilidad: Se Busca es la más alta de la casa (índice 59) y Las Dunas es la
más baja de las tragamonedas (~14), la sesión larga que la casa no tenía.

## Decisiones de diseño (medidas)

Iteración con `tune` (2e7) y QA rápido (2e7 rondas); índice = 1,645 × desvío.

| Paso | Cambio | Función en el RTP | Índice |
|---|---|---|---|
| molde | Se Busca tal cual | 55 % | 59 |
| 1 | dos banderas en el rodillo 3, multiplicadores ×2..×10, tope 5.000× | 52 % | ~29 |
| 2 | multiplicadores hasta ×5 | 48 % | ~25 |
| 3 | giros gratis con 1-2-1 wilds y los altos del juego base | 27 % | ~19 |
| 4 | más altos en las tiras base (5-6-6-7, bajos 8) y `SHAPE` plano (H1 1-3-10) | 22 % | ~12 |
| 5 | wilds 2-2-2 en los giros gratis (la función tiene que valer algo) | 37 % | ~17 |
| 6 | multiplicadores ×2 820‰, ×3 160‰, ×5 20‰; giros con menos altos | 32 % | ~14 |

Lo que más mueve la cola es el techo de la tabla de multiplicadores, porque
en una línea se multiplican: tres pegajosos de ×5 son ×125, tres de ×50 eran
×125.000. El paso 4 enseñó la otra mitad: si se le saca valor a la función
sin aplanar la tabla, el solver lo devuelve inflando los 5 iguales del juego
base y la volatilidad se muda de lugar en vez de bajar.

- **Función 1 de cada ~174** (Se Busca: 258): más seguido y más barata.
- **Compra**: La Travesía (8 giros) 58,6× y Travesía larga (12 giros) 166×,
  del EV medido por el QA dividido por el RTP objetivo.
- **Ante**: una bandera más en los rodillos 1 y 5 (`[2,1,2,1,2]`) a 1,41×.

## Reproducir

```
npm run tune -- --game dunas --rounds 1e8
npm run qa -- --game dunas
```
