/**
 * Compila el cliente y lo copia dentro del casino.
 *
 *   npm run build:casino
 *
 * Los dos juegos salen de UN solo build: se eligen por `?game=` en la URL,
 * así que el casino apunta dos cartas al mismo `index.html`.
 *
 * Por qué copiar en vez de apuntar el iframe al servidor de desarrollo:
 * sirviendo todo desde el mismo origen, el puente de billetera puede validar
 * con una comparación estricta contra `location.origin` en lugar de confiar
 * en un comodín. Y de paso el casino queda auto-contenido: un solo servidor.
 */

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'apps/client/dist');

// El casino vive al lado, en el escritorio. Se puede pisar con la variable
// de entorno por si alguien lo tiene en otro lado.
const casino =
  process.env.CASINO_DIR ?? resolve(root, '..', 'Casino (PRUEBA)');
const target = resolve(casino, 'games/slots');

if (!existsSync(casino)) {
  console.error(`No encuentro el casino en:\n  ${casino}\n`);
  console.error('Pasá la ruta con CASINO_DIR=... si lo tenés en otro lado.');
  process.exit(1);
}

console.log('Compilando el cliente...');
execFileSync('npm', ['run', 'build'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

console.log(`\nCopiando a ${target}`);
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(dist, target, { recursive: true });

console.log('\nListo. Levantá el casino con un servidor http:\n');
console.log(`  cd "${casino}"`);
console.log('  python -m http.server 8123\n');
console.log('y entrá a http://localhost:8123');
