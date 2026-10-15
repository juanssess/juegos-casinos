/**
 * El portero: ¿se pueden publicar estos juegos?
 *
 *   node tools/qa-check.ts            todos
 *   node tools/qa-check.ts kiosco     uno
 *
 * Sale con error si algún juego no pasó el QA, no lo aprobó, o cambió su
 * matemática después de medirlo. Lo llaman `build:casino` y la compilación
 * ilustrada del casino ANTES de compilar: un juego sin medir no entra.
 */

import { gameIds, loadGame } from './games.ts';
import { publishBlocker } from './qa-lib.ts';

const ids = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const problems: string[] = [];
for (const id of ids.length ? ids : gameIds()) {
  const why = publishBlocker(await loadGame(id));
  if (why) problems.push(`  ✗ ${id}: ${why}`);
  else console.log(`  ✓ ${id}`);
}
if (problems.length) {
  console.error('\nNo se puede publicar:\n' + problems.join('\n') + '\n');
  process.exit(1);
}
