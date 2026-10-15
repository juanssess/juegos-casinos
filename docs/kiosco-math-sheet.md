# kiosco (El Kiosco) — Math Sheet

Documento de referencia del juego #4, el primero que **paga en cualquier
parte** ("scatter pays") y el primero con **bombas multiplicadoras**. La
mecánica es la del género de Sweet Bonanza; el tema, los nombres y el arte son
propios. Todo número acá sale de `tools/sim.ts`, `tools/tune.ts` y
`tools/buyprice.ts`.

## Ficha técnica

| | |
|---|---|
| ID del modelo | `kiosco` |
| Nombre comercial | El Kiosco (skin del kiosco de barrio) |
| Formato | 6 columnas × 5 filas — 30 celdas, sin líneas |
| Cómo se paga | **8 o más símbolos iguales en cualquier lugar** de la grilla |
| Cascadas | En todas las jugadas, sin escalera de multiplicador |
| Apuesta mínima | 20 créditos (la apuesta se divide en 20 fichas) |
| **RTP** | **96,54 % ± 0,11** (800M de rondas; objetivo 96,5 %) |
| **Compra del bonus** | **156,1×** — EV 150,60× ± 0,23 (2M de compras), RTP de la compra 96,5 % |
| **Apuesta ante** | **1,31×** — el bonus sale 1 de cada 183 en vez de 1 de cada 372; RTP con ante ~96,9 % |
| **Volatilidad** | **Alta (índice 21,9)** |
| Frecuencia de premio | 33,8 % (1 de cada 3,0 rondas) |
| Disparo del bonus | 1 de cada 372 rondas · 10,80 giros por disparo |
| **Premio máximo** | **10.000× la apuesta (tope duro)** — alcanzado en la medición |
| Desvío estándar | 13,33 |

## Reparto del RTP

| Componente | RTP | Share |
|---|---|---|
| Juego base (con scatter) | 57,07 % | 59,1 % |
| Giros gratis | 39,48 % | 40,9 % |
| **Total** | **96,54 %** | |

## Símbolos y tabla de pagos

En múltiplos de la **ficha** (apuesta ÷ 20). Entre paréntesis, en veces la apuesta.

| Símbolo | Skin | 8-9 | 10-11 | 12+ |
|---|---|---|---|---|
| H1 | Alfajor | 200 (10×) | 500 (25×) | 1650 (82,5×) |
| H2 | Bombón | 100 (5×) | 325 (16,25×) | 1250 (62,5×) |
| H3 | Caramelo | 50 | 125 | 500 |
| H4 | Chicle | 50 | 80 | 500 |
| L1 | Manzana | 25 | 40 | 400 |
| L2 | Ciruela | 15 | 25 | 225 |
| L3 | Sandía | 10 | 20 | 175 |
| L4 | Uva | 6 | 15 | 95 |
| L5 | Banana | 2 | 6 | 35 |

La tabla vigente es siempre la de `packages/games/kiosco/src/index.ts`, que
es la que resolvió el solver.

**Chupetín (scatter)** — paga sobre la apuesta total en cualquier posición:
4 → 3×, 5 → 5×, 6 o más → 100×. Con 4 o más en la caída inicial: **10 giros
gratis**. Dentro de la feature, **3** o más suman **5 giros**.

## Bombas multiplicadoras

Solo en los giros gratis, en el slot del wild (este juego no tiene wild).
**12 por columna** en las tiras de la feature.

- No pagan y **no se van con las cascadas**: bajan con su columna hasta que
  la secuencia termina.
- Al final, si la secuencia ganó algo, el premio se multiplica por la **suma**
  de todas las bombas de la grilla. Sin premio, las bombas no hacen nada.
- Valores de **×2 a ×500**, con pesos en `tuning.ts` (`BOMB_WEIGHTS`). Las
  chicas son comunes; ×100, ×250 y ×500 son las raras.

**El valor viaja con la tira.** Cada bomba de la tira de giros gratis tiene
su valor fijado al construir el juego (`bombValues`, alineado con
`freeStrips`). En juego no se sortea nada más que las paradas: la ronda
entera sigue saliendo de seis números, como en La Vendimia.

## Decisiones de diseño (medidas)

- **Tope de 10.000×, y alcanzable.** La primera versión tenía 3.500×: con
  bombas hasta ×100 y 9 por columna el juego no pasaba de ~3.400× ni en un
  millón de compras, y el género anda entre 5.000× y 25.000×. Con 12 bombas
  por columna y la cola en ×100/×250/×500 (100.000 compras, sin tope) el
  máximo fue 18.632× y una de cada ~50.000 compras pasó los 10.000×. La
  tabla de comparación está en `tuning.ts`.
- **El solver bajó la tabla para pagar las bombas.** Con la cola nueva la
  feature pasó de ~30 % a ~40 % del RTP y el juego base de 67 % a 57 %. Es
  la forma del género: la plata está en las bombas.
- **Tiras con densidad escalonada** (7 a 15 por símbolo). Al revés que en
  La Vendimia, acá la densidad SÍ ordena la jerarquía: un premio es "ocho de
  treinta" y la probabilidad de juntar ocho cae muy rápido con el conteo.
- **Chupetines intercalados** (3, 2, 3, 2, 3, 2) en el juego base: 1 de cada
  372. Con 3 en todas las columnas sale 1 de cada 183, que es lo que usa el
  ante.
- **Ante con 3 chupetines por columna.** Con 4 en la primera (lo que usaba
  la versión de 3.500×) el ante tendría que costar 1,43×, lejos del 1,25×
  del género; con 3 en todas cuesta 1,31× y el bonus igual sale el doble.
- **Tiras de la feature cargadas de frutas.** Que se gane seguido en los
  giros gratis es lo que hace valer a las bombas: una bomba sin premio no
  multiplica nada.

## Cuántas rondas hacen falta

Con bombas de hasta ×500 la cola es muy pesada. Una corrida de 100M de
rondas puede caer 0,6 puntos abajo o arriba del RTP real: con la misma tabla
una dio 95,87 % y otras cuatro de 25M dieron entre 96,14 % y 96,59 %. **Para
fijar el RTP a ±0,1 hacen falta ~800M de rondas**, que en esta máquina son
16 procesos de 50M en paralelo (unos 3 minutos). El solver con 100M sí
acertó: predijo 96,51 % y la medición grande dio 96,54 %.

## Reproducir

```
node tools/tune.ts --game kiosco --rounds 1e8
# 16 en paralelo, semillas 201..216:
node tools/sim.ts --game kiosco --rounds 5e7 --bet 20 --seed N
# 8 en paralelo, semillas 401..408:
node tools/sim.ts --game kiosco --rounds 5e7 --bet 20 --ante --seed N
# 8 en paralelo, semillas 301..308:
node tools/buyprice.ts --game kiosco --rounds 2.5e5 --bet 20 --seed N
```
