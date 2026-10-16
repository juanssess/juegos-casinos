# Bonus de Zona Muerta y La Familia

## Referencias consultadas

- [Zombie Carnival — Pragmatic Play, 2 de junio de 2022](https://www.pragmaticplay.com/en/news/pragmatic-play-delivers-eerily-entertaining-title-in-zombie-carnival/): en el bonus los wilds permanecen, se desplazan al consumir un scatter y aumentan su multiplicador. Es la referencia de movimiento y crecimiento para La cacería.
- [Mafia Gold — Play’n GO, 1 de agosto de 2024](https://www.playngo.com/games/mafia-gold): las balas dañan a cuatro rivales; derrotarlos da giros adicionales y transforma sus símbolos. Al vencerlos a todos se abre Cash Hit, con premios de cajas fuertes cobrados por fila. Es la referencia de progresión para Guerra de familias.

Se adaptaron esas estructuras a tableros, símbolos, probabilidades, arte y música propios. No son implementaciones idénticas: los datos del proveedor no incluyen sus tiras ni la distribución matemática completa.

## Zona Muerta: La cacería

- Base de grupos conectados y cascadas. El bonus cambia a una evaluación por giro, sin cascadas ni retriggers.
- Dos infectados persistentes en posiciones distintas. Cada radio libre atrae al más cercano por distancia Manhattan; el empate favorece al primero. Las radios se consumen en orden de celda.
- El infectado se mueve y suma una unidad de potencia, hasta ×20. La celda que abandona recupera el símbolo de la tira; si allí había una radio, pasa a munición.
- Cada grupo paga la tabla por ×3 y por la suma de potencia de los infectados persistentes que participan. Si ninguno participa, usa potencia uno. Los wilds comunes también sustituyen, pero no acumulan potencia.
- Compras: La cacería (8 giros), Noche sin salida (12), Contagio avanzado (8, ambos infectados en ×3). Precios medidos por separado.
- El bonus activa ocho poses de carrera por personaje, persecución, niebla y luz roja gradual. El tablero mantiene contraste. Se respeta movimiento reducido y se pausa al ocultar la página.

## La Familia: Guerra de familias

- Base de 20 líneas. Seis bolsas disparan ocho giros de campaña; las bolsas no llevan premios monetarios.
- Cuatro bandas con seis unidades de resistencia cada una. Por giro se sortean 0/1/2/3/4 balas con pesos 350/300/200/100/50 sobre 1.000.
- Cada bala golpea al primer rival vivo; el sobrante pasa al siguiente. Los tres primeros dan dos giros extra cada uno; el Don da cuatro.
- Los símbolos H2/H3/H4/L1 pasan a Jefe al derrotar a sus bandas, desde ese mismo giro. La tabla de líneas del bonus es 48 % de la base, redondeada a fichas enteras; el jugador ve esta regla en la ayuda.
- Desde el giro posterior a vencer a las cuatro bandas, cada Jefe cobra el valor de la caja de su fila. Tres sorteos independientes por giro: valores 0/1/2/5/10/25/100/5.000×, pesos 288.998/250.000/250.000/150.000/50.000/10.000/1.000/2 sobre 1.000.000.
- Tope de ronda: 5.000×, incluido el base; alcanzar el tope termina la ronda. El premio de caja de 5.000× es alcanzable y está cubierto por una prueba forzada.

## Integración y verificación

Los motores viven en cada paquete de juego. La biblioteca matemática compartida no fue modificada. Ambos caminos, detallado y rápido, usan la misma secuencia de sorteos. El estado opcional story viaja en cada paso, se persiste con la ronda y permite reproducir movimientos, balas, resistencia, ascensos y cobros sin que el cliente decida premios.

El cliente conserva compatibilidad de reproducción para rondas antiguas de La Familia con Hold & Win. No reemplaza su resultado ni vuelve a cobrarlas.

Las fichas generadas por tools/qa.ts contienen las mediciones definitivas, sus intervalos y los precios de compra. El portero de publicación exige QA aprobado y huella matemática vigente. tools/measure-story-bonuses.ts sirve para exploración y no reemplaza ese control.

La selección de compilación conserva todos los juegos publicados y excluye trabajos sin aprobar. No se editaron Dunas ni El Gran Premio.

## Arte de acción

Generado con la herramienta integrada image_gen, usando actors.png como referencia de identidad. El original está en packages/games/zonamuerta/art/source/chase.png; el atlas normalizado está en art/chase.png. La hoja generada no tenía celdas perfectamente uniformes: se separaron sus dieciséis figuras y se empacaron en celdas de 400 px con los pies alineados. Los recortes y el prompt completo se guardan en art/prompts.json.

Los nuevos símbolos del infectado y del Jefe derivan de nuestros mismos personajes, preservando transparencia. Las instrucciones de recorte de ambos están en sus archivos art/prompts.json. tools/repack-story-art.ts permite repetir el empaquetado.
