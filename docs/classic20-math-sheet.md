# classic20 (Maverick) — Math Sheet

Documento de referencia del juego. Es el papel que un operador te pide antes de
integrar y el que un laboratorio de certificación usa para verificar. Todo
número acá sale de `tools/sim.ts` y `tools/tune.ts`, no de estimaciones.

## Ficha técnica

| | |
|---|---|
| ID del modelo | `classic20` |
| Nombre comercial | Maverick (skin azteca) |
| Formato | 5 rodillos × 3 filas |
| Líneas | 20 fijas, pagan de izquierda a derecha |
| Apuesta mínima | 20 créditos (1 por línea) |
| **RTP** | **96,66 %** (± 0,18 con 95 % de confianza) |
| **Compra del bonus** | **80× la apuesta** — RTP de la compra 96,6 % |
| Volatilidad | Media-alta (índice 15,2) |
| Frecuencia de premio | 29,7 % (1 de cada 3,4 rondas) |
| Premio máximo observado | 3 362× la apuesta |
| Desvío estándar | 9,25 |

Verificado sobre **100.000.000 de rondas** (semilla 31337), más una validación
cruzada contra el modelo de frecuencias que coincide hasta 1e-9.

## Reparto del RTP

| Componente | RTP | Share |
|---|---|---|
| Juego base (líneas) | 59,79 % | 61,9 % |
| Scatter (paga en el base) | 1,13 % | 1,2 % |
| Feature (Escalinata + giros) | 35,74 % | 37,0 % |
| **Total** | **96,66 %** | |

## Símbolos

`WILD` (Piedra del Sol) sustituye a todos menos al `SCATTER`. No aparece en
los rodillos 1 y 5. Una línea entera de wilds paga como `H1`.

`SCATTER` (Templo) paga en cualquier posición sobre la apuesta total, y 3 o
más disparan la feature.

## Tabla de pagos

Múltiplos de la **apuesta por línea** (= apuesta total ÷ 20).

| Símbolo | 3 | 4 | 5 | Aporta al RTP |
|---|--:|--:|--:|--:|
| H1 Serpiente | 55 | 350 | 2250 | 17,2 % |
| H2 Jaguar | 35 | 175 | 850 | 14,0 % |
| H3 Máscara | 20 | 90 | 400 | 10,9 % |
| H4 Cráneo | 15 | 55 | 225 | 9,0 % |
| L1 As | 10 | 45 | 150 | 10,7 % |
| L2 Rey | 10 | 40 | 125 | 9,9 % |
| L3 Reina | 10 | 35 | 100 | 9,1 % |
| L4 Jota | 9 | 25 | 90 | 7,7 % |
| L5 Diez | 8 | 25 | 65 | 6,9 % |

Scatter, en múltiplos de la **apuesta total**: 3 → 2×, 4 → 10×, 5 → 50×.

## La Escalinata (feature)

Con 3+ scatters se escala la pirámide. Se parte del nivel 1 (garantizado) y en
cada escalón un sorteo decide si se sube; el nivel final define el paquete.

| Nivel | Paquete | Prob. de subir al siguiente | Frecuencia (medida) |
|---|---|---|--:|
| 1 | 8 giros ×4 | 60,0 % | 40,0 % |
| 2 | 10 giros ×5 | 45,0 % | 33,1 % |
| 3 | 12 giros ×6 | 30,0 % | 18,8 % |
| 4 | 15 giros ×8 | 15,0 % | 6,9 % |
| 5 — la Cámara del Sol | 20 giros ×10 | — | 1,2 % |

- Disparo: 1 de cada **209** rondas.
- Retrigger: 3+ scatters dentro de la feature suman **5 giros** (mismo
  multiplicador); no vuelven a pagar ni re-escalan.
- Promedio real: 10,30 giros por disparo (incluye retriggers).
- Tope duro: 500 giros.

## Compra del bonus

| | |
|---|---|
| Precio | **80× la apuesta total** |
| Mecánica | Muestreo por rechazo: el giro base se re-tira hasta disparar |
| Distribución | Exactamente la condicional al disparo natural (incluye los premios del giro disparador) |
| EV medido | 77,30× la apuesta (100M de rondas) |
| **RTP de la compra** | **77,30 / 80 = 96,6 %** |

El precio NO es un número de diseño: se deriva del EV medido. Si cambian las
tiras, los paquetes o la paytable, hay que re-medir (`tools/sim.ts` lo imprime)
y re-fijar `BONUS_BUY_X` en `packages/games/classic20/src/tuning.ts`.

## Distribución de premios por ronda

| Premio | Rondas |
|---|--:|
| sin premio | 70,27 % |
| 0–1× | 15,14 % |
| 1–2× | 6,06 % |
| 2–5× | 5,88 % |
| 5–10× | 1,64 % |
| 10–20× | 0,49 % |
| 20–50× | 0,29 % |
| 50–100× | 0,12 % |
| 100–500× | 0,11 % |
| 500×+ | 0,01 % |

## Notas de diseño

**Por qué la Escalinata en vez de giros gratis planos.** Convierte el disparo
en dos momentos de suspenso (el disparo y la escalada), da un rango de
resultados con jerarquía (el nivel 1 es digno, la cima es una historia para
contar), y hace que la compra del bonus tenga suspenso propio.

**Por qué el multiplicador se acumula pesado en el tally.** Con paquetes de
multiplicador variable, `measure()` acumula las frecuencias de la feature ya
multiplicadas por el multiplicador del paquete. Así `RTP = Σ freq × premio`
sigue siendo lineal en los premios y el solver de la paytable no cambia.

**Por qué la compra usa muestreo por rechazo.** Cualquier otra construcción
("forzar 3 scatters en la grilla") cambia la distribución condicional y hace
mentiroso el RTP declarado de la compra. Re-tirar hasta disparar es
estadísticamente exacto y trivial de auditar.

**Por qué el rodillo 1 no tiene wilds.** Baja el RTP base sin tocar la
frecuencia de premio, hace especial al wild, y garantiza que una línea nunca
arranque con wild — lo que vuelve exacta la medición del tuner.

## Cómo reproducir estos números

```bash
node tools/sim.ts --rounds 100000000 --seed 31337
```

```bash
node tools/tune.ts --rounds 50000000
```

```bash
node --test packages/math/test/consistency.test.ts
```
