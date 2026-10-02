// Valida as referências cruzadas do conteúdo (src/data/content). Uso: npm run validate
import { build } from 'esbuild';

const out = await build({
  entryPoints: ['src/data/content/index.ts'],
  bundle: true, format: 'esm', platform: 'node', write: false,
});
const mod = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
const problems = mod.validateContent();
console.log(`${mod.UNITS.length} tropas, ${mod.SPELLS.length} magias, ${mod.GODS.length} deuses`);
if (problems.length) {
  console.error('Problemas no conteúdo:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log('Conteúdo OK');
