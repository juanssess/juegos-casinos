/**
 * ¿El jugador pidió menos movimiento? (ajuste del sistema operativo)
 *
 * Con esto encendido no hay temblores de pantalla, ráfagas de partículas ni
 * deformaciones de los símbolos: el juego se entiende igual sin ellos, y a
 * quien se marea con el movimiento le ahorra el mal rato.
 */
export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
