# Juegos de casino

Motor de slots y juegos, pensado como **proveedor de juegos** antes que como
casino: cada juego habla un protocolo de servidor (RGS) para poder enchufarse
después a un lobby propio, a un agregador o a un operador ajeno.

Requiere **Node ≥ 22.6**. No hay paso de build: Node corre TypeScript directo.

```bash
npm install
```

## Estructura

```
packages/math/              motor genérico — RNG, evaluador, simulador, tuner
packages/protocol/          contrato del RGS (solo tipos, sin dependencias)
packages/games/classic20/   juego #1: 5×3, 20 líneas, Escalinata
packages/games/sebusca/     juego #2: 5×5, 15 líneas, pegajosos multiplicadores
apps/client/                cliente PixiJS único, multi-juego
tools/sim.ts                simulador Monte Carlo
tools/tune.ts               resuelve la paytable para un RTP objetivo
tools/buyprice.ts           mide el EV del bonus y fija el precio de la compra
docs/                       math sheets
```

Un juego con mecánica propia (como los pegajosos de Se Busca) trae su propio
motor implementando `RoundEngine`; el simulador, el tuner y el RGS lo consumen
sin enterarse de la mecánica.

`packages/math` no conoce gráficos, ni red, ni tema. Son funciones puras más un
RNG inyectable. Eso es lo que permite correr 200 millones de rondas en dos
minutos y, con el mismo código, resolver una ronda real en producción.

## Comandos

```bash
node tools/sim.ts --game sebusca --rounds 200000000 --seed 777
```

```bash
node tools/tune.ts --game sebusca --rounds 40000000
```

```bash
node tools/buyprice.ts --game sebusca --rounds 2000000
```

```bash
npm test
```

```bash
npm run typecheck
```

## Cómo se tunea un juego acá

El RTP es lineal en los premios:

```
RTP = Σ  frecuencia(símbolo, cantidad) × premio(símbolo, cantidad)
```

Las **frecuencias** dependen solo de las tiras de rodillo. Los **premios** son
variables libres. Entonces:

1. `tools/tune.ts` mide las frecuencias una vez (caro: 50M rondas, ~30 s).
2. Resuelve los premios que cumplen el RTP objetivo y el reparto por símbolo
   declarado en `packages/games/<juego>/src/tuning.ts` (gratis: es álgebra).
3. Verifica que la tabla resultante sea monótona — que un símbolo bajo no
   termine pagando más que uno alto.
4. `tools/sim.ts` valida el resultado con un Monte Carlo independiente.

Regla práctica: **para cambiar cómo se siente el juego** (volatilidad, cada
cuánto entra la feature) se tocan las **tiras** y hay que volver a medir. **Para
cambiar el RTP** se tocan los **premios** y no hace falta re-medir.

Nunca editar la paytable a mano: el RTP declarado deja de ser cierto.

## Juegos

| Juego | Formato | RTP | Volatilidad | Feature |
|---|---|---|---|---|
| [classic20 / Maverick](docs/classic20-math-sheet.md) | 5×3, 20 líneas | 96,66 % | Media-alta (15,2) | La Escalinata: escalás una pirámide y el nivel define el paquete de giros |
| [sebusca / Se Busca](docs/sebusca-math-sheet.md) | 5×5, 15 líneas | 96,44 % | **Muy alta (59,0)** | Wilds pegajosos ×2 a ×50 que se multiplican entre sí · tope 10.000× |

Los dos tienen compra de bonus con precio **derivado del EV medido**, no
inventado.

Correr:

```bash
npm run dev
```

Después: `http://localhost:5173/?game=classic20` o `?game=sebusca`.

Cliente único en `apps/client`: PixiJS 8, RGS local con el contrato de
`packages/protocol` (wallet, recuperación de ronda, compra de bonus), sonido
100 % sintetizado, turbo, autoplay, slam stop y pantalla de info. El juego se
elige por URL — el orquestador no sabe cuál está corriendo; cada juego aporta
su math, su motor, su tema, sus símbolos y su escenografía.

## Integración con el casino (Bubba Games)

Los dos juegos corren embebidos en el casino compartiendo **una sola
billetera**: la de Bubba. Para compilarlos e instalarlos ahí:

```bash
npm run build:casino
```

Compila el cliente y lo copia a `games/slots/` del casino. Después se levanta
el casino con un servidor http (`python -m http.server 8123`) y las dos
tragamonedas aparecen en el lobby.

Cómo funciona: con `?wallet=parent` el cliente usa `BridgeRgs` en vez de
`LocalRgs`. Misma interfaz `RgsClient`, distinta procedencia de la plata — el
juego le pide al casino que debite y acredite por `postMessage`, y el casino
lo pasa por su billetera y su `recordRound()`. Ni el motor, ni los rodillos,
ni el HUD se enteran.

Que esto haya sido un archivo nuevo y una línea en `main.ts` es el pago del
contrato que definimos antes de dibujar el primer rodillo.

## Qué falta

- [ ] Servidor RGS real (Node) detrás del mismo contrato — el cliente no cambia
- [ ] Arte y audio producidos para reemplazar los placeholders procedurales
- [ ] Juego #3: 6×5 scatter-pays con cascadas, el género que falta probar
