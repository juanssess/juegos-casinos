# vendimia (La Vendimia) — Math Sheet

Documento de referencia del juego #3, y el primero que **no paga por líneas**.
Todo número acá sale de `tools/sim.ts`, `tools/tune.ts` y `tools/buyprice.ts`,
no de estimaciones.

## Ficha técnica

| | |
|---|---|
| ID del modelo | `vendimia` |
| Nombre comercial | La Vendimia (skin de la cosecha mendocina) |
| Formato | 6 columnas × 5 filas — **30 celdas, sin líneas** |
| Cómo se paga | **Racimos**: 5+ símbolos iguales conectados (arriba, abajo, izquierda, derecha) |
| Apuesta mínima | 20 créditos (la apuesta se divide en 20 fichas) |
| **RTP** | **96,58 %** |
| **Compra del bonus** | **desde 56,6× la apuesta** — RTP de la compra 96,47 % |
| **Apuesta ante** | **1,63×** — RTP 96,48 %, feature 2,7× más seguido |
| **Volatilidad** | **Media-alta (índice 14,2)** |
| Frecuencia de premio | 46,4 % (1 de cada 2,2 rondas) |
| **Premio máximo** | **5.000× la apuesta (tope duro)** |
| Desvío estándar | 8,60 |

Comparación con los otros dos: `classic20` tiene índice 15,2 y `sebusca` 59,0.
La Vendimia es el más **frecuente** de los tres y el menos explosivo: se gana
casi una de cada dos rondas, casi siempre poco. Es la forma del género — lo que
engancha no es el premio grande sino que la grilla siga explotando.

## Reparto del RTP

| Componente | RTP | Share |
|---|---|---|
| Juego base (racimos) | 49,19 % | 50,9 % |
| Scatter (paga en el base) | 3,51 % | 3,6 % |
| Giros gratis | 43,88 % | 45,4 % |
| **Total** | **96,58 %** | |

## Símbolos

**Seis pagadores, no nueve.** Es la decisión estructural del juego y no una
cuestión de gusto: la frecuencia de un símbolo en un juego de racimos crece
como su densidad a la **quinta potencia**, porque hacen falta cinco celdas
pegadas. Con nueve símbolos repartidos en 30 celdas ninguno junta las
apariciones necesarias y el tablero no explota nunca. Seis pagadores + wild +
scatter = ocho dibujos en pantalla, que es lo que tiene cualquier juego de
racimos del mercado.

`WILD` (Tijera de Podar) sustituye a todos menos al `SCATTER` y **pega**
racimos: une dos grupos que solos no pagarían. Una misma tijera puede formar
parte de **dos racimos distintos a la vez** y cobrar en los dos — es la regla
estándar del género, es lo que hace valioso al wild, y está escrita en la
tabla de pagos del juego porque rompe la intuición de "cada celda paga una
vez". Un grupo de puras tijeras no paga: no hay a quién sustituir.

`SCATTER` (Barrica) paga en cualquier posición sobre la apuesta total, y **4 o
más** disparan los giros gratis. Se cuentan en la **caída inicial**: una
barrica que entra durante una cascada no suma al disparo.

## Tabla de pagos

Múltiplos de la **ficha** (= apuesta total ÷ 20), por tamaño del racimo.

| Símbolo | 5-6 | 7-8 | 9-11 | 12-14 | 15+ |
|---|--:|--:|--:|--:|--:|
| H1 Copa de Malbec | 10 | 40 | 125 | 400 | 1800 |
| H2 Botella | 8 | 25 | 70 | 225 | 950 |
| H3 Canasto | 7 | 20 | 60 | 175 | 650 |
| L1 Racimo Malbec | 5 | 15 | 40 | 125 | 425 |
| L2 Hoja de Parra | 4 | 10 | 25 | 80 | 275 |
| L3 Uva Torrontés | 3 | 8 | 20 | 55 | 200 |

Scatter, en múltiplos de la **apuesta total**: 4 → 3×, 5 → 15×, 6 → 60×,
7 → 200×, 8 → 500×.

## La mecánica: cascadas y la escalera

Una jugada no termina con el primer premio.

1. Caen las seis columnas.
2. Se buscan racimos. Si no hay, la jugada terminó.
3. Se cobran, con el multiplicador del número de cascada.
4. Los racimos ganadores se van, cae lo de arriba, entra lo nuevo desde la
   tira, y se vuelve al paso 2 — un escalón más arriba.

La escalera: **×1 → ×2 → ×3 → ×5 → ×8 → ×12 → ×20 → ×30 → ×50**, aplanada en
el último escalón.

**En los giros gratis la escalera NO vuelve a empezar.** Se guarda entre giros
y sigue subiendo durante toda la tanda. Es lo que le da a la feature forma de
historia —arranca floja y se va calentando— en vez de ser ocho jugadas sueltas
puestas una atrás de otra. Y es lo que hace que el precio de la compra sea
imposible de calcular a ojo (ver más abajo).

Promedio: **0,74 cascadas por ronda**.

### De dónde salen los símbolos que caen

De la misma tira, leída **hacia arriba**. Cada columna tiene su tira y su
posición de parada; la ventana visible son 5 símbolos hacia abajo desde la
parada, y lo que entra al caer son los que estaban justo *arriba*, uno por uno.

La propiedad que esto compra es grande: **toda la cadena de cascadas queda
determinada por las seis posiciones de parada**. No se sortea nada más en toda
la jugada. Una ronda entera se reproduce con seis números, y un laboratorio
puede recalcularla sin conocer el motor. Si en cada cascada se sortearan
símbolos nuevos harían falta cientos de sorteos para reproducir una jugada.

## La feature

| | |
|---|---|
| Disparo | 4+ barricas en la caída inicial |
| Frecuencia | 1 de cada **115** rondas |
| Giros otorgados | 8 |
| Retrigger | 4+ barricas suman 5 giros |
| Promedio real por disparo | 8,02 giros |
| EV del disparo | 54,7× la apuesta |

## Tope de premio

**5.000× la apuesta.** Medido, no elegido: la primera versión declaraba
10.000× —el mismo número que Se Busca— y en 40 millones de rondas simuladas el
premio más grande que salió fue 4.580×. Un tope que el juego no puede alcanzar
no es un tope: es un número decorativo en la pantalla de información, y de los
peores, porque el jugador lo lee como una promesa.

## Compra del bonus

Tres variantes, todas medidas con `tools/buyprice.ts` (1,5M compras cada una).

| Variante | Qué te llevás | EV medido | Precio | RTP |
|---|---|--:|--:|--:|
| La Cosecha | 8 giros | 54,603× ± 0,116 | **56,6×** | 96,47 % |
| Cosecha grande | 12 giros | 133,728× ± 0,199 | **138,6×** | 96,48 % |
| Reserva | 8 giros arrancando en ×3 | 90,365× ± 0,154 | **93,6×** | 96,54 % |

**Mirá la segunda fila.** Cuatro giros más —de 8 a 12, un 50 % más— no valen
un 50 % más: valen **dos veces y media**. Es la escalera arrastrada: los cuatro
giros extra no se juegan desde ×1, se juegan desde donde llegó la tanda, que
es arriba. Cotizar "un 50 % más de giros, un 50 % más de precio" habría dejado
la variante grande en 85× cuando vale 138×.

Es el mismo agujero que apareció en Se Busca con los wilds pegajosos: dos
mecánicas distintas, el mismo error posible. **Todo lo que se acumula dentro de
la feature hace que el precio deje de ser lineal en los giros.**

**Los precios llevan un decimal**, y no es capricho. Con un EV de 54,6× un
escalón entero de precio mueve el RTP de la compra casi un punto: a 56× da
97,5 % —mejor que el juego, o sea que convendría comprar siempre y no girar
nunca— y a 57× da 95,8 %. No hay entero que sirva.

## Apuesta ante

Tiras con más barricas por **1,63×** el costo. Medición con el costo fijado en
1× para leer el retorno **bruto**; el precio justo sale de bruto ÷ 96,58 %.

| Barricas por columna | Bruto | Feature | Precio justo |
|---|--:|---|--:|
| `[3,2,2,2,2,2]` | 95,55 % | 1 de cada 89 | **0,989×** |
| `[3,2,2,2,2,3]` | 113,50 % | 1 de cada 69 | 1,175× |
| `[3,3,2,2,3,3]` | 157,54 % | 1 de cada 43 | **1,631×** ← elegida |
| `[3,3,3,3,3,3]` | 225,98 % | 1 de cada 28 | 2,340× |

**Mirá la primera fila.** Una barrica más en **una sola** columna da un precio
justo *menor que uno*: la apuesta ante saldría más barata que el juego normal.
No es un error de medición, es la mecánica — cada scatter que entra le saca
densidad a los símbolos que forman racimos, y la frecuencia cae como la
densidad a la quinta. Con un solo scatter extra, lo que pierde el juego base es
más que lo que gana la feature. (Se ve directo: el RTP base cae de 52,7 % a
25,0 % cuando el ante sube fuerte.)

Eso **no pasa en un juego de líneas**, donde un scatter de más casi no toca los
premios de línea. Es exactamente por lo que este número se mide en vez de
copiarse del juego anterior.

Verificación a 1,63× sobre 40M de rondas: **96,48 % ± 0,43** contra 96,58 % del
base. Los intervalos se solapan: el ante es honesto.

## Distribución de premios por ronda

| Premio | Rondas |
|---|--:|
| sin premio | 53,59 % |
| 0–1× | 33,18 % |
| 1–2× | 6,89 % |
| 2–5× | 4,23 % |
| 5–10× | 1,09 % |
| 10–20× | 0,42 % |
| 20–50× | 0,31 % |
| 50–100× | 0,16 % |
| 100–500× | 0,14 % |
| 500×+ | 0,00 % |

## Notas de diseño

**Los conteos de las tiras van casi planos (7 a 12, apenas 1,7 a 1).** En un
juego de líneas eso sería una jerarquía inexistente; acá alcanza y sobra,
porque 1,7 a 1 en la tira son casi 15 a 1 en la pantalla. La jerarquía la hace
la **tabla de pagos**, no la rareza.

La primera versión tenía H1 en 3 y L1 en 11 —lo que uno pone por instinto
viniendo de un juego de líneas— y los altos ganaban 1 de cada 3.500 rondas
contra 1 de cada 10 de los bajos. El solver contestó con premios de **diez mil
fichas** para H1, que es la forma que tiene un solver de avisar que el problema
no está en los premios.

**Las tiras se construyen distinto.** `buildClusterStrip` planta corridas de
dos y tres símbolos iguales a propósito: dos iguales seguidos en la tira son
dos celdas pegadas verticalmente, garantizado, y ese par es la semilla de casi
todos los racimos. Con el constructor de los juegos de líneas —mezcla al azar—
la adyacencia queda librada a la suerte, y se vio el síntoma: dos símbolos con
el **mismo conteo** ganaban el doble uno que el otro.

**La forma de la paytable es la decisión más grande del juego.** La primera
versión tenía el tramo 15+ en 50 veces el de 5-6; el simulador devolvió
volatilidad 10,6 —"media"— y un premio máximo de 873× en cinco millones de
rondas. Un juego de cascadas que no llega a mil veces la apuesta no tiene de
qué presumir. Con el 15+ en **140 veces** el de 5-6, la misma matemática da
volatilidad 14,2 y premios de 4.500×. No cambió ninguna probabilidad: cambió
**dónde está guardado el valor**.

**El solver se ajusta al ruido si la muestra es corta.** A 5M de rondas el RTP
estimado de este juego oscila entre 95,9 % y 97,1 % según la semilla — el
componente base es estable (52,6–52,9 %) y lo que baila es la **feature**. La
paytable definitiva se resolvió sobre **60 millones** de rondas y se verificó
con corridas independientes.

## Cómo reproducir estos números

```bash
node tools/sim.ts --game vendimia --rounds 200000000 --bet 20 --seed 777
```

```bash
node tools/tune.ts --game vendimia --rounds 60000000
```

```bash
node tools/buyprice.ts --game vendimia --rounds 1500000 --variant grande
```

```bash
node tools/sim.ts --game vendimia --rounds 40000000 --bet 20 --ante
```

```bash
npm test
```
