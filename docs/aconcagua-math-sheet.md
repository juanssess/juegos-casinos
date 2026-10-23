# aconcagua (El Aconcagua) — Math Sheet

Juego #17, de la Fase 4: la mecánica de **Maverick** —20 líneas y la
Escalinata que decide los giros gratis y su multiplicador— con volatilidad
**media**, la más baja del salón, y la piel de una expedición al Aconcagua.
La Escalinata se llama El Ascenso, los escalones son campamentos y la
bandera de la cumbre es la que sube.

<!-- qa:inicio -->
## QA automático — APROBADO

Generado por `npm run qa -- --game aconcagua` el 2026-10-23. No editar a mano: se reescribe en cada corrida.
Huella de la matemática: `08dabc985bb523aa`.

| | |
|---|---|
| RTP | **96,44 % ± 0,03** (800M de rondas; objetivo 96,50 %) |
| Reparto | base 81,62 % · giros gratis 14,81 % |
| Frecuencia de premio | 29,7 % |
| Bonus | 1 de cada 209 rondas · 10,69 giros por disparo |
| Volatilidad | media (índice 6,7; desvío 4,05) |
| Tope | sin tope · mayor premio medido 1281× |
| Compra "El Ascenso" | 34,9× · EV 33,64× ± 0,05 (2M) → RTP 96,40 % |
| Compra "Campamento alto" | 50,1× · EV 48,43× ± 0,06 (2M) → RTP 96,67 % |
| Compra "La Cumbre" | 102,9× · EV 99,5× ± 0,1 (2M) → RTP 96,69 % |
| Apuesta ante | 1,14× · RTP 96,96 % ± 0,05 · bonus 1 de cada 104 |

Controles:

- ✓ RTP 96,44 % ± 0,03 contra el objetivo 96,50 % (tolerancia ±0,20)
- ✓ precisión de la medición ±0,03 puntos (máximo ±0,15; si no alcanza, más rondas)
- ✓ compra "El Ascenso" a 34,9×: EV 33,64× ± 0,05 → RTP 96,40 % (tolerancia ±0,50)
- ✓ compra "Campamento alto" a 50,1×: EV 48,43× ± 0,06 → RTP 96,67 % (tolerancia ±0,50)
- ✓ compra "La Cumbre" a 102,9×: EV 99,5× ± 0,1 → RTP 96,69 % (tolerancia ±0,50)
- ✓ ante a 1,14×: RTP 96,96 % ± 0,05, +0,52 puntos contra el juego normal (admitido de -0,50 a +1,00)
- ✓ frecuencia de premio 29,7 % (el mercado: 25 % a 35 %)
- ✓ bonus 1 de cada 209 rondas (el mercado: de 150 a 400)
<!-- qa:fin -->

## Qué cambia contra Maverick

| | Maverick | El Aconcagua |
|---|---|---|
| Campamentos (giros × mult.) | 8×4 · 10×5 · 12×6 · 15×8 · 20×10 | 8×2 · 10×2 · 12×3 · 15×3 · 20×4 |
| Probabilidad de subir | 60 / 45 / 30 / 15 % | 65 / 50 / 35 / 20 % |
| Wilds en la función | los del molde | menos (7→4, 8→5) |
| Volatilidad (índice) | 15,3 (media-alta) | 6,7 (media) |
| Mayor premio medido | 6979× | 1281× |
| Compra / ante | 80× / 1,75× | 34,9× / 1,14× |

## Decisiones de diseño (medidas)

- **Multiplicadores chicos y subir más fácil**: la función casi siempre llega
  a un campamento alto, pero el techo es ×4. Es el juego tranquilo del salón:
  premio en 3 de cada 10 giros y sin rachas secas largas.
- **Tabla más plana**: los altos pagan menos y los bajos un poco más que en
  Maverick (el SHAPE de tuning.ts), para que el juego base cargue el 82 %
  del RTP.
- **Sin tope**: con este techo no hace falta; lo máximo medido en 800M de
  rondas fue 1281×.
- **Ante [3,2,3,2,3] a 1,14×**: el bonus pasa a 1 de cada 104 (ver
  tuning.ts con las opciones medidas).

## Reproducir

```
npm run tune -- --game aconcagua --rounds 2e7
npm run qa -- --game aconcagua
```
