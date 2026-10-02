import Phaser from 'phaser';
import { FONT_DISPLAY, THEME, backdrop, drawBevel, shade, titleStyle, type Panel } from './theme';
import { chestKey } from './PreloadScene';
import { COLORS, H, W } from '../config';
import { ARENAS, FREE_CHEST, TUTORIAL, chestById, godById, spellById, unitById } from '../data/content';
import type { Difficulty } from '../battle/Loadout';
import { claimFreeChest, openChest, slotState, startUnlock, tickFreeChests } from '../meta/chests';
import { currentArena } from '../meta/progress';
import { activeDeck, getProfile, getSave, isDeckComplete, updateSave } from '../save/save';
import { ArtIcon, button, hex, panel, resourceBar, showChestReward, toast, UnitTile, type Button } from './ui';

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'facil', label: 'Fácil' },
  { id: 'normal', label: 'Normal' },
  { id: 'dificil', label: 'Difícil' },
];

interface SlotView {
  bg: Phaser.GameObjects.Graphics;
  /** Área de toque. */
  hit: Phaser.GameObjects.Zone;
  icon: ArtIcon;
  glow: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  name: Phaser.GameObjects.Text;
  status: Phaser.GameObjects.Text;
}

const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}h${String(m).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
};

/** Tela inicial: recursos, deck ativo, arena, baús e atalhos. */
export class HomeScene extends Phaser.Scene {
  private refreshBar!: () => void;
  private deckTitle!: Phaser.GameObjects.Text;
  private godText!: Phaser.GameObjects.Text;
  private spellsText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private deckFrame!: Panel;
  private tiles: UnitTile[] = [];
  private arenaTitle!: Phaser.GameObjects.Text;
  private arenaDesc!: Phaser.GameObjects.Text;
  private arenaBar!: Phaser.GameObjects.Graphics;
  private arenaNext!: Phaser.GameObjects.Text;
  private diffButtons: { id: Difficulty; g: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text }[] = [];
  private slots: SlotView[] = [];
  private freeChest!: SlotView;
  private battleBtn!: Button;
  private modalOpen = false;

  constructor() {
    super('Home');
  }

  create() {
    this.tiles = [];
    this.diffButtons = [];
    this.slots = [];
    this.modalOpen = false;
    backdrop(this);
    this.refreshBar = resourceBar(this);

    // ---------------- deck ativo
    this.deckFrame = panel(this, 30, 64, 620, 270);
    this.arrow(62, 94, '◀', -1);
    this.arrow(618, 94, '▶', 1);
    this.deckTitle = this.add.text(340, 94, '', titleStyle(22, '#ffffff')).setOrigin(0.5);
    this.godText = this.add.text(340, 130, '', titleStyle(22)).setOrigin(0.5);
    this.spellsText = this.add.text(340, 164, '', { fontSize: '16px', color: '#e2e8f0' }).setOrigin(0.5);
    for (let i = 0; i < 8; i++) {
      const tile = new UnitTile(this, 340 + (i - 3.5) * 74, 240, 66, 82);
      tile.on('pointerdown', () => this.scene.start('Deck'));
      this.tiles.push(tile);
    }
    this.statusText = this.add.text(340, 310, '', { fontSize: '15px', color: '#f87171' }).setOrigin(0.5);

    // ---------------- arena e dificuldade
    panel(this, 670, 64, 580, 270);
    this.arenaTitle = this.add.text(960, 98, '', titleStyle(28)).setOrigin(0.5);
    this.arenaDesc = this.add.text(960, 140, '', { fontSize: '15px', color: '#cbd5e1', align: 'center', wordWrap: { width: 540 } }).setOrigin(0.5);
    this.arenaBar = this.add.graphics();
    this.arenaNext = this.add.text(960, 208, '', { fontSize: '14px', color: '#94a3b8' }).setOrigin(0.5);
    this.add.text(960, 246, 'DIFICULDADE DA IA', { fontFamily: FONT_DISPLAY, fontSize: '15px', color: THEME.muted }).setOrigin(0.5);
    DIFFICULTIES.forEach((d, i) => {
      const x = 960 + (i - 1) * 160;
      const g = this.add.graphics({ x, y: 288 });
      const label = this.add.text(x, 288, d.label, titleStyle(20, '#ffffff')).setOrigin(0.5);
      this.add.zone(x, 292, 145, 50).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        updateSave((s) => (s.difficulty = d.id));
        this.refresh();
      });
      this.diffButtons.push({ id: d.id, g, label });
    });

    // ---------------- baús
    this.add.text(34, 364, 'BAÚS', titleStyle(22)).setOrigin(0, 0.5);
    for (let i = 0; i < 4; i++) this.slots.push(this.slotView(130 + i * 175, 450, () => this.tapSlot(i)));
    this.freeChest = this.slotView(1060, 450, () => this.tapFreeChest(), 0x1f6b3a);

    // ---------------- ações
    button(this, 140, 620, '🃏 Deck', 0x374151, () => this.scene.start('Deck'), { w: 210, h: 70, fontSize: 24 });
    button(this, 370, 620, '🔥 Deuses', 0x374151, () => this.scene.start('Gods'), { w: 210, h: 70, fontSize: 24 });
    button(this, 600, 620, '📖 Coleção', 0x374151, () => this.scene.start('Collection'), { w: 210, h: 70, fontSize: 24 });
    this.battleBtn = button(this, 1000, 620, 'BATALHAR ⚔️', COLORS.player, () => this.startBattle(), { w: 420, h: 90 });

    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.refreshChests() });
    this.refresh();
  }

  private slotView(x: number, y: number, onTap: () => void, fill = 0x1c2444): SlotView {
    const glow = this.add.graphics({ x, y });
    const bg = this.add.graphics({ x, y });
    bg.setData('fill', fill);
    const icon = new ArtIcon(this, x, y - 18, 92);
    const name = this.add.text(x, y + 38, '', { fontFamily: FONT_DISPLAY, fontSize: '15px', color: '#e8ecff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
    const status = this.add.text(x, y + 58, '', { fontFamily: FONT_DISPLAY, fontSize: '15px', color: THEME.muted, stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
    const hit = this.add.zone(x, y, 160, 150).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', onTap);
    return { bg, hit, icon, glow, x, y, name, status };
  }

  /** Moldura do espaço de baú: cor da borda conforme o estado, com brilho pulsante quando dá para abrir. */
  private drawSlot(v: SlotView, border: number, filled: boolean, pulse: boolean) {
    const fill = v.bg.getData('fill') as number;
    const g = v.bg.clear();
    g.fillStyle(0x000000, 0.45).fillRoundedRect(-78, -66, 160, 146, 14);
    g.fillGradientStyle(shade(fill, 0.15), shade(fill, 0.15), shade(fill, -0.45), shade(fill, -0.45), filled ? 0.95 : 0.55);
    g.fillRoundedRect(-80, -72, 160, 146, 14);
    // Pedestal sob o baú.
    if (filled) g.fillStyle(0x000000, 0.35).fillEllipse(0, 18, 110, 22);
    g.lineStyle(3, border, filled ? 1 : 0.5).strokeRoundedRect(-80, -72, 160, 146, 14);
    g.lineStyle(1, 0xffffff, 0.12).strokeRoundedRect(-76, -68, 152, 138, 11);
    v.glow.clear();
    if (pulse) {
      for (let i = 3; i > 0; i--) v.glow.lineStyle(i * 4, border, 0.12).strokeRoundedRect(-80, -72, 160, 146, 14);
      if (!v.glow.getData('tween')) {
        v.glow.setData('tween', this.tweens.add({ targets: v.glow, alpha: { from: 1, to: 0.25 }, duration: 800, yoyo: true, repeat: -1 }));
      }
    } else {
      (v.glow.getData('tween') as Phaser.Tweens.Tween | undefined)?.remove();
      v.glow.setData('tween', null).setAlpha(1);
    }
  }

  private arrow(x: number, y: number, label: string, delta: number) {
    const t = this.add.text(x, y, label, { fontSize: '28px', color: '#cbd5e1' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t.on('pointerdown', () => {
      updateSave((s) => (s.activeDeck = (s.activeDeck + delta + s.decks.length) % s.decks.length));
      this.refresh();
    });
  }

  // ------------------------------------------------------------ baús

  private tapSlot(i: number) {
    if (this.modalOpen) return;
    const p = getProfile();
    const state = slotState(p, i);
    if (state === 'locked') {
      if (!updateSave((s) => startUnlock(s, i))) toast(this, 'Já tem um baú abrindo. Um por vez!');
    } else if (state === 'ready') {
      const reward = updateSave((s) => openChest(s, i));
      if (reward) this.showReward(reward);
    } else if (state === 'unlocking') {
      toast(this, 'Ainda abrindo…');
    } else {
      toast(this, 'Vença batalhas para ganhar baús');
    }
    this.refresh();
  }

  private tapFreeChest() {
    if (this.modalOpen) return;
    const reward = updateSave((s) => claimFreeChest(s));
    if (reward) this.showReward(reward);
    else toast(this, 'O próximo baú grátis ainda não chegou');
    this.refresh();
  }

  private showReward(reward: Parameters<typeof showChestReward>[1]) {
    this.modalOpen = true;
    showChestReward(this, reward, () => {
      this.modalOpen = false;
      this.refresh();
    });
  }

  private refreshChests() {
    const p = getProfile();
    const before = `${p.freeChests}:${p.freeChestNextAt}`;
    tickFreeChests(p);
    if (`${p.freeChests}:${p.freeChestNextAt}` !== before) updateSave(() => {});
    const now = Date.now();
    this.slots.forEach((v, i) => {
      const c = p.chests[i];
      const state = slotState(p, i, now);
      const def = c && chestById(c.type);
      v.icon.set(def ? chestKey(def.id) : null, def ? def.icon : '');
      v.name.setText(def ? def.name : 'Vazio').setAlpha(def ? 1 : 0.45);
      const border = state === 'ready' ? 0x4ade80 : state === 'unlocking' ? THEME.gold : def ? 0x6d7bc4 : THEME.line;
      this.drawSlot(v, border, !!def, state === 'ready');
      if (state === 'locked') v.status.setText(`🔒 ${def!.unlockMinutes < 60 ? `${def!.unlockMinutes} min` : `${def!.unlockMinutes / 60} h`}`).setColor(THEME.muted);
      else if (state === 'unlocking') v.status.setText(`⏳ ${clock(c!.readyAt! - now)}`).setColor(THEME.goldText);
      else if (state === 'ready') v.status.setText('ABRIR!').setColor('#4ade80');
      else v.status.setText('');
    });
    const f = this.freeChest;
    f.icon.set(chestKey('madeira'), '🎁').setDim(p.freeChests === 0);
    f.name.setText(`Baú grátis (${p.freeChests}/${FREE_CHEST.maxStored})`);
    f.status
      .setText(p.freeChests > 0 ? 'PEGAR!' : `em ${clock(p.freeChestNextAt - now)}`)
      .setColor(p.freeChests > 0 ? '#4ade80' : THEME.muted);
    this.drawSlot(f, p.freeChests > 0 ? 0x4ade80 : THEME.line, true, p.freeChests > 0);
  }

  // ------------------------------------------------------------ geral

  private refresh() {
    this.refreshBar();
    const save = getSave();
    const p = save.profile;
    const deck = activeDeck();
    const god = godById(deck.god)!;
    const tutorial = p.tutorial < TUTORIAL.length;

    this.deckTitle.setText(`Deck ${save.activeDeck + 1}/${save.decks.length}: ${deck.name}`);
    this.godText.setText(`${god.icon} ${god.name} · Nv ${p.gods[god.id]?.level ?? 1}`).setColor(god.color);
    this.deckFrame.setStrokeStyle(3, hex(god.color));
    const spells = deck.spells.map((id) => spellById(id)!).map((s) => `${s.icon} ${s.name} Nv${p.spells[s.id]?.level ?? 1}`);
    this.spellsText.setText(spells.length ? spells.join('    ') : 'Sem magias escolhidas');
    this.tiles.forEach((t, i) => {
      const id = deck.units[i];
      t.setUnit(id ? unitById(id)! : null).setLevel(id ? p.units[id]?.level ?? null : null);
    });
    const complete = isDeckComplete(deck);
    this.statusText.setText(complete ? '' : 'Deck incompleto: toque para montar (8 tropas + 2 magias)');

    const arena = currentArena(p);
    const next = ARENAS[arena.index + 1];
    this.arenaTitle.setText(`${arena.icon} Arena ${arena.index + 1}: ${arena.name}`);
    this.arenaDesc.setText(arena.description);
    const from = arena.trophies;
    const to = next?.trophies ?? from;
    const frac = next ? (p.trophies - from) / (to - from) : 1;
    this.arenaBar.clear();
    this.arenaBar.fillStyle(0x000000, 0.65).fillRoundedRect(718, 170, 484, 22, 11);
    this.arenaBar.fillGradientStyle(THEME.goldLight, THEME.goldLight, THEME.goldDark, THEME.goldDark, 1).fillRoundedRect(720, 172, Math.max(16, 480 * frac), 18, 9);
    this.arenaBar.lineStyle(2, THEME.goldDark, 1).strokeRoundedRect(718, 170, 484, 22, 11);
    this.arenaNext.setText(next ? `Próxima: ${next.icon} ${next.name} com 🏆 ${next.trophies}` : 'Você chegou à última arena!');

    for (const b of this.diffButtons) {
      const on = b.id === save.difficulty;
      drawBevel(b.g, 145, 44, on ? 0xd99a2b : 0x2a3566, on);
      b.label.setY(288 + (on ? 2 : -2)).setColor(on ? '#fff7d6' : '#b9c3e8');
    }
    this.battleBtn.setLabel(tutorial ? `TUTORIAL ${p.tutorial + 1}/${TUTORIAL.length} ▶` : 'BATALHAR ⚔️');
    this.battleBtn.setEnabled(tutorial || complete);
    this.refreshChests();
  }

  private startBattle() {
    const p = getProfile();
    this.enterFullscreenOnMobile();
    if (p.tutorial < TUTORIAL.length) {
      this.scene.start('Battle', { deck: activeDeck(), difficulty: 'tutorial', tutorial: p.tutorial });
      return;
    }
    const deck = activeDeck();
    if (!isDeckComplete(deck)) {
      toast(this, 'Complete o deck antes de batalhar');
      return;
    }
    this.scene.start('Battle', { deck: { ...deck, spells: [...deck.spells], units: [...deck.units] }, difficulty: getSave().difficulty });
  }

  /** No celular, entra em tela cheia e tenta travar em paisagem (só funciona após um toque). */
  private enterFullscreenOnMobile() {
    if (!this.sys.game.device.input.touch || this.scale.isFullscreen) return;
    this.scale.startFullscreen();
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    orientation.lock?.('landscape').catch(() => {});
  }
}
