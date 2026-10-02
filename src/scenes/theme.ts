import Phaser from 'phaser';
import { ARENA_ART, H, W } from '../config';
import { arenaKey } from './PreloadScene';

/**
 * Identidade visual do jogo: fontes, cores e as peças desenhadas em código (painéis, botões, fundo).
 * Tudo é Graphics do Phaser, então fica nítido em qualquer escala de tela.
 */

/** Títulos, números e botões (carregada no index.html). */
export const FONT_DISPLAY = '"Lilita One", "Trebuchet MS", sans-serif';
/** Textos corridos. */
export const FONT_BODY = 'Nunito, "Segoe UI", system-ui, sans-serif';

export const THEME = {
  ink: 0x0a0f1f,
  panelTop: 0x1c2444,
  panelBottom: 0x0e1328,
  gold: 0xf5c451,
  goldDark: 0x8a5a1c,
  goldLight: 0xffe7a3,
  line: 0x2c3763,
  text: '#f1f5ff',
  muted: '#9aa7cf',
  goldText: '#ffd66b',
};

/** Clareia (amt > 0) ou escurece (amt < 0) uma cor. */
export function shade(color: number, amt: number): number {
  const c = Phaser.Display.Color.IntegerToColor(color);
  const f = (v: number) => Phaser.Math.Clamp(Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt)), 0, 255);
  return Phaser.Display.Color.GetColor(f(c.red), f(c.green), f(c.blue));
}

/** Estilo de título: fonte de jogo com contorno escuro e sombra. */
export function titleStyle(size: number, color = THEME.goldText): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT_DISPLAY,
    fontSize: `${size}px`,
    color,
    stroke: '#1a1030',
    strokeThickness: Math.max(3, Math.round(size / 6)),
    shadow: { offsetX: 0, offsetY: Math.max(2, Math.round(size / 12)), color: '#000000', blur: 0, fill: true, stroke: true },
  };
}

// ------------------------------------------------------------------ painel

export interface PanelOptions {
  /** Cor de destaque da borda (padrão: dourado). */
  accent?: number;
  radius?: number;
  /** Mostra os enfeites nos cantos. */
  ornaments?: boolean;
  alpha?: number;
}

/** Painel com fundo em degradê, borda dupla dourada e enfeites nos cantos. Origem no canto superior esquerdo. */
export class Panel extends Phaser.GameObjects.Container {
  private g: Phaser.GameObjects.Graphics;
  private accent: number;

  constructor(scene: Phaser.Scene, x: number, y: number, readonly w: number, readonly h: number, private opts: PanelOptions = {}) {
    super(scene, x, y);
    this.accent = opts.accent ?? THEME.gold;
    this.g = scene.add.graphics();
    this.add(this.g);
    this.draw();
    scene.add.existing(this);
  }

  /** Compatível com Rectangle.setStrokeStyle: só a cor importa (vira a cor de destaque). */
  setStrokeStyle(_width?: number, color?: number) {
    this.accent = color ?? THEME.gold;
    this.draw();
    return this;
  }

  private draw() {
    const { w, h } = this;
    const r = this.opts.radius ?? 14;
    const g = this.g.clear();
    // Sombra projetada.
    g.fillStyle(0x000000, 0.45).fillRoundedRect(4, 8, w, h, r);
    // Fundo em degradê vertical.
    g.fillGradientStyle(THEME.panelTop, THEME.panelTop, THEME.panelBottom, THEME.panelBottom, this.opts.alpha ?? 0.94);
    g.fillRoundedRect(0, 0, w, h, r);
    // Brilho suave no topo.
    g.fillStyle(0xffffff, 0.05).fillRoundedRect(4, 4, w - 8, Math.min(40, h / 3), { tl: r - 3, tr: r - 3, bl: 0, br: 0 });
    // Borda dupla: escura por fora, destaque por dentro.
    g.lineStyle(5, shade(this.accent, -0.55), 1).strokeRoundedRect(0, 0, w, h, r);
    g.lineStyle(2, this.accent, 1).strokeRoundedRect(3, 3, w - 6, h - 6, r - 3);
    g.lineStyle(1, shade(this.accent, 0.5), 0.35).strokeRoundedRect(6, 6, w - 12, h - 12, r - 5);
    if (this.opts.ornaments !== false) {
      for (const [cx, cy] of [[0, 0], [w, 0], [0, h], [w, h]]) gem(g, cx, cy, 9, this.accent);
      if (w > 240) {
        gem(g, w / 2, 0, 7, this.accent);
        gem(g, w / 2, h, 7, this.accent);
      }
    }
  }
}

/** Losango dourado com brilho, usado como enfeite. */
export function gem(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, color = THEME.gold) {
  g.fillStyle(shade(color, -0.6), 1).fillPoints(diamond(x, y + 1.5, r + 2.5), true);
  g.fillStyle(color, 1).fillPoints(diamond(x, y, r), true);
  g.fillStyle(shade(color, 0.6), 1).fillPoints(diamond(x - r * 0.25, y - r * 0.25, r * 0.4), true);
}

const diamond = (x: number, y: number, r: number) => [
  new Phaser.Math.Vector2(x, y - r),
  new Phaser.Math.Vector2(x + r, y),
  new Phaser.Math.Vector2(x, y + r),
  new Phaser.Math.Vector2(x - r, y),
];

// ------------------------------------------------------------------ botão

/**
 * Desenha um botão em relevo: base escura (dá a altura), corpo em degradê, brilho em cima e borda clara.
 * `pressed` afunda o botão na base.
 */
export function drawBevel(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number, pressed = false, radius?: number) {
  const r = radius ?? Math.min(18, h / 2.6);
  const lip = Math.max(4, Math.round(h * 0.09));
  const dy = pressed ? lip - 2 : 0;
  g.clear();
  g.fillStyle(0x000000, 0.4).fillRoundedRect(-w / 2 + 2, -h / 2 + lip + 4, w, h, r);
  g.fillStyle(shade(color, -0.55), 1).fillRoundedRect(-w / 2, -h / 2 + lip, w, h, r);
  g.fillGradientStyle(shade(color, 0.25), shade(color, 0.25), shade(color, -0.2), shade(color, -0.2), 1);
  g.fillRoundedRect(-w / 2, -h / 2 + dy, w, h, r);
  g.fillStyle(0xffffff, 0.22).fillRoundedRect(-w / 2 + 6, -h / 2 + dy + 4, w - 12, h * 0.38, { tl: r - 4, tr: r - 4, bl: 6, br: 6 });
  g.lineStyle(2.5, shade(color, 0.55), 0.9).strokeRoundedRect(-w / 2, -h / 2 + dy, w, h, r);
  g.lineStyle(2, 0x000000, 0.35).strokeRoundedRect(-w / 2 - 1.5, -h / 2 - 1.5, w + 3, h + lip + 3, r + 1);
  return dy;
}

// ------------------------------------------------------------------ fundo

/**
 * Fundo das telas de menu: o cenário da arena desfocado e escurecido, vinheta e brasas subindo.
 * Sem a arte, um degradê noturno.
 */
export function backdrop(scene: Phaser.Scene) {
  const key = arenaKey(ARENA_ART.id);
  scene.add.rectangle(W / 2, H / 2, W, H, THEME.ink);
  if (scene.textures.exists(key)) {
    const img = scene.add.image(W / 2, H / 2, key);
    img.setScale(Math.max(W / img.width, H / img.height) * 1.08);
    img.preFX?.addBlur(1, 2, 2, 1.2);
    img.setTint(0x6a76b8);
  }
  const g = scene.add.graphics();
  g.fillGradientStyle(0x0a0f1f, 0x0a0f1f, 0x0a0f1f, 0x0a0f1f, 0.35, 0.35, 0.85, 0.85).fillRect(0, 0, W, H);
  // Vinheta: faixas escuras nas bordas.
  for (let i = 0; i < 6; i++) {
    const a = 0.09;
    const s = i * 18;
    g.lineStyle(36, 0x000000, a).strokeRect(s - 18, s - 18, W - s * 2 + 36, H - s * 2 + 36);
  }
  embers(scene);
}

/** Partículas de brasa subindo devagar, dão vida aos menus. */
function embers(scene: Phaser.Scene) {
  const key = 'fx-ember';
  if (!scene.textures.exists(key)) {
    const t = scene.make.graphics({}, false);
    for (let r = 8; r > 0; r--) t.fillStyle(0xffd27a, 0.08 + (8 - r) * 0.06).fillCircle(8, 8, r);
    t.generateTexture(key, 16, 16);
    t.destroy();
  }
  scene.add.particles(0, 0, key, {
    x: { min: 0, max: W },
    y: H + 10,
    lifespan: 9000,
    speedY: { min: -40, max: -15 },
    speedX: { min: -8, max: 8 },
    scale: { start: 0.6, end: 0.1 },
    alpha: { start: 0.8, end: 0 },
    frequency: 260,
    blendMode: Phaser.BlendModes.ADD,
  });
}
