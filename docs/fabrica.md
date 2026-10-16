# La fábrica de juegos

Cómo se hace un juego nuevo, de la idea al casino. Es la Fase 1 del plan:
que cada juego cueste menos que el anterior y que ninguno llegue al casino
sin estar medido.

## El recorrido

```
npm run new-game -- --id feria --mechanic cualquier-lado --title "La Feria"
```

1. **Nace jugable.** `new-game` copia un juego de la casa que ya pasó el QA
   (el *molde*) y le cambia el id y el título. Mecánicas disponibles:

   | Mecánica | Molde | Qué es |
   |---|---|---|
   | `lineas` | classic20 (Maverick) | 5×3, 20 líneas, La Escalinata |
   | `pegajosos` | sebusca | 5×5, 15 líneas, wilds que se quedan con multiplicador |
   | `racimos` | vendimia | 6×5, racimos pegados, cascadas con escalera |
   | `cualquier-lado` | kiosco | 6×5, 8 iguales en cualquier lado, bombas |
   | `acumulados` | carnaval | 6×5, 8 iguales en cualquier lado, multiplicadores en la base y que se acumulan en la función |
   | `hold-win` | feria | 5×3, 20 líneas, monedas que se quedan y re-giros; llenar la pantalla paga el Grand |
   | `caminos` | cataratas | 6 columnas de 2 a 7 símbolos, hasta 117.649 caminos, cascadas; en la función cada cascada suma uno al multiplicador |
   | `crash` | ruta40 | original: el multiplicador sube hasta quebrar, retiro manual o automático |
   | `mines` | famatina | original: 5×5 con 1 a 24 cargas, cobrar cuando quieras |
   | `plinko` | kermes | original: la bolita entre clavos, 8/12/16 filas y tres riesgos |

   Desde ese momento ya se juega en `npm run dev` → `?game=feria`, aparece en
   `sim`, `tune` y `qa`, y tiene sus pruebas de consistencia. No hay ningún
   registro que tocar: herramientas y cliente descubren los manifests.

2. **El tema** — `packages/games/feria/src/theme.ts`: nombres de los
   símbolos, paleta y tiempos. Y los textos del cliente (apuestas, pie,
   carteles) en `src/manifest.ts`.

3. **La matemática** — tiras en `src/index.ts`, objetivos en `src/tuning.ts`,
   y el solver:

   ```
   npm run tune -- --game feria --rounds 1e8
   ```

   Pegar la tabla que propone en `index.ts`. Precios de compra y ante con
   `npm run buyprice` y `npm run sim -- --ante`.

4. **El arte pintado** — todo lo que ve el jugador es ilustración pintada.
   Primero la dirección de arte en `src/art.ts` (qué es cada símbolo, cómo
   es la escena; en inglés). Después:

   ```
   npm run art -- prompts --game feria      los dos pedidos, con la receta de la casa
   (Claude genera la hoja y la escena con el conector de Gamma)
   npm run art -- cut --game feria --sheet hoja.jpg --scene escena.jpg
   ```

   `cut` guarda las fuentes en `art/source/`, recorta, arma `art/symbols.png`,
   `art/scene.jpg` y `art/art.json`, y deja una vista de control para mirar
   los bordes. Si un objeto tiene partes del color del fondo (el palito
   blanco de un chupetín), se protegen con `--protect "celda:x,y x,y ..."` y
   se repite con `npm run art -- recut`. Mientras tanto el juego usa el arte
   del molde, marcado como provisorio, y no se publica.

   El cliente carga ese arte solo, suelto y en el casino: no hay que tocar
   nada más. El dibujo procedural de `apps/client/src/skins/` queda de
   respaldo.

5. **El QA** — la medición en serio, en todos los núcleos:

   ```
   npm run qa -- --game feria           ~3 a 10 min según la volatilidad
   npm run qa -- --game feria --quick   una décima, para mirar (no escribe)
   ```

   Escribe `src/qa.ts` (el RTP y la volatilidad que muestra el cliente salen
   de ahí) y el bloque "QA automático" de la ficha. Controla:

   | Control | Nivel | Criterio |
   |---|---|---|
   | RTP | frena | a ±0,2 puntos del objetivo |
   | Precisión | frena | intervalo de ±0,15 o menos (si no, más rondas: `--rounds 3e9`) |
   | Compra del bonus | frena | cada variante a ±0,5 del objetivo |
   | Apuesta ante | frena | de −0,5 a +1 punto contra el juego normal |
   | Tope | frena | el mayor premio medido llega al 50 % del tope declarado |
   | Frecuencia de premio | aviso | 25 % a 35 % |
   | Frecuencia del bonus | aviso | 1 de cada 150 a 400 |
   | Tope de mercado | aviso | 5.000× a 25.000× |
| Arte pintado propio | frena (en el portero) | atlas con todos los símbolos en juego, escena, no provisorio |

6. **Al casino** — la compilación ilustrada del casino y `build:casino`
   corren antes `npm run qa:check`, que frena si algún juego no tiene QA,
   no lo aprobó, o **cambió su matemática después del QA** (cada QA guarda
   la huella de los archivos que deciden los pagos). `--sin-qa` existe solo
   para probar localmente y no se publica.

## Los originales

Crash, Mines y Plinko no son tragamonedas: no tienen tiras, ni tabla que
resolver, ni giros gratis. Su matemática vive en `packages/math/src/originals.ts`
y es CERRADA: el RTP se calcula exacto y es el mismo para cualquier
estrategia (retirarse en ×1,5 o en ×500, una carga o veinte). El manifest
es `kind: 'original'` con un `def` (`CrashDef`, `MinesDef` o `PlinkoDef`).

- **El QA** no estima el RTP: lo calcula en todas las configuraciones (los
  retiros típicos de Crash, las 256 combinaciones de cargas y rocas de
  Mines, las nueve tablas de Plinko) y simula el motor —con el mismo sorteo
  y el mismo redondeo que el cliente— para controlar que pague lo que dice
  la fórmula. Frena si una configuración se va del objetivo o si el motor
  se separa de la fórmula.
- **El arte** son piezas (el camión, la dinamita, la bolita) numeradas como
  los símbolos: el mismo pedido, el mismo recorte y el mismo atlas. La pieza
  1 es la portada del lobby.
- **El cliente** es otro (`apps/client/src/originals/`): mueble en HTML con
  controles de formulario, la escena pintada y Pixi para el juego. La
  billetera habla con el casino con los mismos mensajes que las
  tragamonedas (`debit` y `settle`), y una jugada a medias se retoma.
- **Los pagos** se redondean a fichas sin cambiar su valor esperado
  (`roundPay`): 20 × 1,03 = 20,6 se paga 21 seis de cada diez veces.

## Dónde vive cada cosa

```
packages/games/<id>/src/
  index.ts      la definición matemática (tiras, tabla, tope)
  tuning.ts     objetivos de diseño y precios medidos
  theme.ts      nombres, paleta, tiempos
  manifest.ts   todo lo anterior junto, más los textos del cliente
  qa.ts         lo escribe el QA; no se edita
  art.ts        dirección de arte: qué es cada símbolo y la escena
packages/games/<id>/art/
  symbols.png, scene.jpg, art.json   el arte pintado que carga el cliente
  source/       las imágenes generadas, para poder recortar de nuevo
apps/client/src/
  skins/<id>.ts         dibujo procedural de respaldo (lo único de Pixi por juego)
  render/painted.ts     carga el arte pintado del juego
  originals/            el cliente de los originales: Crash, Mines, Plinko
  play/                 cómo se reproduce una ronda: líneas, racimos
  ui/                   mueble, menú de compra, tabla de pagos
  presentation-base.ts  fondo pintado y pantallas de la función
  presentation.ts       el módulo que el casino reemplaza por el suyo
```

## El casino

Su presentación propia está en `Casino (PRUEBA)/tools/provider/presentation.ts`:
se construye sobre `apps/client/src/presentation-base.ts` y agrega solo lo
que es del casino (las pantallas de MCCinema y la atmósfera de Maverick).
La compilación del casino reemplaza ese único módulo; el arte, los fondos y
los ajustes visuales ya vienen en el juego.

La compilación del casino también exporta el arte de cada juego al lobby
(`assets/illustrated/provider/`, con un índice): la portada, el banner y la
pantalla del bonus de un juego nuevo salen de ahí sin tocar código.

Lo que todavía es a mano en el casino: la entrada del catálogo y del banner,
los textos de MCCinema (`src/ui/cinema.js`) y del asistente, y el color de
su pantalla del bonus (`cinema.css`). Ver cómo se sumó La Feria.
