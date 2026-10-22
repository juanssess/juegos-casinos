# milonga (La Milonga) — Math Sheet

Juego #14, de la Fase 4 (producción en serie): la mecánica de **La Vendimia**
—racimos de 5 o más pegados, cascadas y una escalera de multiplicador que en
la función no vuelve atrás— con **otra volatilidad** y la piel de una milonga
de San Telmo.

<!-- qa:inicio -->
## QA automático — APROBADO

Generado por `npm run qa -- --game milonga` el 2026-10-22. No editar a mano: se reescribe en cada corrida.
Huella de la matemática: `b6cd089623d51f73`.

| | |
|---|---|
| RTP | **96,46 % ± 0,08** (800M de rondas; objetivo 96,50 %) |
| Reparto | base 58,44 % · giros gratis 38,02 % |
| Frecuencia de premio | 47,7 % |
| Bonus | 1 de cada 244 rondas · 8,02 giros por disparo |
| Volatilidad | alta (índice 18,5; desvío 11,23) |
| Tope | 10.000× · mayor premio medido 10000× |
| Compra "La Milonga" | 100,4× · EV 96,95× ± 0,2 (2M) → RTP 96,56 % |
| Compra "Milonga larga" | 257,8× · EV 248,61× ± 0,34 (2M) → RTP 96,43 % |
| Compra "Tanda de lujo" | 172,5× · EV 167,1× ± 0,26 (2M) → RTP 96,87 % |
| Apuesta ante | 1,28× · RTP 96,46 % ± 0,12 · bonus 1 de cada 115 |

Controles:

- ✓ RTP 96,46 % ± 0,08 contra el objetivo 96,50 % (tolerancia ±0,20)
- ✓ precisión de la medición ±0,08 puntos (máximo ±0,15; si no alcanza, más rondas)
- ✓ compra "La Milonga" a 100,4×: EV 96,95× ± 0,2 → RTP 96,56 % (tolerancia ±0,50)
- ✓ compra "Milonga larga" a 257,8×: EV 248,61× ± 0,34 → RTP 96,43 % (tolerancia ±0,50)
- ✓ compra "Tanda de lujo" a 172,5×: EV 167,1× ± 0,26 → RTP 96,87 % (tolerancia ±0,50)
- ✓ ante a 1,28×: RTP 96,46 % ± 0,12, +0,00 puntos contra el juego normal (admitido de -0,50 a +1,00)
- ✓ tope 10.000×: el mayor premio medido fue 10000× (tiene que llegar al 50 % del tope para no ser decorativo)
- ⚠ frecuencia de premio 47,7 % (el mercado: 25 % a 35 %)
- ✓ bonus 1 de cada 244 rondas (el mercado: de 150 a 400)
- ✓ tope 10.000× (el mercado: 5.000× a 25.000×)
<!-- qa:fin -->

## Qué cambia contra La Vendimia

| | La Vendimia | La Milonga |
|---|---|---|
| Escalera | ×1, ×2, ×3, ×5, ×8, ×12, ×20, ×30, ×50 | ×1, ×2, ×4, ×8, ×15, ×25, ×40, ×60, ×100 |
| Discos/barricas por columna | 2 en todas | [2, 1, 2, 2, 1, 2] |
| Función | 1 de cada ~115 | 1 de cada ~243 |
| Tope | 5.000× | 10.000× |
| Peso de la función en el RTP | menor | ~39 % |

## Decisiones de diseño (medidas)

- **Escalera más empinada**: cada cascada casi duplica. Con la escalera de La
  Vendimia y menos scatters la función quedaba chica; con esta, la función
  aporta ~39 % del RTP y el QA rápido llegó a 9.924× (tope 10.000×).
- **Menos discos en dos columnas**: la función pasa de 1/115 a 1/243, dentro
  del rango del mercado (150 a 400) y acorde a la volatilidad alta.
- **Ante con un disco por columna** ([2,2,2,2,2,2]): retorno bruto 123,4 %,
  precio justo 1,28×, el bonus sale el doble (ver `tuning.ts`).
- **Compras**: 100,4× (8 giros), 257,8× (12 giros) y 172,5× (8 giros desde
  ×4). Precios del QA rápido; el QA completo los confirma.

## Reproducir

```
npm run tune -- --game milonga --rounds 2e7
npm run qa -- --game milonga
```
