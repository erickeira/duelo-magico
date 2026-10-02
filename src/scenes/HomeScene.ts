import Phaser from 'phaser';
import { COLORS, H, W } from '../config';
import { ARENAS, FREE_CHEST, TUTORIAL, chestById, godById, spellById, unitById } from '../data/content';
import type { Difficulty } from '../battle/Loadout';
import { claimFreeChest, openChest, slotState, startUnlock, tickFreeChests } from '../meta/chests';
import { currentArena } from '../meta/progress';
import { activeDeck, getProfile, getSave, isDeckComplete, updateSave } from '../save/save';
import { button, hex, panel, resourceBar, showChestReward, toast, UnitTile, type Button } from './ui';

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'facil', label: 'Fácil' },
  { id: 'normal', label: 'Normal' },
  { id: 'dificil', label: 'Difícil' },
];

interface SlotView {
  bg: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Text;
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
  private deckFrame!: Phaser.GameObjects.Rectangle;
  private tiles: UnitTile[] = [];
  private arenaTitle!: Phaser.GameObjects.Text;
  private arenaDesc!: Phaser.GameObjects.Text;
  private arenaBar!: Phaser.GameObjects.Graphics;
  private arenaNext!: Phaser.GameObjects.Text;
  private diffButtons: { id: Difficulty; bg: Phaser.GameObjects.Rectangle }[] = [];
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
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b1020);
    this.refreshBar = resourceBar(this);

    // ---------------- deck ativo
    this.deckFrame = panel(this, 30, 64, 620, 270);
    this.arrow(62, 94, '◀', -1);
    this.arrow(618, 94, '▶', 1);
    this.deckTitle = this.add.text(340, 94, '', { fontSize: '20px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    this.godText = this.add.text(340, 132, '', { fontSize: '22px', fontStyle: 'bold' }).setOrigin(0.5);
    this.spellsText = this.add.text(340, 164, '', { fontSize: '16px', color: '#e2e8f0' }).setOrigin(0.5);
    for (let i = 0; i < 8; i++) {
      const tile = new UnitTile(this, 340 + (i - 3.5) * 74, 240, 66, 82);
      tile.on('pointerdown', () => this.scene.start('Deck'));
      this.tiles.push(tile);
    }
    this.statusText = this.add.text(340, 310, '', { fontSize: '15px', color: '#f87171' }).setOrigin(0.5);

    // ---------------- arena e dificuldade
    panel(this, 670, 64, 580, 270);
    this.arenaTitle = this.add.text(960, 100, '', { fontSize: '26px', fontStyle: 'bold', color: '#facc15' }).setOrigin(0.5);
    this.arenaDesc = this.add.text(960, 140, '', { fontSize: '15px', color: '#cbd5e1', align: 'center', wordWrap: { width: 540 } }).setOrigin(0.5);
    this.arenaBar = this.add.graphics();
    this.arenaNext = this.add.text(960, 208, '', { fontSize: '14px', color: '#94a3b8' }).setOrigin(0.5);
    this.add.text(960, 248, 'Dificuldade da IA', { fontSize: '15px', color: '#94a3b8' }).setOrigin(0.5);
    DIFFICULTIES.forEach((d, i) => {
      const x = 960 + (i - 1) * 160;
      const bg = this.add.rectangle(x, 292, 145, 46, 0x1f2937).setStrokeStyle(3, 0x374151).setInteractive({ useHandCursor: true });
      this.add.text(x, 292, d.label, { fontSize: '20px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      bg.on('pointerdown', () => {
        updateSave((s) => (s.difficulty = d.id));
        this.refresh();
      });
      this.diffButtons.push({ id: d.id, bg });
    });

    // ---------------- baús
    this.add.text(30, 362, 'Baús', { fontSize: '18px', fontStyle: 'bold', color: '#cbd5e1' }).setOrigin(0, 0.5);
    for (let i = 0; i < 4; i++) this.slots.push(this.slotView(130 + i * 175, 450, () => this.tapSlot(i)));
    this.freeChest = this.slotView(1060, 450, () => this.tapFreeChest(), 0x14532d);

    // ---------------- ações
    button(this, 140, 620, '🃏 Deck', 0x374151, () => this.scene.start('Deck'), { w: 210, h: 70, fontSize: 24 });
    button(this, 370, 620, '🔥 Deuses', 0x374151, () => this.scene.start('Gods'), { w: 210, h: 70, fontSize: 24 });
    button(this, 600, 620, '📖 Coleção', 0x374151, () => this.scene.start('Collection'), { w: 210, h: 70, fontSize: 24 });
    this.battleBtn = button(this, 1000, 620, 'BATALHAR ⚔️', COLORS.player, () => this.startBattle(), { w: 420, h: 90 });

    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.refreshChests() });
    this.refresh();
  }

  private slotView(x: number, y: number, onTap: () => void, fill = 0x111827): SlotView {
    const bg = this.add.rectangle(x, y, 160, 140, fill).setStrokeStyle(3, 0x374151).setInteractive({ useHandCursor: true });
    const icon = this.add.text(x, y - 22, '', { fontSize: '48px' }).setOrigin(0.5);
    const name = this.add.text(x, y + 26, '', { fontSize: '14px', fontStyle: 'bold', color: '#e2e8f0' }).setOrigin(0.5);
    const status = this.add.text(x, y + 50, '', { fontSize: '14px', fontStyle: 'bold', color: '#94a3b8' }).setOrigin(0.5);
    bg.on('pointerdown', onTap);
    return { bg, icon, name, status };
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
      v.icon.setText(def ? def.icon : '');
      v.name.setText(def ? def.name : 'Vazio');
      v.bg.setStrokeStyle(3, state === 'ready' ? 0x4ade80 : state === 'unlocking' ? COLORS.gold : 0x374151);
      if (state === 'locked') v.status.setText(`Abrir: ${def!.unlockMinutes < 60 ? `${def!.unlockMinutes} min` : `${def!.unlockMinutes / 60} h`}`).setColor('#94a3b8');
      else if (state === 'unlocking') v.status.setText(`⏳ ${clock(c!.readyAt! - now)}`).setColor('#fde68a');
      else if (state === 'ready') v.status.setText('ABRIR!').setColor('#4ade80');
      else v.status.setText('');
    });
    const f = this.freeChest;
    f.icon.setText('🎁');
    f.name.setText(`Baú grátis (${p.freeChests}/${FREE_CHEST.maxStored})`);
    f.status
      .setText(p.freeChests > 0 ? 'PEGAR!' : `próximo em ${clock(p.freeChestNextAt - now)}`)
      .setColor(p.freeChests > 0 ? '#4ade80' : '#94a3b8');
    f.bg.setStrokeStyle(3, p.freeChests > 0 ? 0x4ade80 : 0x374151);
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
    this.arenaBar.fillStyle(0x000000, 0.6).fillRoundedRect(720, 172, 480, 18, 8);
    this.arenaBar.fillStyle(COLORS.gold).fillRoundedRect(720, 172, Math.max(8, 480 * frac), 18, 8);
    this.arenaNext.setText(next ? `Próxima: ${next.icon} ${next.name} com 🏆 ${next.trophies}` : 'Você chegou à última arena!');

    for (const b of this.diffButtons) {
      const on = b.id === save.difficulty;
      b.bg.setStrokeStyle(on ? 4 : 3, on ? COLORS.gold : 0x374151).setFillStyle(on ? 0x374151 : 0x1f2937);
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
