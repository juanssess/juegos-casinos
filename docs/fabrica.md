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

4. **El arte pintado** — atlas de símbolos y escena, con la receta de
   `Casino (PRUEBA)/assets/illustrated/README.md`. Mientras no esté, el juego
   usa el dibujo del molde (`apps/client/src/skins/feria.ts`).

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

6. **Al casino** — la compilación ilustrada del casino y `build:casino`
   corren antes `npm run qa:check`, que frena si algún juego no tiene QA,
   no lo aprobó, o **cambió su matemática después del QA** (cada QA guarda
   la huella de los archivos que deciden los pagos). `--sin-qa` existe solo
   para probar localmente y no se publica.

## Dónde vive cada cosa

```
packages/games/<id>/src/
  index.ts      la definición matemática (tiras, tabla, tope)
  tuning.ts     objetivos de diseño y precios medidos
  theme.ts      nombres, paleta, tiempos
  manifest.ts   todo lo anterior junto, más los textos del cliente
  qa.ts         lo escribe el QA; no se edita
apps/client/src/
  skins/<id>.ts         fábrica de símbolos y escenografía (lo único de Pixi)
  play/                 cómo se reproduce una ronda: líneas, racimos
  ui/                   mueble, menú de compra, tabla de pagos
  presentation.ts       fondo y pantallas de la función (el casino trae la suya)
```

## El casino

Su presentación propia (fondos pintados, MCCinema, atmósfera de Maverick)
está en `Casino (PRUEBA)/tools/provider/presentation.ts` y cumple el
contrato de `apps/client/src/presentation-types.ts`. La compilación del
casino reemplaza ese módulo y los cuatro archivos de símbolos; no toca
`main.ts`.

Lo que todavía es a mano en el casino: la entrada del catálogo, el banner,
el tema de MCCinema y la portada (ver cómo se sumó El Kiosco en el commit
87aa1f4 del casino).
