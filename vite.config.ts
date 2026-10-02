import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Só em desenvolvimento: recebe as folhas de sprites geradas pelo renderizador
 * (tools/sprite-renderer) e grava em public/assets/sprites. Não existe no build.
 */
function saveSprites(): Plugin {
  const root = resolve(__dirname, 'public/assets/sprites');
  const safe = (s: string) => /^[a-z0-9-]+$/.test(s);
  return {
    name: 'save-sprites',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__sprites', (req, res) => {
        const url = new URL(req.url ?? '', 'http://x');
        const unit = url.searchParams.get('unit') ?? '';
        const anim = url.searchParams.get('anim') ?? '';
        if (req.method !== 'POST' || !safe(unit) || (anim && !safe(anim))) {
          res.statusCode = 400;
          res.end('requisição inválida');
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          const body = Buffer.concat(chunks);
          if (anim) {
            const file = join(root, unit, `${anim}.png`);
            mkdirSync(dirname(file), { recursive: true });
            writeFileSync(file, body);
          } else {
            // Sem `anim`: o corpo é o JSON com as medidas; entra no manifest geral.
            const manifestFile = join(root, 'manifest.json');
            const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {};
            manifest[unit] = JSON.parse(body.toString('utf8'));
            mkdirSync(root, { recursive: true });
            writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
          }
          res.end('ok');
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [saveSprites()],
});
