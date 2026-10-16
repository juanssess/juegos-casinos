# cataratas (Las Cataratas) — Math Sheet

Documento de referencia del juego #7, el primero de **caminos con columnas de
altura variable**: cada columna muestra de 2 a 7 símbolos en cada caída, y un
premio es un símbolo en columnas seguidas desde la izquierda, que cobra la
tabla por cada camino que forme. El tema son las Cataratas del Iguazú; las
cascadas del juego son el agua.

<!-- qa:inicio -->
## QA automático — NO APROBADO

Generado por `npm run qa -- --game cataratas` el 2026-10-16. No editar a mano: se reescribe en cada corrida.
Huella de la matemática: `5c6f493d7ece06f4`.

| | |
|---|---|
| RTP | **96,80 % ± 0,10** (800M de rondas; objetivo 96,50 %) |
| Reparto | base 59,06 % · giros gratis 37,73 % |
| Frecuencia de premio | 32,6 % |
| Bonus | 1 de cada 326 rondas · 13,65 giros por disparo |
| Volatilidad | muy alta (índice 23,4; desvío 14,20) |
| Tope | 10.000× · mayor premio medido 10000× |
| Compra "La Garganta del Diablo" | 130,3× · EV 125,14× ± 0,29 (2M) → RTP 96,04 % |
| Apuesta ante | 1,25× · RTP 96,69 % ± 0,14 · bonus 1 de cada 196 |

Controles:

- ✗ RTP 96,80 % ± 0,10 contra el objetivo 96,50 % (tolerancia ±0,20)
- ✓ precisión de la medición ±0,10 puntos (máximo ±0,15; si no alcanza, más rondas)
- ✓ compra "La Garganta del Diablo" a 130,3×: EV 125,14× ± 0,29 → RTP 96,04 % (tolerancia ±0,50)
- ✓ ante a 1,25×: RTP 96,69 % ± 0,14, -0,10 puntos contra el juego normal (admitido de -0,50 a +1,00)
- ✓ tope 10.000×: el mayor premio medido fue 10000× (tiene que llegar al 50 % del tope para no ser decorativo)
- ✓ frecuencia de premio 32,6 % (el mercado: 25 % a 35 %)
- ✓ bonus 1 de cada 326 rondas (el mercado: de 150 a 400)
- ✓ tope 10.000× (el mercado: 5.000× a 25.000×)
<!-- qa:fin -->

## Ficha técnica

| | |
|---|---|
| ID del modelo | `cataratas` |
| Nombre comercial | Las Cataratas |
| Formato | 6 columnas de 2 a 7 símbolos — de 64 a 117.649 caminos |
| Cómo se paga | Un símbolo en 3 o más columnas seguidas desde la primera, por camino |
| Caminos | El producto de cuántas veces está el símbolo (o el wild) en cada columna |
| Wild | Gota Arcoíris, solo en las columnas 2 a 5; sustituye a todo menos al medallón |
| Cascadas | En todas las jugadas; la altura de cada columna se mantiene hasta la próxima caída |
| Giros gratis | 4 o más medallones: 12 giros; 3 o más adentro suman 5 |
| Multiplicador | Base sin multiplicador; en la función +1 por cada cascada que gana, sin volver atrás |
| Apuesta mínima | 20 créditos (la apuesta se divide en 20 fichas) |
| Compra del bonus | 130,3× (medido) |
| Apuesta ante | 1,25×: cuatro medallones en cada columna |
| Premio máximo | 10.000× la apuesta (tope duro) |

## Cómo funciona el motor

Es el motor de racimos (`cluster.ts`) en modo `ways`. Lo nuevo:

- **La altura se sortea por columna, antes de su parada** (`heightWeights`).
  La grilla se guarda siempre de 6×7: arriba de lo que muestra la columna
  quedan celdas `VOID`. Una jugada entera sigue saliendo de los sorteos de la
  caída —ahora doce, seis alturas y seis paradas—; las cascadas no sortean
  nada.
- **Los caminos se cuentan como premio**: cada candidato de la primera
  columna cobra `tabla[símbolo][columnas] × caminos × ficha × multiplicador`.
  El medidor del solver pesa cada premio por sus caminos, así la tabla se
  sigue resolviendo con álgebra: qué gana y cuántos caminos forma depende
  solo de las tiras y las alturas, no de los pagos.
- **Dos escaleras**: `baseCascadeMults: [1]` (la base no multiplica) y
  `cascadeMults` de ×1 a ×500 con `freeCarriesLadder`: en la función cada
  cascada que gana suma uno y el multiplicador sigue en el giro siguiente.

## Decisiones de diseño (medidas)

- **Tiras con corridas** (`buildClusterStrips`, 50 % de corridas). Con tiras
  sueltas cada columna mostraba casi todos los símbolos y la frecuencia de
  premio pasaba del 50 %; con corridas la columna repite símbolos, hay menos
  candidatos y más caminos por premio: 32,6 % de frecuencia.
- **Medallones 4 y 3 por columna**: con 2 por columna la función salía 1 de
  cada 2.594 rondas; con [4,3,4,3,4,3] sale 1 de cada ~325.
- **Más wilds en la función** (8 por columna contra 2 en la base): con 3 la
  función aportaba el 21 % del RTP; con 8, el 39 %. Es la forma del género:
  el multiplicador que no baja necesita cascadas largas para valer.
- **Reparto cargado a los bajos**: con el reparto parejo el solver dejaba L5
  en [1, 1, 2, 8] (la ficha no tiene decimales y los bajos ganan muy
  seguido). Dándole más RTP a los bajos la tabla queda monótona.
- **Ante con 4 medallones por columna**: retorno bruto 121,1 %, precio justo
  1,25× (ver `tuning.ts` con las otras tres opciones medidas).

## Tabla de pagos

En fichas (apuesta ÷ 20) **por camino**. La vigente es la de
`packages/games/cataratas/src/index.ts`, que resolvió el solver.

| Símbolo | Skin | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|
| H1 | Yaguareté | 5 | 15 | 40 | 125 |
| H2 | Tucán | 3 | 9 | 30 | 85 |
| H3 | Mariposa Azul | 3 | 6 | 20 | 60 |
| H4 | Orquídea | 3 | 6 | 15 | 50 |
| L1 | Amatista | 2 | 3 | 8 | 35 |
| L2 | Ágata | 1 | 2 | 6 | 20 |
| L3 | Cuarzo | 1 | 2 | 4 | 15 |
| L4 | Topacio | 1 | 2 | 3 | 15 |
| L5 | Jaspe | 1 | 2 | 3 | 10 |

Medallones, sobre la apuesta total: 4 → 2×, 5 → 5×, 6 o más → 20×.

## Reproducir

```
npm run tune -- --game cataratas --rounds 2e7
npm run qa -- --game cataratas
```
