import Phaser from 'phaser';
import { ARENA_ART, COLORS, H, W } from '../config';
import { CHESTS, GODS, SPELLS, UNITS } from '../data/content';
import { FRAMES_JSON, RARITY_IDS, frameKey } from './frames';

/** Carrega as artes das cartas e os tokens da batalha (public/assets), com barra de progresso. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b1020);
    this.add.text(W / 2, H / 2 - 60, 'DUELO MÁGICO', { fontSize: '52px', fontStyle: 'bold', color: '#facc15' }).setOrigin(0.5);
    const bar = this.add.graphics();
    const label = this.add.text(W / 2, H / 2 + 50, 'Carregando…', { fontSize: '18px', color: '#94a3b8' }).setOrigin(0.5);
    this.load.on('progress', (p: number) => {
      bar.clear();
      bar.fillStyle(0x000000, 0.6).fillRoundedRect(W / 2 - 250, H / 2 + 10, 500, 20, 8);
      bar.fillStyle(COLORS.gold).fillRoundedRect(W / 2 - 250, H / 2 + 10, Math.max(8, 500 * p), 20, 8);
      label.setText(`Carregando… ${Math.round(p * 100)}%`);
    });
    // Arte ausente não trava o jogo: as telas caem de volta no emoji.
    this.load.on('loaderror', (file: Phaser.Loader.File) => console.warn(`Arte não encontrada: ${file.src}`));

    for (const r of RARITY_IDS) this.load.image(frameKey(r), `assets/frames/${r}.png`);
    this.load.json(FRAMES_JSON, 'assets/frames/frames.json');
    for (const s of SPELLS) {
      this.load.image(spellIconKey(s.id), `assets/spells/${s.id}.jpg`);
      this.load.image(spellRoundKey(s.id), `assets/spells/${s.id}.png`);
    }
    for (const g of GODS) {
      this.load.image(godPortraitKey(g.id), `assets/gods/${g.id}.jpg`);
      this.load.image(godFaceKey(g.id), `assets/gods/${g.id}.png`);
    }
    for (const c of CHESTS) this.load.image(chestKey(c.id), `assets/chests/${c.id}.png`);
    this.load.image(GROUND_KEY, 'assets/ground/meadow.jpg');
    this.load.image(arenaKey(ARENA_ART.id), `assets/arena/${ARENA_ART.id}.jpg`);
    for (const u of UNITS) {
      this.load.image(cardKey(u.id), `assets/cards/${u.id}.jpg`);
      this.load.image(tokenKey(u.id), `assets/tokens/${u.id}.png`);
    }
  }

  create() {
    this.scene.start('Home');
  }
}

export const cardKey = (id: string) => `card-${id}`;
export const spellIconKey = (id: string) => `spell-${id}`;
export const spellRoundKey = (id: string) => `spell-round-${id}`;
export const godPortraitKey = (id: string) => `god-${id}`;
export const godFaceKey = (id: string) => `god-face-${id}`;
export const chestKey = (id: string) => `chest-${id}`;
export const GROUND_KEY = 'ground-meadow';
export const arenaKey = (id: string) => `arena-${id}`;
export const tokenKey = (id: string) => `token-${id}`;

/**
 * Imagem que cobre exatamente w×h (como `object-fit: cover`), centrada na horizontal e um pouco
 * puxada para cima, onde fica o rosto dos personagens. Retorna null se a textura não existir.
 */
export function coverImage(scene: Phaser.Scene, key: string, w: number, h: number, x = 0, y = 0): Phaser.GameObjects.Image | null {
  if (!scene.textures.exists(key)) return null;
  const img = scene.add.image(x, y, key);
  const fw = img.frame.width;
  const fh = img.frame.height;
  const scale = Math.max(w / fw, h / fh);
  const cw = w / scale;
  const ch = h / scale;
  const cx = (fw - cw) / 2;
  const cy = (fh - ch) * 0.35;
  img.setScale(scale).setCrop(cx, cy, cw, ch);
  // Recentraliza: o recorte não muda a origem, então desloca a imagem para o centro do recorte ficar em (x, y).
  img.setPosition(x - (cx + cw / 2 - fw / 2) * scale, y - (cy + ch / 2 - fh / 2) * scale);
  return img;
}
