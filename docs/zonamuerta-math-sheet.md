# Zona Muerta

<!-- qa:inicio -->
## QA automático — APROBADO

Generado por `npm run qa -- --game zonamuerta` el 2026-10-16. No editar a mano: se reescribe en cada corrida.
Huella de la matemática: `dcc410e0f6c4b937`.

| | |
|---|---|
| RTP | **96,50 % ± 0,12** (200M de rondas; objetivo 96,50 %) |
| Reparto | base 52,69 % · giros gratis 43,81 % |
| Frecuencia de premio | 46,4 % |
| Bonus | 1 de cada 115 rondas · 8,02 giros por disparo |
| Volatilidad | media-alta (índice 14,1; desvío 8,59) |
| Tope | 5.000× · mayor premio medido 5000× |
| Compra "El búnker" | 56,6× · EV 54,76× ± 0,1 (2M) → RTP 96,75 % |
| Compra "La azotea" | 138,6× · EV 133,81× ± 0,17 (2M) → RTP 96,54 % |
| Compra "El laboratorio" | 93,6× · EV 90,51× ± 0,13 (2M) → RTP 96,70 % |
| Apuesta ante | 1,63× · RTP 96,21 % ± 0,17 · bonus 1 de cada 43 |

Controles:

- ✓ RTP 96,50 % ± 0,12 contra el objetivo 96,50 % (tolerancia ±0,20)
- ✓ precisión de la medición ±0,12 puntos (máximo ±0,15; si no alcanza, más rondas)
- ✓ compra "El búnker" a 56,6×: EV 54,76× ± 0,1 → RTP 96,75 % (tolerancia ±0,50)
- ✓ compra "La azotea" a 138,6×: EV 133,81× ± 0,17 → RTP 96,54 % (tolerancia ±0,50)
- ✓ compra "El laboratorio" a 93,6×: EV 90,51× ± 0,13 → RTP 96,70 % (tolerancia ±0,50)
- ✓ ante a 1,63×: RTP 96,21 % ± 0,17, -0,29 puntos contra el juego normal (admitido de -0,50 a +1,00)
- ✓ tope 5.000×: el mayor premio medido fue 5000× (tiene que llegar al 50 % del tope para no ser decorativo)
- ⚠ frecuencia de premio 46,4 % (el mercado: 25 % a 35 %)
- ⚠ bonus 1 de cada 115 rondas (el mercado: de 150 a 400)
- ✓ tope 5.000× (el mercado: 5.000× a 25.000×)
<!-- qa:fin -->

## Concepto

Supervivencia nocturna en una ciudad abandonada. Una superviviente con linterna y un zombie se animan en capas independientes, con lluvia, niebla y luces de emergencia. El escenario reacciona al bonus; no interviene en los sorteos ni los premios.

## Reglas de esta versión

Tablero de 6 por 5, grupos de cinco conectados y cascadas. La barricada sustituye símbolos y cuatro radios disparan ocho giros. Durante la función se conserva la escalera del multiplicador. La compra permite elegir El búnker (8 giros), La azotea (12) o El laboratorio (8, desde ×3). Las características y precios se muestran antes de confirmar.

La matemática de esta primera versión reutiliza el motor y la configuración comprobada de racimos de la casa; la identidad visual, los personajes y la música son originales. Este paquete tiene su propio QA y huella de fuentes.

## Arte, movimiento y sonido

Los recursos finales y las fuentes están en `art/`; `art/prompts.json` conserva los pedidos al generador integrado. Tres poses por personaje, respiración, balanceo, paralaje, niebla y lluvia; se respeta `prefers-reduced-motion` y se pausa el movimiento con la pestaña oculta. Música de tensión con graves y cuerdas, más intensa durante el bonus. No se usan archivos de Dunas ni El Gran Premio.

## Reproducir

```sh
node tools/qa.ts --game zonamuerta --cores 8 --rounds 2e8 --ante-rounds 1e8
node --test packages/math/test/zonamuerta.test.ts
npm run dev
# Abrir /?game=zonamuerta
```
