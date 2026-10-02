import Phaser from 'phaser';
import { COLORS, H, W } from '../config';
import {
  ARENAS, BATTLE_RULES, GODS, TUTORIAL, UNITS, WORLDS, analyzeDeck, describeSpell, godById, rarityById, spellById, unitById, worldById,
  type SpellDef, type UnitDef,
} from '../data/content';
import { isSpellUnlocked } from '../meta/progress';
import { getProfile, getSave, isDeckComplete, updateSave, type Deck } from '../save/save';
import { button, hex, panel, toast, UnitTile, type Button } from './ui';

const LEFT_X = 16;
const RIGHT_X = 336;
const TILE_W = 72;
const TILE_H = 92;

/** Montagem de deck: 5 decks salvos, cada um com deus, 2 magias e 8 tropas. Tudo é salvo na hora. */
export class DeckScene extends Phaser.Scene {
  private selectedSlot: number | null = null;
  private worldFilter = '';

  private tabs: { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }[] = [];
  private deckName!: Phaser.GameObjects.Text;
  private godTitle!: Phaser.GameObjects.Text;
  private godSub!: Phaser.GameObjects.Text;
  private godFrame!: Phaser.GameObjects.Rectangle;
  private spellRows: { bg: Phaser.GameObjects.Rectangle; icon: Phaser.GameObjects.Text; name: Phaser.GameObjects.Text; sub: Phaser.GameObjects.Text }[] = [];
  private slots: UnitTile[] = [];
  private collection: UnitTile[] = [];
  private filterTabs: { id: string; bg: Phaser.GameObjects.Rectangle }[] = [];
  private summary!: Phaser.GameObjects.Text;
  private warnings!: Phaser.GameObjects.Text;
  private info!: Phaser.GameObjects.Text;
  private battleBtn!: Button;

  constructor() {
    super('Deck');
  }

  private get deck(): Deck {
    const s = getSave();
    return s.decks[s.activeDeck];
  }

  private edit(change: (d: Deck) => void) {
    updateSave((s) => change(s.decks[s.activeDeck]));
    this.refresh();
  }

  create() {
    this.selectedSlot = null;
    this.tabs = [];
    this.spellRows = [];
    this.slots = [];
    this.collection = [];
    this.filterTabs = [];
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b1020);

    // ---------------- barra superior
    button(this, 80, 34, '◀ Início', 0x374151, () => this.scene.start('Home'), { w: 140, h: 46, fontSize: 20 });
    for (let i = 0; i < BATTLE_RULES.savedDecks; i++) {
      const x = 470 + i * 60;
      const bg = this.add.rectangle(x, 34, 50, 46, 0x111827).setStrokeStyle(3, 0x374151).setInteractive({ useHandCursor: true });
      const text = this.add.text(x, 34, String(i + 1), { fontSize: '22px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      bg.on('pointerdown', () => {
        updateSave((s) => (s.activeDeck = i));
        this.selectedSlot = null;
        this.refresh();
      });
      this.tabs.push({ bg, text });
    }
    this.deckName = this.add
      .text(800, 34, '', { fontSize: '22px', fontStyle: 'bold', color: '#e2e8f0' })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    this.deckName.on('pointerdown', () => this.rename());

    // ---------------- deus e magias (esquerda)
    this.godFrame = panel(this, LEFT_X, 70, 300, 565);
    this.godTitle = this.add.text(LEFT_X + 150, 108, '', { fontSize: '28px', fontStyle: 'bold' }).setOrigin(0.5);
    this.godSub = this.add.text(LEFT_X + 150, 142, '', { fontSize: '14px', color: '#94a3b8' }).setOrigin(0.5);
    this.godArrow(LEFT_X + 24, -1, '◀');
    this.godArrow(LEFT_X + 276, 1, '▶');
    this.add.text(LEFT_X + 150, 178, `Magias (escolha ${BATTLE_RULES.spellsPerMatch})`, { fontSize: '16px', color: '#cbd5e1' }).setOrigin(0.5);
    for (let i = 0; i < 5; i++) {
      const y = 232 + i * 80;
      const bg = this.add.rectangle(LEFT_X + 150, y, 276, 70, 0x1f2937).setStrokeStyle(2, 0x374151).setInteractive({ useHandCursor: true });
      const icon = this.add.text(LEFT_X + 36, y, '', { fontSize: '34px' }).setOrigin(0.5);
      const name = this.add.text(LEFT_X + 66, y - 13, '', { fontSize: '17px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0, 0.5);
      const sub = this.add.text(LEFT_X + 66, y + 14, '', { fontSize: '13px', color: '#94a3b8' }).setOrigin(0, 0.5);
      bg.on('pointerdown', () => this.toggleSpell(i));
      this.spellRows.push({ bg, icon, name, sub });
    }

    // ---------------- deck (direita, em cima)
    this.add.text(RIGHT_X, 84, `Deck (${BATTLE_RULES.deckSize} tropas)  ·  toque numa carta do deck para trocar; toque de novo para remover`, {
      fontSize: '15px', color: '#94a3b8',
    }).setOrigin(0, 0.5);
    for (let i = 0; i < BATTLE_RULES.deckSize; i++) {
      const slot = new UnitTile(this, RIGHT_X + 56 + i * 112, 166, 100, 120);
      slot.on('pointerdown', () => this.tapSlot(i));
      this.slots.push(slot);
    }
    this.summary = this.add.text(RIGHT_X, 246, '', { fontSize: '17px', color: '#e2e8f0' }).setOrigin(0, 0.5);
    this.warnings = this.add.text(RIGHT_X, 274, '', { fontSize: '15px', color: '#fb923c' }).setOrigin(0, 0.5);

    // ---------------- coleção (direita, embaixo)
    const filters = [{ id: '', label: 'Todas' }, ...WORLDS.map((w) => ({ id: w.id, label: `${w.icon} ${w.name}` }))];
    filters.forEach((f, i) => {
      const x = RIGHT_X + 80 + i * 175;
      const bg = this.add.rectangle(x, 316, 165, 36, 0x111827).setStrokeStyle(2, 0x374151).setInteractive({ useHandCursor: true });
      this.add.text(x, 316, f.label, { fontSize: '15px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      bg.on('pointerdown', () => {
        this.worldFilter = f.id;
        this.refresh();
      });
      this.filterTabs.push({ id: f.id, bg });
    });
    for (const u of UNITS) {
      const tile = new UnitTile(this, 0, 0, TILE_W, TILE_H).setUnit(u);
      tile.on('pointerdown', () => this.tapCollection(u));
      this.collection.push(tile);
    }

    // ---------------- informações e ações
    panel(this, RIGHT_X, 560, W - RIGHT_X - 16, 80);
    this.info = this.add
      .text(RIGHT_X + 12, 600, 'Toque numa tropa ou magia para ver os detalhes.', {
        fontSize: '15px', color: '#cbd5e1', wordWrap: { width: W - RIGHT_X - 40 }, lineSpacing: 4,
      })
      .setOrigin(0, 0.5);
    button(this, 166, 680, 'Restaurar sugerido', 0x374151, () => this.restoreSuggested(), { w: 300, h: 50, fontSize: 18 });
    this.battleBtn = button(this, W - 150, 680, 'BATALHAR ⚔️', COLORS.player, () => this.battle(), { w: 268, h: 56, fontSize: 24 });

    this.refresh();
  }

  // ------------------------------------------------------------ ações

  private godArrow(x: number, delta: number, label: string) {
    const t = this.add.text(x, 108, label, { fontSize: '26px', color: '#cbd5e1' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t.on('pointerdown', () => {
      // Só deuses já liberados entram no carrossel.
      const p = getProfile();
      const gods = GODS.filter((g) => p.gods[g.id]);
      if (gods.length < 2) {
        toast(this, 'Ganhe troféus para liberar outros deuses');
        return;
      }
      const idx = gods.findIndex((g) => g.id === this.deck.god);
      const next = gods[(idx + delta + gods.length) % gods.length];
      // Ao trocar de deus, as magias passam a ser as liberadas sugeridas para ele; as tropas ficam.
      this.edit((d) => {
        d.god = next.id;
        d.spells = next.suggestedDecks[0].spells.filter((id) => isSpellUnlocked(p, id));
      });
      this.info.setText(`${next.icon} ${next.name}, ${next.title}: ${next.summary}`);
    });
  }

  private toggleSpell(i: number) {
    const god = godById(this.deck.god)!;
    const spell = spellById(god.spells[i])!;
    this.showSpell(spell);
    if (!isSpellUnlocked(getProfile(), spell.id)) {
      toast(this, `🔒 Liberada quando ${god.name} chegar ao nível ${spell.godLevel}`);
      return;
    }
    this.edit((d) => {
      if (d.spells.includes(spell.id)) d.spells = d.spells.filter((s) => s !== spell.id);
      else {
        d.spells.push(spell.id);
        if (d.spells.length > BATTLE_RULES.spellsPerMatch) d.spells.shift();
      }
    });
  }

  private tapSlot(i: number) {
    const id = this.deck.units[i];
    if (id) this.showUnit(unitById(id)!);
    if (this.selectedSlot === i && id) {
      this.edit((d) => d.units.splice(i, 1));
      this.selectedSlot = null;
      this.refresh();
      return;
    }
    this.selectedSlot = i;
    this.refresh();
  }

  private tapCollection(u: UnitDef) {
    this.showUnit(u);
    if (!getProfile().units[u.id]) {
      toast(this, `🔒 ${u.name}: ganhe em baús a partir da arena ${ARENAS[u.arena].name}`);
      return;
    }
    const units = this.deck.units;
    if (units.includes(u.id)) {
      toast(this, `${u.name} já está no deck`);
      return;
    }
    const slot = this.selectedSlot;
    if (slot !== null && slot < units.length) {
      this.edit((d) => (d.units[slot] = u.id));
    } else if (units.length < BATTLE_RULES.deckSize) {
      this.edit((d) => d.units.push(u.id));
    } else {
      toast(this, 'Deck cheio: toque numa carta do deck para trocar');
      return;
    }
    this.selectedSlot = null;
    this.refresh();
  }

  private restoreSuggested() {
    const god = godById(this.deck.god)!;
    const s = god.suggestedDecks[0];
    const p = getProfile();
    // Só entra o que o jogador já tem; o resto fica vazio para ele completar.
    this.edit((d) => {
      d.name = s.name;
      d.spells = s.spells.filter((id) => isSpellUnlocked(p, id));
      d.units = s.units.filter((id) => p.units[id]);
    });
    const missing = s.units.filter((id) => !p.units[id]).length;
    toast(this, missing ? `Deck "${s.name}" restaurado (faltam ${missing} tropa(s) que você ainda não tem)` : `Deck "${s.name}" restaurado`);
  }

  private rename() {
    const name = window.prompt('Nome do deck', this.deck.name)?.trim();
    if (name) this.edit((d) => (d.name = name.slice(0, 24)));
  }

  private battle() {
    const tutorial = getProfile().tutorial;
    if (tutorial < TUTORIAL.length) {
      this.scene.start('Battle', { deck: this.deck, difficulty: 'tutorial', tutorial });
      return;
    }
    const deck = this.deck;
    if (!isDeckComplete(deck)) {
      toast(this, `Complete o deck: ${BATTLE_RULES.deckSize} tropas e ${BATTLE_RULES.spellsPerMatch} magias`);
      return;
    }
    this.scene.start('Battle', { deck: { ...deck, spells: [...deck.spells], units: [...deck.units] }, difficulty: getSave().difficulty });
  }

  // ------------------------------------------------------------ informações

  private showUnit(u: UnitDef) {
    const w = worldById(u.world);
    const range = u.range <= 40 ? 'corpo a corpo' : `alcance ${u.range}`;
    const extras = [u.flying && 'voa', u.targetsAir && 'acerta voadores', u.splash && `área ${u.splash}`].filter(Boolean).join(' · ');
    const names = (ids: string[]) => ids.map((id) => unitById(id)?.name ?? spellById(id)?.name ?? id).join(', ');
    this.info.setText(
      `${u.icon} ${u.name}${u.count > 1 ? ` ×${u.count}` : ''} · ${rarityById(u.rarity).name} · ${w.icon} ${w.name} · ${u.cost} mana — ` +
        `vida ${u.hp}, dano ${u.damage}, ${range}${extras ? ` · ${extras}` : ''}\n` +
        (u.ability ? `✦ ${u.ability.name}: ${u.ability.description}  ` : `${u.description}  `) +
        `Forte contra: ${names(u.strongAgainst)}. Fraco contra: ${names(u.weakAgainst)}.`,
    );
  }

  private showSpell(s: SpellDef) {
    this.info.setText(`${s.icon} ${s.name} · ${rarityById(s.rarity).name} · recarga inicial ${s.initialCooldown}s, recarga ${s.cooldown}s\n${describeSpell(s, 1)}`);
  }

  // ------------------------------------------------------------ desenho

  private refresh() {
    const save = getSave();
    const p = save.profile;
    const deck = this.deck;
    const god = godById(deck.god)!;

    this.tabs.forEach((t, i) => {
      const on = i === save.activeDeck;
      t.bg.setStrokeStyle(on ? 4 : 2, on ? COLORS.gold : 0x374151).setFillStyle(on ? 0x1f2937 : 0x111827);
    });
    this.deckName.setText(`${deck.name} ✏️`);

    this.godFrame.setStrokeStyle(3, hex(god.color));
    this.godTitle.setText(`${god.icon} ${god.name}`).setColor(god.color);
    this.godSub.setText(`${god.title} · ${god.element}`);
    god.spells.forEach((id, i) => {
      const s = spellById(id)!;
      const row = this.spellRows[i];
      const on = deck.spells.includes(id);
      row.icon.setText(s.icon);
      row.name.setText(s.name);
      const unlocked = isSpellUnlocked(p, id);
      row.icon.setAlpha(unlocked ? 1 : 0.35);
      row.name.setColor(unlocked ? '#ffffff' : '#64748b');
      row.sub
        .setText(unlocked ? `${rarityById(s.rarity).name} · Nv ${p.spells[id]?.level ?? 1} · recarga ${s.cooldown}s` : `🔒 Deus nível ${s.godLevel}`)
        .setColor(unlocked ? rarityById(s.rarity).color : '#64748b');
      row.bg.setStrokeStyle(on ? 4 : 2, on ? COLORS.gold : 0x374151).setFillStyle(on ? 0x3b2f0b : 0x1f2937);
    });

    this.slots.forEach((slot, i) => {
      const id = deck.units[i];
      slot.setUnit(id ? unitById(id)! : null).setHighlight(this.selectedSlot === i).setLevel(id ? p.units[id]?.level ?? null : null);
    });

    const a = analyzeDeck(deck.units, deck.spells);
    this.summary.setText(
      `Custo médio ${a.avgCost.toFixed(1).replace('.', ',')}  ·  Acertam voadores ${a.antiAir}  ·  Tanques ${a.tanks}  ·  Dano em área ${a.area}${a.areaSpells ? ` (+${a.areaSpells} magia)` : ''}  ·  Magias ${deck.spells.length}/${BATTLE_RULES.spellsPerMatch}`,
    );
    const warnings = [...a.warnings];
    if (deck.spells.length < BATTLE_RULES.spellsPerMatch) warnings.unshift(`Escolha ${BATTLE_RULES.spellsPerMatch - deck.spells.length} magia(s)`);
    this.warnings.setText(warnings.length ? `⚠️ ${warnings.join('  ·  ')}` : '✅ Deck equilibrado').setColor(warnings.length ? '#fb923c' : '#4ade80');
    this.battleBtn.setEnabled(isDeckComplete(deck));

    for (const f of this.filterTabs) {
      const on = f.id === this.worldFilter;
      f.bg.setStrokeStyle(on ? 3 : 2, on ? COLORS.gold : 0x374151).setFillStyle(on ? 0x1f2937 : 0x111827);
    }
    let n = 0;
    for (const tile of this.collection) {
      const u = tile.unit!;
      const visible = !this.worldFilter || u.world === this.worldFilter;
      tile.setVisible(visible);
      if (!visible) continue;
      tile.setPosition(RIGHT_X + 40 + (n % 12) * 76, 395 + Math.floor(n / 12) * 100);
      tile.setInDeck(deck.units.includes(u.id)).setLocked(!p.units[u.id]).setLevel(p.units[u.id]?.level ?? null);
      n++;
    }
  }
}
