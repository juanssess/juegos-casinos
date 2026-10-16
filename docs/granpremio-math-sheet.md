# granpremio (El Gran Premio) — Math Sheet

Documento de referencia del juego #12, el segundo de **caminos con columnas
de altura variable**. Nació del molde de Las Cataratas (`npm run new-game
-- --mechanic caminos`) y se recalibró para que no sea un clon: volatilidad
alta en vez de muy alta, función más seguida y tope de 5.000×. El tema son
las carreras de ruta argentinas de los años 50 y 60, por caminos de tierra
entre pueblos; en la función cada cascada "sube la marcha".

<!-- qa:inicio -->
## QA automático — APROBADO

Generado por `npm run qa -- --game granpremio` el 2026-10-16. No editar a mano: se reescribe en cada corrida.
Huella de la matemática: `b0517a9ca3d1bb64`.

| | |
|---|---|
| RTP | **96,64 % ± 0,08** (800M de rondas; objetivo 96,50 %) |
| Reparto | base 61,92 % · giros gratis 34,72 % |
| Frecuencia de premio | 32,4 % |
| Bonus | 1 de cada 229 rondas · 14,29 giros por disparo |
| Volatilidad | alta (índice 19,0; desvío 11,54) |
| Tope | 5.000× · mayor premio medido 5000× |
| Compra "La Largada" | 84,8× · EV 81,75× ± 0,19 (2M) → RTP 96,40 % |
| Apuesta ante | 1,19× · RTP 96,65 % ± 0,11 · bonus 1 de cada 152 |

Controles:

- ✓ RTP 96,64 % ± 0,08 contra el objetivo 96,50 % (tolerancia ±0,20)
- ✓ precisión de la medición ±0,08 puntos (máximo ±0,15; si no alcanza, más rondas)
- ✓ compra "La Largada" a 84,8×: EV 81,75× ± 0,19 → RTP 96,40 % (tolerancia ±0,50)
- ✓ ante a 1,19×: RTP 96,65 % ± 0,11, +0,01 puntos contra el juego normal (admitido de -0,50 a +1,00)
- ✓ tope 5.000×: el mayor premio medido fue 5000× (tiene que llegar al 50 % del tope para no ser decorativo)
- ✓ frecuencia de premio 32,4 % (el mercado: 25 % a 35 %)
- ✓ bonus 1 de cada 229 rondas (el mercado: de 150 a 400)
- ✓ tope 5.000× (el mercado: 5.000× a 25.000×)
<!-- qa:fin -->

## Ficha técnica

| | |
|---|---|
| ID del modelo | `granpremio` |
| Nombre comercial | El Gran Premio |
| Formato | 6 columnas de 2 a 7 símbolos — de 64 a 117.649 caminos |
| Cómo se paga | Un símbolo en 3 o más columnas seguidas desde la primera, por camino |
| Caminos | El producto de cuántas veces está el símbolo (o el wild) en cada columna |
| Wild | Bandera a Cuadros, solo en las columnas 2 a 5; sustituye a todo menos a la medalla |
| Cascadas | En todas las jugadas; la altura de cada columna se mantiene hasta la próxima caída |
| Giros gratis | 4 o más Medallas de Largada: 12 giros; 3 o más adentro suman 5 |
| Multiplicador | Base sin multiplicador; en la función cada cascada que gana sube la marcha (+1), sin volver atrás |
| Apuesta mínima | 20 créditos (la apuesta se divide en 20 fichas) |
| Compra del bonus | "La Largada", 84,8× (medido) |
| Apuesta ante | 1,19×: cinco medallas en las columnas 1, 3 y 5 |
| Premio máximo | 5.000× la apuesta (tope duro) |

El motor es el de Las Cataratas sin cambios (`cluster.ts` en modo `ways`):
todo lo distinto está en las tiras, el reparto y el tope, dentro del
paquete del juego.

## Contra el molde

| | Las Cataratas | El Gran Premio |
|---|---|---|
| Volatilidad (índice) | 23,5 (muy alta) | 19,0 (alta) |
| Tope | 10.000× | 5.000× |
| Función | 1 de cada 326 | 1 de cada 229 |
| La función aporta | 39 % del RTP | 36 % del RTP |
| Compra | 129,2× | 84,8× |
| Ante | 1,25× (función 1/196) | 1,19× (función 1/152) |

## Decisiones de diseño (medidas)

- **Medallas 4 en cada columna** (el molde tenía 4 y 3): la función pasa de
  1 de cada ~326 a 1 de cada 229. Con [5,4,5,4,5,4] salía 1 de cada 192 y
  la función se llevaba más de la mitad del RTP: más volátil, no menos.
- **Más bajos en las tiras** (14 a 18 por columna contra 13 a 17): el juego
  base carga más premios chicos. Probamos 15 a 20 y los bajos se pasaban de
  su parte aun pagando el mínimo (la ficha no tiene decimales): el solver
  dejaba L3, L4 y L5 en [1, 1, …] y la tabla no era monótona.
- **Seis wilds por columna en la función** (el molde tiene ocho): con ocho
  la función aportaba el 52 % del RTP; con seis, el 36 %. El multiplicador
  que no baja sigue siendo el corazón, pero con cascadas menos largas.
- **Reparto más plano** (`SHARES` de 9 a 13 en vez de 7 a 18) y **formas
  más planas** (`SHAPE`: el de seis columnas paga ~8 a 16 veces el de tres
  en vez de 10 a 25): menos premio concentrado en las jugadas raras.
- **Tope 5.000×**: recorta la cola que en el molde llegaba a 10.000×; el QA
  pide que el mayor premio medido llegue al menos a la mitad.
- **Ante con cinco medallas en las columnas impares**: retorno bruto
  115,2 %, precio justo 1,19× (ver `tuning.ts` con las otras dos opciones
  medidas).

## Tabla de pagos

En fichas (apuesta ÷ 20) **por camino**. La vigente es la de
`packages/games/granpremio/src/index.ts`, que resolvió el solver con 1e8
rondas.

| Símbolo | Skin | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|
| H1 | Cupé de Carrera | 10 | 25 | 60 | 175 |
| H2 | Casco y Antiparras | 7 | 15 | 40 | 100 |
| H3 | Volante de Madera | 6 | 10 | 25 | 75 |
| H4 | Copa del Gran Premio | 5 | 10 | 20 | 60 |
| L1 | Llanta de Rayos | 2 | 3 | 8 | 20 |
| L2 | Bujía | 2 | 3 | 6 | 20 |
| L3 | Llave Cruz | 1 | 2 | 4 | 10 |
| L4 | Manómetro | 1 | 2 | 3 | 9 |
| L5 | Bocina | 1 | 2 | 3 | 8 |

Medallas, sobre la apuesta total: 4 → 2×, 5 → 5×, 6 o más → 20×.

## Reproducir

```
npm run tune -- --game granpremio --rounds 1e8
npm run buyprice -- --game granpremio --rounds 2e6
npm run sim -- --game granpremio --rounds 2e7 --bet 20 --ante
npm run qa -- --game granpremio
```

(`sim` necesita `--bet 20` en los juegos de racimos y caminos: sin eso toma
la cantidad de líneas, que es cero, y mide todo en NaN.)
