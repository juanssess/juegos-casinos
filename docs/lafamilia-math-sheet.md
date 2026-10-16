# La Familia

<!-- qa:inicio -->
## QA automático — APROBADO

Generado por `npm run qa -- --game lafamilia` el 2026-10-16. No editar a mano: se reescribe en cada corrida.
Huella de la matemática: `afec58e7a4025c5b`.

| | |
|---|---|
| RTP | **96,47 % ± 0,14** (264,884M de rondas; objetivo 96,50 %) |
| Reparto | base 70,69 % · giros gratis 25,78 % |
| Frecuencia de premio | 22,6 % |
| Bonus | 1 de cada 170 rondas · 11,57 giros por disparo |
| Volatilidad | alta (índice 18,4; desvío 11,21) |
| Tope | 5.000× · mayor premio medido 5000× |
| Compra "Guerra de familias" | 45,4× · EV 43,8× ± 0,18 (2M) → RTP 96,48 % |
| Apuesta ante | 1,22× · RTP 96,93 % ± 0,24 · bonus 1 de cada 86 |

Controles:

- ✓ RTP 96,47 % ± 0,14 contra el objetivo 96,50 % (tolerancia ±0,20)
- ✓ precisión de la medición ±0,14 puntos (máximo ±0,15; si no alcanza, más rondas)
- ✓ compra "Guerra de familias" a 45,4×: EV 43,8× ± 0,18 → RTP 96,48 % (tolerancia ±0,50)
- ✓ ante a 1,22×: RTP 96,93 % ± 0,24, +0,47 puntos contra el juego normal (admitido de -0,50 a +1,00)
- ✓ tope 5.000×: el mayor premio medido fue 5000× (tiene que llegar al 50 % del tope para no ser decorativo)
- ⚠ frecuencia de premio 22,6 % (el mercado: 25 % a 35 %)
- ✓ bonus 1 de cada 170 rondas (el mercado: de 150 a 400)
- ✓ tope 5.000× (el mercado: 5.000× a 25.000×)
<!-- qa:fin -->

## Concepto

Un golpe a la caja fuerte de un club clandestino de los años treinta. Un mafioso de traje cambia de postura, vigila el salón y se acomoda el saco con su Thompson. Humo, polvo iluminado y lámparas cálidas animan el fondo.

## Reglas de esta versión

Cinco rodillos, tres filas y veinte líneas. El sello de la familia sustituye símbolos. Seis bolsas disparan El golpe al banco: las bolsas permanecen fijas y cada bolsa nueva renueva los tres intentos. La pantalla llena suma el Grand; el límite por ronda es 5.000 veces la apuesta. La compra y el modo ante muestran su precio antes de apostar.

La matemática de esta primera versión reutiliza el motor y la configuración comprobada de Hold & Win de la casa. Este paquete tiene su propio QA, huella de fuentes, arte, personajes y música. No incluye todavía personajes que alteren los premios dentro de la caja fuerte: las bolsas pagan exactamente lo que informa el tablero.

## Arte, movimiento y sonido

Los recursos finales y las fuentes están en `art/`; `art/prompts.json` conserva los pedidos al generador integrado. Tres poses del mafioso, respiración, desplazamiento suave, paralaje, humo e iluminación cálida. Se respeta `prefers-reduced-motion` y se pausa el movimiento con la pestaña oculta. Piano, vibráfono y contrabajo con ritmo de swing; el audio comparte el control de silencio del casino. No se usan archivos de Dunas ni El Gran Premio.

## Reproducir

```sh
node tools/qa.ts --game lafamilia --cores 8 --rounds 2e8 --ante-rounds 1e8
node --test packages/math/test/lafamilia.test.ts
npm run dev
# Abrir /?game=lafamilia
```
