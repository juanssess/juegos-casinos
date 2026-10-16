# carnaval (El Carnaval) — Math Sheet

El juego #6 y el de la mecánica de **multiplicadores acumulados** (estilo
Gates of Olympus), sobre el motor de racimos de El Kiosco con dos agregados:
multiplicadores en el juego base (`baseBombValues`) y acumulación en la
función (`accumulateBombs`). Tema: el Carnaval del País, Gualeguaychú.

<!-- qa:inicio -->
## QA automático — APROBADO

Generado por `npm run qa -- --game carnaval` el 2026-10-16. No editar a mano: se reescribe en cada corrida.
Huella de la matemática: `f64dbecb2e58dc66`.

| | |
|---|---|
| RTP | **96,49 % ± 0,08** (800M de rondas; objetivo 96,50 %) |
| Reparto | base 54,29 % · giros gratis 42,20 % |
| Frecuencia de premio | 28,0 % |
| Bonus | 1 de cada 386 rondas · 16,38 giros por disparo |
| Volatilidad | alta (índice 20,1; desvío 12,22) |
| Tope | 10.000× · mayor premio medido 5899× |
| Compra "Noche de Comparsas" | 172,5× · EV 166,49× ± 0,23 (2M) → RTP 96,52 % |
| Apuesta ante | 1,24× · RTP 97,18 % ± 0,11 · bonus 1 de cada 302 |

Controles:

- ✓ RTP 96,49 % ± 0,08 contra el objetivo 96,50 % (tolerancia ±0,20)
- ✓ precisión de la medición ±0,08 puntos (máximo ±0,15; si no alcanza, más rondas)
- ✓ compra "Noche de Comparsas" a 172,5×: EV 166,49× ± 0,23 → RTP 96,52 % (tolerancia ±0,50)
- ✓ ante a 1,24×: RTP 97,18 % ± 0,11, +0,70 puntos contra el juego normal (admitido de -0,50 a +1,00)
- ✓ tope 10.000×: el mayor premio medido fue 5899× (tiene que llegar al 50 % del tope para no ser decorativo)
- ✓ frecuencia de premio 28,0 % (el mercado: 25 % a 35 %)
- ✓ bonus 1 de cada 386 rondas (el mercado: de 150 a 400)
- ✓ tope 10.000× (el mercado: 5.000× a 25.000×)
<!-- qa:fin -->

## Reglas

| | |
|---|---|
| Formato | 6×5, paga con 8 o más iguales en cualquier lado, con cascadas |
| Esferas de purpurina | Multiplicadores de ×2 a ×500 que no pagan ni se van con las cascadas |
| Juego base | Una esfera por columna (×2 a ×25): si la secuencia gana, la multiplica la suma de las que haya |
| Función | 4 coronas: 15 giros gratis; 3 adentro suman 5. Seis esferas por columna |
| Acumulación | Cada secuencia que gana con esferas suma su valor a un total que no se reinicia; ese total multiplica la secuencia. Si gana sin esferas, paga sin multiplicar |
| Tope | 10.000× |

## Decisiones de diseño (medidas)

- **La plata en la función.** Con los mismos multiplicadores en la base y en
  la función, la base se llevaba el 77 % del RTP. Con una esfera por columna
  en la base y valores bajos (×2 a ×25), la función aporta ~43 %, que es la
  forma del género.
- **Valores más bajos que El Kiosco.** Allá una bomba se usa una vez; acá un
  ×10 temprano sigue sumando en todas las secuencias que vienen.
- **Tope de 10.000×, no 15.000×.** En 800M de rondas y 2M de compras el
  mayor premio fue 5.895×: 15.000× habría sido decorativo.
- **Tabla resuelta con el sesgo corregido.** El modelo del solver medía 0,28
  por debajo del QA en esa muestra; se le pidió 96,22 % y el QA dio 96,49 %.

## Reproducir

```
npm run tune -- --game carnaval --rounds 2e7 --seed 71 --target 0.9622
npm run qa -- --game carnaval
```

