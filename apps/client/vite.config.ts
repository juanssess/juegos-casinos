import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Plugin de desarrollo: recibe una captura del canvas y la guarda en disco.
 *
 * Un slot se revisa mirándolo. Poder pedirle a la página que se fotografíe
 * sola —desde la consola o desde un script— hace que revisar un cambio visual
 * sea un comando y no un ida y vuelta manual. Solo corre en `vite dev`.
 */
function screenshotSink(): Plugin {
  const dir = resolve(import.meta.dirname, '.shots');
  return {
    name: 'maverick-screenshot-sink',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__shot', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end('POST only');
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString('utf8');
            const { name, data } = JSON.parse(body) as { name: string; data: string };
            const safe = name.replace(/[^a-z0-9._-]/gi, '_');
            const b64 = data.replace(/^data:image\/\w+;base64,/, '');
            mkdirSync(dir, { recursive: true });
            const file = resolve(dir, safe);
            writeFileSync(file, Buffer.from(b64, 'base64'));
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true, file }));
          } catch (e) {
            res.statusCode = 400;
            res.end(String(e));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [screenshotSink()],
  server: { port: 5173, open: false },
  // Rutas relativas: el build se sirve desde una subcarpeta del casino
  // (games/slots/), no desde la raíz.
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  optimizeDeps: {
    exclude: [
      '@casino/math',
      '@casino/protocol',
      '@casino/game-classic20',
      '@casino/game-sebusca',
    ],
  },
});
