# feria (La Feria) — Math Sheet

El juego #5 y el primero de la familia **Hold & Win** (motor en
`packages/math/src/holdwin.ts`, reutilizable con `npm run new-game -- --mechanic hold-win`).
Tema: la feria de antigüedades de San Telmo. Todo número sale del motor real.

<!-- qa:inicio -->
## QA automático — APROBADO

Generado por `npm run qa -- --game feria` el 2026-10-15. No editar a mano: se reescribe en cada corrida.
Huella de la matemática: `c5485dcdefaa871b`.

| | |
|---|---|
| RTP | **96,53 % ± 0,09** (800M de rondas; objetivo 96,50 %) |
| Reparto | base 70,43 % · giros gratis 26,10 % |
| Frecuencia de premio | 22,6 % |
| Bonus | 1 de cada 170 rondas · 5,90 giros por disparo |
| Volatilidad | alta (índice 21,0; desvío 12,78) |
| Tope | 5.000× · mayor premio medido 5000× |
| Compra "Hold & Win" | 46,2× · EV 44,48× ± 0,21 (2M) → RTP 96,27 % |
| Apuesta ante | 1,19× · RTP 96,29 % ± 0,15 · bonus 1 de cada 86 |

Controles:

- ✓ RTP 96,53 % ± 0,09 contra el objetivo 96,50 % (tolerancia ±0,20)
- ✓ precisión de la medición ±0,09 puntos (máximo ±0,15; si no alcanza, más rondas)
- ✓ compra "Hold & Win" a 46,2×: EV 44,48× ± 0,21 → RTP 96,27 % (tolerancia ±0,50)
- ✓ ante a 1,19×: RTP 96,29 % ± 0,15, -0,24 puntos contra el juego normal (admitido de -0,50 a +1,00)
- ✓ tope 5.000×: el mayor premio medido fue 5000× (tiene que llegar al 50 % del tope para no ser decorativo)
- ⚠ frecuencia de premio 22,6 % (el mercado: 25 % a 35 %)
- ✓ bonus 1 de cada 170 rondas (el mercado: de 150 a 400)
- ✓ tope 5.000× (el mercado: 5.000× a 25.000×)
<!-- qa:fin -->

## Reglas

| | |
|---|---|
| Formato | 5×3, 20 líneas, comodín (bandoneón) en los rodillos 2 a 4 |
| Monedas | Ocupan el lugar del scatter; no pagan en el juego base, traen un valor |
| Disparo | 6 monedas o más en pantalla |
| Función | Las monedas quedan fijas, 3 re-giros; cada moneda nueva los vuelve a 3 |
| Valores | 1×, 2×, 3×, 4×, 5×, 8×, 10× la apuesta y jackpots Mini 20×, Minor 50×, Major 200× |
| Grand | Llenar las 15 celdas: 5.000× la apuesta, que es también el tope |

## Decisiones de diseño (medidas, 32M de rondas por variante)

- **Monedas en pilas.** El armador de tiras de líneas reparte los scatters
  de a uno por zona: con eso nunca se juntan seis en cinco rodillos y la
  función no salía jamás. Las monedas se insertan en pilas de 1 a 3
  (`insertCoinStacks`), y el tamaño de las pilas regula la frecuencia.
- **Frecuencia y valor.** Pilas grandes con 7 % de caída por celda daban la
  función 1 de cada 86 rondas y la pantalla llena 1 de cada 91 funciones.
  Con pilas medianas, valores un poco más altos y 4,5 % de caída: función 1
  de cada 170, valor medio 41× y pantalla llena 1 de cada ~1.100 funciones.
- **El Grand es el tope.** Con un Grand de 1.000× el mayor premio medido no
  pasaba de ~1.300× y un tope de 5.000× habría sido decorativo. Llenar la
  pantalla paga exactamente el tope: el premio máximo publicado existe.
- **El solver ve la función como un pago fijo** (`fixedRtp`): las monedas
  valen lo que valen y no se escalan con la tabla. Predijo 96,49 %; el QA
  midió 96,25 % y se subió un escalón a ocho premios de 5 iguales (+0,28):
  96,53 %. Como en Se Busca, el número que vale es el del QA.
- **Ante con pilas, no con monedas sueltas.** Una moneda suelta más por
  rodillo casi no mueve el retorno (le saca lugar a un símbolo de línea);
  lo que encarece el ante son las pilas grandes. Pilas [3,2,1,1]/[3,2,2,1]:
  función 1 de cada 86, precio justo 1,19×.
- **Frecuencia de premio 22,6 %**, por debajo del 25 % del mercado: las
  monedas ocupan lugares de la tira que no forman líneas. Es el aviso que
  queda del QA, y es propio del género.

## Reproducir

```
npm run tune -- --game feria --rounds 2e7
npm run qa -- --game feria
```

