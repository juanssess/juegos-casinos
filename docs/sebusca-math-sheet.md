# sebusca (Se Busca) — Math Sheet

Documento de referencia del juego #2. Todo número acá sale de `tools/sim.ts`,
`tools/tune.ts` y `tools/buyprice.ts`, no de estimaciones.

## Ficha técnica

| | |
|---|---|
| ID del modelo | `sebusca` |
| Nombre comercial | Se Busca (skin western) |
| Formato | 5 rodillos × 5 filas |
| Líneas | 15 fijas, pagan de izquierda a derecha |
| Apuesta mínima | 15 créditos (1 por línea) |
| **RTP** | **96,44 %** (± 0,50 con 95 % de confianza) |
| **Compra del bonus** | **151× la apuesta** — RTP de la compra 96,19 % |
| **Volatilidad** | **Muy alta (índice 59,0)** |
| Frecuencia de premio | 32,8 % (1 de cada 3,1 rondas) |
| **Premio máximo** | **10.000× la apuesta (tope duro)** |
| Desvío estándar | 35,88 |

Verificado sobre **200.000.000 de rondas** (semilla 777), más validación
cruzada entre `play`, `playFast` y el modelo de frecuencias.

Comparación con el juego #1: `classic20` tiene índice de volatilidad 15,2 y
desvío 9,25. Se Busca es casi cuatro veces más volátil — está en la familia de
Wanted Dead or a Wild, no en la de un slot clásico.

## Reparto del RTP

| Componente | RTP | Share |
|---|---|---|
| Juego base (líneas) | 40,13 % | 41,6 % |
| Scatter (paga en el base) | 0,99 % | 1,0 % |
| Giros gratis | 55,32 % | 57,4 % |
| **Total** | **96,44 %** | |

## Símbolos

`WILD` (Cartel de Recompensa) sustituye a todos menos al `SCATTER`. No aparece
en los rodillos 1 y 5.

`SCATTER` (Dinamita) paga en cualquier posición sobre la apuesta total, y 3 o
más disparan los giros gratis.

## Tabla de pagos

Múltiplos de la **apuesta por línea** (= apuesta total ÷ 15).

| Símbolo | 3 | 4 | 5 |
|---|--:|--:|--:|
| H1 El Forajido | 60 | 400 | 2900 |
| H2 Cráneo de Toro | 30 | 175 | 850 |
| H3 Revólver | 20 | 90 | 350 |
| H4 Estrella de Sheriff | 15 | 55 | 250 |
| L1 As | 7 | 30 | 85 |
| L2 Rey | 7 | 20 | 75 |
| L3 Reina | 6 | 20 | 65 |
| L4 Jota | 6 | 15 | 50 |
| L5 Diez | 6 | 15 | 45 |

Scatter, en múltiplos de la **apuesta total**: 3 → 2×, 4 → 15×, 5 → 100×.

## La feature: wilds pegajosos con multiplicador

| | |
|---|---|
| Disparo | 3+ dinamitas en el juego base |
| Frecuencia | 1 de cada **258** rondas |
| Giros otorgados | 8 |
| Retrigger | 3+ dinamitas suman 3 giros |
| Promedio real por disparo | 8,07 giros |

**La mecánica.** Cada wild que cae durante los giros gratis sortea un
multiplicador y **queda fijo en su celda hasta el final de la feature**. El
tablero se va poblando, y cada pegajoso ayuda a todos los giros que siguen.

**Los multiplicadores de una misma línea se MULTIPLICAN entre sí.** Un ×10 y
un ×25 en la misma línea dan ×250. Esa composición multiplicativa es la que
fabrica la cola larga — y la razón de que el juego necesite un tope.

Tabla del sorteo (E[mult] ≈ 3,1):

| Multiplicador | Probabilidad |
|---|--:|
| ×2 | 66,0 % |
| ×3 | 21,5 % |
| ×5 | 8,0 % |
| ×10 | 3,0 % |
| ×25 | 1,2 % |
| ×50 | 0,3 % |

Reglas finas:
- Una celda pegajosa muestra siempre el wild: lo que la tira ponga ahí queda
  tapado, incluso un scatter.
- Un wild que cae sobre una celda ya pegajosa no re-sortea.
- En el juego base los wilds valen ×1 y no se pegan.

## Tope de premio

10.000× la apuesta. Al alcanzarlo, el premio se recorta y la ronda termina,
giros restantes incluidos. Se alcanza en **0,11 % de las compras de bonus**
(≈ 1 de cada 930): es una meta real, no decorativa.

## Compra del bonus

| | |
|---|---|
| Precio | **151× la apuesta total** |
| Mecánica | Muestreo por rechazo sobre el giro base |
| EV medido | 145,24× ± 0,77 (2M compras, `tools/buyprice.ts`) |
| **RTP de la compra** | **96,19 %** |

El precio está fijado apenas POR DEBAJO del RTP del juego (96,44 %) a
propósito: si la compra pagara mejor que girar normal, comprar sería
estrategia dominante y el juego base sobraría. El cuarto de punto es la prima
por saltarse la espera.

## Distribución de premios por ronda

| Premio | Rondas |
|---|--:|
| sin premio | 67,24 % |
| 0–1× | 23,09 % |
| 1–2× | 5,74 % |
| 2–5× | 2,76 % |
| 5–10× | 0,63 % |
| 10–20× | 0,22 % |
| 20–50× | 0,16 % |
| 50–100× | 0,06 % |
| 100–500× | 0,07 % |
| 500×+ | 0,02 % |

## Notas de diseño

**Por qué tan pocos wilds en las tiras de la feature.** El primer intento
tenía 4-5 por rodillo y el tuner delató que la feature valía **cinco veces el
juego entero** (RTP 531 %). Un pegajoso no vale lo que paga en su giro: vale
lo que aporta a todos los giros que quedan, así que su valor se compone. Con
2-3 por rodillo central, cada wild que cae es un evento.

**Por qué el multiplicador máximo bajó de ×100 a ×50.** Con ×100 la cola
compuesta era tan pesada que el tope de 10.000× recortaba **3,7 puntos de
RTP**: casi el 4 % del valor del juego vivía en premios que prácticamente
nadie ve. Eso es declarar un RTP que la experiencia real no entrega. Con ×50
el recorte es marginal y el número declarado es honesto.

**Por qué la paytable se resolvió a 101,3 % y no a 96,5 %.** El tuner mide el
juego SIN tope (el tope depende de la paytable, que es justo lo que está
resolviendo). Se resuelve al objetivo elevado, se aplica, y el simulador con
tope confirma el 96,44 % real. El test `el tope recorta RTP, y poco` guarda
esa relación.

**Los cinco bajos tienen la misma cantidad en las tiras.** Misma lección que
en classic20: con frecuencias distintas el solver le da más premio al bajo más
raro y la tabla queda ilegible. El validador lo atrapa.

## Cómo reproducir estos números

```bash
node tools/sim.ts --game sebusca --rounds 200000000 --seed 777
```

```bash
node tools/tune.ts --game sebusca --rounds 40000000 --target 1.013
```

```bash
node tools/buyprice.ts --game sebusca --rounds 2000000
```

```bash
npm test
```
