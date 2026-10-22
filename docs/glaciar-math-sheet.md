# glaciar (El Glaciar) — Math Sheet

Juego #13, de la Fase 4 (producción en serie): el **Hold & Win** de La Feria
—monedas que se quedan, tres re-giros que vuelven a tres con cada moneda
nueva, el Grand al llenar la pantalla— con **otra volatilidad** y la piel del
Perito Moreno.

<!-- qa:inicio -->
## QA automático — APROBADO

Generado por `npm run qa -- --game glaciar` el 2026-10-16. No editar a mano: se reescribe en cada corrida.
Huella de la matemática: `83b8e72c6f17e4f1`.

| | |
|---|---|
| RTP | **96,34 % ± 0,06** (800M de rondas; objetivo 96,50 %) |
| Reparto | base 67,26 % · giros gratis 29,08 % |
| Frecuencia de premio | 22,6 % |
| Bonus | 1 de cada 112 rondas · 5,88 giros por disparo |
| Volatilidad | media-alta (índice 14,1; desvío 8,57) |
| Tope | 2.500× · mayor premio medido 2500× |
| Compra "Hold & Win" | 34,1× · EV 32,96× ± 0,11 (2M) → RTP 96,64 % |
| Apuesta ante | 1,11× · RTP 96,80 % ± 0,09 · bonus 1 de cada 72 |

Controles:

- ✓ RTP 96,34 % ± 0,06 contra el objetivo 96,50 % (tolerancia ±0,20)
- ✓ precisión de la medición ±0,06 puntos (máximo ±0,15; si no alcanza, más rondas)
- ✓ compra "Hold & Win" a 34,1×: EV 32,96× ± 0,11 → RTP 96,64 % (tolerancia ±0,50)
- ✓ ante a 1,11×: RTP 96,80 % ± 0,09, +0,46 puntos contra el juego normal (admitido de -0,50 a +1,00)
- ✓ tope 2.500×: el mayor premio medido fue 2500× (tiene que llegar al 50 % del tope para no ser decorativo)
- ⚠ frecuencia de premio 22,6 % (el mercado: 25 % a 35 %)
- ⚠ bonus 1 de cada 112 rondas (el mercado: de 150 a 400)
- ⚠ tope 2.500× (el mercado: 5.000× a 25.000×)
<!-- qa:fin -->

## Qué cambia contra La Feria

| | La Feria | El Glaciar |
|---|---|---|
| Pilas de monedas por rodillo | [2,2,1,1] y [3,2,1,1] | [3,2,1,1] en todos |
| Función | 1 de cada ~170 | 1 de cada ~112 |
| Monedas | más valores altos | más chicas y parejas |
| Jackpots (Mini/Minor/Major/Grand) | 20 / 50 / 200 / 5.000× | 15 / 40 / 150 / 2.500× |
| Volatilidad (índice) | 21,9 | 14,1 |
| Compra / ante | 46,2× / 1,19× | 34,1× / 1,11× |

## Decisiones de diseño (medidas)

- **Función más seguido y más pareja**: pilas un poco más grandes en todos los
  rodillos y monedas con valores más chicos. El índice de volatilidad baja de
  21,9 a 14,1: es el Hold & Win para quien quiere ver la función seguido.
- **Grand de 2.500×**: más chico y más alcanzable (el QA lo midió). Queda
  debajo del rango de mercado de 5.000× (es un aviso, no un freno), a
  propósito: un juego parejo con un tope enorme sería decorativo.
- **Ante**: pilas [3,2,2,1] en todos los rodillos; la función sale 1 de cada
  72. Precio 1,11× (retorno bruto medido 107,3 %).
- La tabla de líneas la resolvió el solver con la parte fija de las monedas
  (29 % del RTP).

## Reproducir

```
npm run tune -- --game glaciar --rounds 2e7
npm run qa -- --game glaciar
```
