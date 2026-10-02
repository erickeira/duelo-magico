import Phaser from 'phaser';
import {
  ARENA_BOTTOM, ARENA_LEFT, ARENA_RIGHT, ARENA_TOP, CARD_AREA_Y, CASTLE_ATTACK_INTERVAL, CASTLE_DAMAGE, CASTLE_RANGE,
  ARENA_ART, COLORS, DOUBLE_MANA_AT, H, HAND_SIZE, HUD_HEIGHT, LANES_Y, LANE_HEIGHT, MANA_PER_SEC, MATCH_TIME, MAX_MANA, MID_X, OVERTIME,
  SPAWN_MARGIN, W, other, type Team,
} from '../config';
import { BATTLE_RULES, TUTORIAL, godById, spellById, type SpellDef, type UnitDef } from '../data/content';
import { ABILITIES, auraDamageMult } from '../battle/abilities';
import { Ai } from '../battle/Ai';
import type { ArenaEffect, BattleApi, SpawnOptions } from '../battle/api';
import { CARD_W, CardView } from '../battle/CardView';
import { Castle } from '../battle/Castle';
import { Hand } from '../battle/Hand';
import { enemyLoadout, loadoutFromDeck, randomGod, scaledStats, tutorialLoadouts, type BattleSettings, type Loadout } from '../battle/Loadout';
import { applyBattleResult, currentArena } from '../meta/progress';
import { activeDeck, getProfile, getSave, updateSave } from '../save/save';
import { SpellButton } from '../battle/SpellButton';
import { castSpell, pickAlly } from '../battle/spells';
import { Unit, type StatusKind, type UnitStats } from '../battle/Unit';
import { GROUND_KEY, arenaKey, coverImage, godFaceKey } from './PreloadScene';
import { ArtIcon } from './ui';

interface Projectile {
  obj: Phaser.GameObjects.Arc;
  target: Unit | Castle;
  aim: { x: number; y: number };
  team: Team;
  damage: number;
  splash: number;
  hitsAir: boolean;
  source: Unit | null;
}

export interface SpellSlot {
  def: SpellDef;
  readyAt: number;
  total: number;
}

type Selection = { kind: 'card' | 'spell'; index: number } | null;

export type BattleResult = 'win' | 'lose' | 'draw';

const PROJECTILE_SPEED = 650;
const hex = (css: string) => Number.parseInt(css.slice(1), 16);

export class BattleScene extends Phaser.Scene implements BattleApi {
  units: Unit[] = [];
  castles!: Record<Team, Castle>;
  now = 0;
  settings!: BattleSettings;
  loadouts!: Record<Team, Loadout>;
  hands!: Record<Team, Hand>;
  spells!: Record<Team, SpellSlot[]>;

  private projectiles: Projectile[] = [];
  private effects: ArenaEffect[] = [];
  private ai!: Ai;
  private over = false;
  private overtimeAnnounced = false;

  // UI
  private selection: Selection = null;
  private dragging = false;
  private cardViews: CardView[] = [];
  private spellButtons: SpellButton[] = [];
  private nextView!: CardView;
  private manaBar!: Phaser.GameObjects.Graphics;
  private manaText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private preview!: Phaser.GameObjects.Graphics;
  private ghost!: Phaser.GameObjects.Text;

  constructor() {
    super('Battle');
  }

  init(data: Partial<BattleSettings>) {
    this.settings = { deck: data.deck ?? activeDeck(), difficulty: data.difficulty ?? getSave().difficulty, tutorial: data.tutorial };
    this.units = [];
    this.projectiles = [];
    this.effects = [];
    this.now = 0;
    this.over = false;
    this.overtimeAnnounced = false;
    this.selection = null;
    this.dragging = false;
    this.cardViews = [];
    this.spellButtons = [];
  }

  create() {
    const tutorial = this.settings.tutorial;
    if (tutorial !== undefined) {
      this.loadouts = tutorialLoadouts(tutorial);
    } else {
      const profile = getProfile();
      const player = loadoutFromDeck(this.settings.deck, profile);
      const ctx = { arena: currentArena(profile).index, godLevel: profile.gods[player.god]?.level ?? 1 };
      this.loadouts = { player, enemy: enemyLoadout(randomGod(), player, this.settings.difficulty, ctx) };
    }
    const { player, enemy } = this.loadouts;
    this.drawArena();
    this.castles = { player: new Castle(this, 'player', player.castleHp), enemy: new Castle(this, 'enemy', enemy.castleHp) };
    this.hands = { player: new Hand(player.units), enemy: new Hand(enemy.units) };
    const slots = (l: Loadout) =>
      l.spells.map((id) => {
        const def = spellById(id)!;
        return { def, readyAt: def.initialCooldown, total: def.initialCooldown };
      });
    this.spells = { player: slots(player), enemy: slots(enemy) };
    this.ai = new Ai(this, this.hands.enemy, tutorial !== undefined ? 'tutorial' : this.settings.difficulty);
    this.createHud();
    this.setupInput();
    if (tutorial !== undefined) this.showTutorialHints(tutorial);
  }

  update(_time: number, deltaMs: number) {
    if (this.over) return;
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.now += dt;

    const rate = MANA_PER_SEC * (this.now >= MATCH_TIME - DOUBLE_MANA_AT ? 2 : 1);
    this.hands.player.update(dt, rate);
    this.hands.enemy.update(dt, rate);
    this.ai.update(dt);

    for (const u of [...this.units]) if (u.alive) this.updateUnit(u, dt);
    this.updateCastle(this.castles.player, dt);
    this.updateCastle(this.castles.enemy, dt);
    this.updateProjectiles(dt);
    this.updateEffects(dt);
    this.removeDead();
    this.overtimeDrain(dt);

    for (const u of this.units) u.redraw(this.now);
    this.refreshHud();
    this.checkEnd();
  }

  // ================================================================ API (BattleApi)

  spawnUnit(team: Team, stats: UnitStats, lane: number, x: number, opts: SpawnOptions = {}): Unit {
    const u = new Unit(this, team, stats, x, LANES_Y[lane], lane, !!opts.summoned);
    if (opts.level) u.level = opts.level;
    if (stats.lifetime) u.expiresAt = this.now + stats.lifetime;
    if (opts.duration) u.expiresAt = this.now + opts.duration;
    if (opts.onExpire) u.ability.onExpire = opts.onExpire;
    this.units.push(u);
    ABILITIES[stats.id]?.onSpawn?.(u, this);
    return u;
  }

  dealDamage(target: Unit | Castle, amount: number, source: Unit | null = null): number {
    if (!target.alive || amount <= 0) return 0;
    if (target instanceof Castle) {
      target.takeDamage(amount);
      return amount;
    }
    let dmg = amount * target.damageTakenMult * auraDamageMult(target, this);
    if (target.has('freeze', this.now)) dmg *= 1 + target.statusValue('vulnerable', this.now) / 100;
    if (target.shield && target.shield.until > this.now) {
      const absorbed = Math.min(target.shield.amount, dmg);
      target.shield.amount -= absorbed;
      dmg -= absorbed;
      if (target.shield.amount <= 0) {
        const { onBreak } = target.shield;
        target.shield = null;
        onBreak?.(target);
      }
    }
    if (source && source.alive && target.has('chillArmor', this.now)) {
      this.applyStatus(source, 'slow', 2, target.statusValue('chillArmor', this.now));
    }
    if (dmg > 0) target.loseHp(dmg);
    if (!target.alive && source) ABILITIES[source.stats.id]?.onKill?.(source, target, this);
    return dmg;
  }

  heal(target: Unit, amount: number) {
    if (!target.alive) return;
    target.gainHp(amount * (target.has('healReduction', this.now) ? 0.5 : 1));
  }

  addShield(target: Unit, amount: number, duration: number, onBreak?: (u: Unit) => void) {
    if (!target.alive) return;
    const value = amount * (target.has('healReduction', this.now) ? 0.5 : 1);
    const cur = target.shield && target.shield.until > this.now ? target.shield.amount : 0;
    target.shield = { amount: Math.max(cur, value), until: this.now + duration, onBreak };
  }

  applyStatus(target: Unit, kind: StatusKind, duration: number, value = 0) {
    if (target.alive) target.setStatus(kind, this.now, duration, value);
  }

  knockback(target: Unit, px: number) {
    if (!target.alive || target.isBuilding || target.has('ccImmune', this.now) || target.has('steadfast', this.now)) return;
    const ownFront = this.castles[target.team].front;
    target.x -= target.dir * px;
    target.x = target.dir > 0 ? Math.max(target.x, ownFront + target.radius) : Math.min(target.x, ownFront - target.radius);
  }

  enemiesInRadius(team: Team, x: number, y: number, r: number, includeAir = true): Unit[] {
    return this.units.filter(
      (u) => u.alive && u.team !== team && (includeAir || !u.isFlying) && Math.hypot(u.x - x, u.y - y) <= r + u.radius,
    );
  }

  alliesInRadius(team: Team, x: number, y: number, r: number): Unit[] {
    return this.units.filter((u) => u.alive && u.team === team && Math.hypot(u.x - x, u.y - y) <= r + u.radius);
  }

  unitsInLane(team: Team, lane: number): Unit[] {
    return this.units.filter((u) => u.alive && u.team === team && u.lane === lane);
  }

  mostAdvanced(team: Team, lane: number): Unit | undefined {
    const list = this.unitsInLane(team, lane);
    return team === 'player' ? list.sort((a, b) => b.x - a.x)[0] : list.sort((a, b) => a.x - b.x)[0];
  }

  laneAt(y: number): number {
    let best = 0;
    LANES_Y.forEach((ly, i) => {
      if (Math.abs(ly - y) < Math.abs(LANES_Y[best] - y)) best = i;
    });
    return best;
  }

  addEffect(effect: ArenaEffect) {
    this.effects.push(effect);
  }

  pulse(x: number, y: number, r: number, color: number, alpha = 0.5) {
    const c = this.add.circle(x, y, r, color, alpha).setDepth(30).setScale(0.3);
    this.tweens.add({ targets: c, scale: 1, alpha: 0, duration: 450, onComplete: () => c.destroy() });
  }

  floatText(x: number, y: number, text: string, color = '#ffffff') {
    const t = this.add
      .text(x, y, text, { fontSize: '22px', fontStyle: 'bold', color, stroke: '#000000', strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(80);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  // ================================================================ jogadas

  /** Faixa x onde `team` pode invocar na trilha: do próprio castelo até o meio ou a tropa inimiga mais avançada. */
  spawnZone(team: Team, lane: number): [number, number] {
    const foe = this.mostAdvanced(other(team), lane);
    if (team === 'player') {
      const from = ARENA_LEFT + 20;
      const limit = Math.min(MID_X, foe ? foe.x - foe.radius - SPAWN_MARGIN : MID_X);
      return [from, Math.max(from, limit)];
    }
    const from = ARENA_RIGHT - 20;
    const limit = Math.max(MID_X, foe ? foe.x + foe.radius + SPAWN_MARGIN : MID_X);
    return [Math.min(from, limit), from];
  }

  /** Usa a carta `index` da mão de `team` na trilha mais próxima de `y`, no x mais próximo permitido. */
  playCard(team: Team, index: number, x: number, y: number): boolean {
    const hand = this.hands[team];
    if (this.over || !hand.canPlay(index)) return false;
    const card = hand.play(index);
    const lane = this.laneAt(y);
    const [minX, maxX] = this.spawnZone(team, lane);
    this.spawnCard(team, card, lane, Phaser.Math.Clamp(x, minX, maxX));
    return true;
  }

  private spawnCard(team: Team, card: UnitDef, lane: number, x: number) {
    const dir = team === 'player' ? 1 : -1;
    const level = this.loadouts[team].unitLevels[card.id];
    const stats = scaledStats(card, level);
    for (let i = 0; i < card.count; i++) {
      const u = this.spawnUnit(team, stats, lane, x - dir * (i % 2) * 14, { level });
      u.y += card.count > 1 ? (i - (card.count - 1) / 2) * 24 : 0;
    }
  }

  spellRemaining(team: Team, index: number): number {
    return Math.max(0, this.spells[team][index].readyAt - this.now);
  }

  /** Lança a magia `index` de `team` no ponto (x, y). Retorna false se não estiver pronta ou sem alvo válido. */
  castSpellAt(team: Team, index: number, x: number, y: number): boolean {
    const slot = this.spells[team][index];
    if (this.over || !slot || this.spellRemaining(team, index) > 0) return false;
    const target = {
      x: Phaser.Math.Clamp(x, ARENA_LEFT, ARENA_RIGHT),
      y: Phaser.Math.Clamp(y, ARENA_TOP, ARENA_BOTTOM),
      lane: this.laneAt(y),
      unit: slot.def.target === 'aliado' ? pickAlly(this, team, x, y) : undefined,
    };
    if (slot.def.target === 'aliado' && !target.unit) return false;
    castSpell(this, team, slot.def, this.loadouts[team].spellLevels[index] ?? 1, target);
    slot.readyAt = this.now + slot.def.cooldown;
    slot.total = slot.def.cooldown;
    if (team === 'enemy') this.floatText(ARENA_RIGHT - 60, ARENA_TOP + 20, `${slot.def.icon} ${slot.def.name}`, '#fca5a5');
    return true;
  }

  // ================================================================ simulação

  private updateUnit(u: Unit, dt: number) {
    u.expireBuffs(this.now);
    if (u.shield && u.shield.until <= this.now) u.shield = null;

    if (u.expiresAt !== undefined && this.now >= u.expiresAt && !u.isBuilding) {
      (u.ability.onExpire as ((x: Unit) => void) | undefined)?.(u);
      u.ability.expired = true;
      u.alive = false;
      return;
    }
    if (u.isBuilding && u.stats.lifetime) {
      u.hp -= (u.maxHp / u.stats.lifetime) * dt;
      if (u.hp <= 0) {
        u.ability.expired = true;
        u.alive = false;
        return;
      }
    }

    const acting = u.canAct(this.now);
    u.freezeAnim(!acting); // congelada/atordoada: a animação para no quadro atual
    if (!acting) return;
    ABILITIES[u.stats.id]?.onTick?.(u, this, dt);
    if (!u.alive) return;

    u.cooldown -= dt;
    const target = this.findTarget(u);
    if (target) {
      if (u.cooldown <= 0) {
        u.cooldown = u.attackInterval(this.now);
        u.playAttack(u.cooldown);
        this.attack(u, target);
      } else u.setAnim('idle');
      return;
    }
    if (!u.canMove(this.now)) {
      u.setAnim('idle');
      return;
    }
    // O ciclo de passos acompanha a velocidade atual (lentidão, buffs).
    u.setAnim('walk', u.moveSpeed(this.now) / u.stats.speed);
    u.x += u.dir * u.moveSpeed(this.now) * dt;
    const enemyFront = this.castles[other(u.team)].front;
    u.x = u.dir > 0 ? Math.min(u.x, enemyFront - u.radius) : Math.max(u.x, enemyFront + u.radius);
  }

  /** Provocador ao alcance; senão o inimigo mais próximo à frente na trilha; senão o castelo. */
  private findTarget(u: Unit): Unit | Castle | null {
    let best: Unit | null = null;
    let bestDist = Infinity;
    for (const e of this.units) {
      if (!e.alive || e.team === u.team || e.lane !== u.lane || !u.canHit(e)) continue;
      const dist = Math.abs(e.x - u.x) - e.radius - u.radius;
      if (e.has('taunt', this.now) && dist <= u.stats.range + 80) return e;
      const ahead = (e.x - u.x) * u.dir;
      if (ahead < -(e.radius + u.radius)) continue;
      if (dist <= u.stats.range && dist < bestDist) {
        best = e;
        bestDist = dist;
      }
    }
    if (best) return best;
    const castle = this.castles[other(u.team)];
    return Math.abs(castle.front - u.x) - u.radius <= u.stats.range ? castle : null;
  }

  private attack(u: Unit, target: Unit | Castle) {
    const hooks = ABILITIES[u.stats.id];
    if (hooks?.onAttack?.(u, target, this)) return;
    let damage = u.stats.damage * u.damageMult(this.now);
    if (hooks?.modifyDamage) damage = hooks.modifyDamage(u, target, damage, this);
    const splash = u.stats.splash ?? 0;
    const hitsAir = !!u.stats.targetsAir;
    if (u.stats.range >= 60) {
      const from = u.aimPoint();
      const obj = this.add.circle(from.x, from.y, splash ? 7 : 5, u.team === 'player' ? 0xfde68a : 0xfecaca).setDepth(25);
      this.projectiles.push({ obj, target, aim: target.aimPoint(from.y), team: u.team, damage, splash, hitsAir, source: u });
    } else {
      u.lunge();
      this.hit(u.team, target, target.aimPoint(u.y), damage, splash, hitsAir, u);
    }
  }

  private hit(team: Team, target: Unit | Castle, at: { x: number; y: number }, damage: number, splash: number, hitsAir: boolean, source: Unit | null) {
    const onHit = (victim: Unit | Castle, dealt: number) => {
      if (!source) return;
      ABILITIES[source.stats.id]?.onHit?.(source, victim, dealt, this);
      if (victim instanceof Unit && source.has('slowingAttacks', this.now)) this.applyStatus(victim, 'slow', 2, 20);
    };
    if (target.alive) onHit(target, this.dealDamage(target, damage, source));
    if (!splash) return;
    const ring = this.add.circle(at.x, at.y, splash, 0xfde68a, 0.35).setDepth(26);
    this.tweens.add({ targets: ring, alpha: 0, duration: 250, onComplete: () => ring.destroy() });
    for (const u of this.enemiesInRadius(team, at.x, at.y, splash, hitsAir)) {
      if (u !== target) onHit(u, this.dealDamage(u, damage, source));
    }
  }

  private updateCastle(castle: Castle, dt: number) {
    castle.cooldown -= dt;
    if (castle.cooldown > 0) return;
    let best: Unit | null = null;
    let bestDist = CASTLE_RANGE;
    for (const u of this.units) {
      if (!u.alive || u.team === castle.team) continue;
      const d = Math.abs(u.x - castle.front);
      if (d <= bestDist) {
        best = u;
        bestDist = d;
      }
    }
    if (!best) return;
    castle.cooldown = CASTLE_ATTACK_INTERVAL;
    const obj = this.add.circle(castle.front, best.y, 5, castle.team === 'player' ? 0x93c5fd : 0xfca5a5).setDepth(25);
    this.projectiles.push({ obj, target: best, aim: best.aimPoint(), team: castle.team, damage: CASTLE_DAMAGE, splash: 0, hitsAir: true, source: null });
  }

  private updateProjectiles(dt: number) {
    for (const p of this.projectiles) {
      if (p.target.alive) p.aim = p.target.aimPoint(p.obj.y);
      const dx = p.aim.x - p.obj.x;
      const dy = p.aim.y - p.obj.y;
      const dist = Math.hypot(dx, dy);
      const step = PROJECTILE_SPEED * dt;
      if (dist <= step) {
        this.hit(p.team, p.target, p.aim, p.damage, p.splash, p.hitsAir, p.source);
        p.obj.destroy();
      } else {
        p.obj.x += (dx / dist) * step;
        p.obj.y += (dy / dist) * step;
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.obj.active);
  }

  /** Efeitos podem criar outros efeitos durante o update; esses entram na lista nova. */
  private updateEffects(dt: number) {
    const current = this.effects;
    this.effects = [];
    const kept = current.filter((e) => {
      const keep = e.update(dt);
      if (!keep) e.destroy();
      return keep;
    });
    this.effects = [...kept, ...this.effects];
  }

  private removeDead() {
    const dead = this.units.filter((u) => !u.alive);
    if (!dead.length) return;
    this.units = this.units.filter((u) => u.alive);
    for (const u of dead) {
      if (!u.ability.expired) ABILITIES[u.stats.id]?.onDeath?.(u, this);
      // Tropas com sprite tocam a queda; as outras somem numa nuvem.
      if (!u.playDeath()) {
        const puff = this.add.circle(u.x, u.y, u.radius, 0xffffff, 0.6).setDepth(15);
        this.tweens.add({ targets: puff, scale: 1.8, alpha: 0, duration: 250, onComplete: () => puff.destroy() });
      }
      u.destroy();
    }
  }

  /** Na prorrogação, os castelos perdem 0,5% da vida máx./s, +0,5 p.p. a cada 10s. */
  private overtimeDrain(dt: number) {
    if (this.now < MATCH_TIME) return;
    if (!this.overtimeAnnounced) {
      this.overtimeAnnounced = true;
      this.floatText(W / 2, H / 2 - 120, 'PRORROGAÇÃO!', '#f87171');
    }
    const steps = Math.floor((this.now - MATCH_TIME) / 10);
    const pct = BATTLE_RULES.overtimeDrainPctPerSec + BATTLE_RULES.overtimeDrainRampPct * steps;
    for (const c of [this.castles.player, this.castles.enemy]) c.takeDamage((c.maxHp * pct * dt) / 100, false);
  }

  private checkEnd() {
    const { player, enemy } = this.castles;
    let result: BattleResult | null = null;
    if (!enemy.alive && !player.alive) result = 'draw';
    else if (!enemy.alive) result = 'win';
    else if (!player.alive) result = 'lose';
    else if (this.now >= MATCH_TIME + OVERTIME) {
      result = player.ratio > enemy.ratio ? 'win' : player.ratio < enemy.ratio ? 'lose' : 'draw';
    }
    if (!result) return;
    this.over = true;
    const outcome = result;
    const rewards = updateSave((s) => applyBattleResult(s, outcome, this.settings.tutorial ?? null));
    this.time.delayedCall(1200, () =>
      this.scene.start('Result', {
        result,
        playerHp: Math.ceil(player.hp),
        enemyHp: Math.ceil(enemy.hp),
        settings: this.settings,
        rewards,
      }),
    );
  }

  // ================================================================ visual / HUD

  private drawArena() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b1020);
    this.preview = this.add.graphics().setDepth(40);
    // Cenário pintado em 3/4 (as trilhas já fazem parte da arte), esticado na vertical para alinhar com LANES_Y.
    const key = arenaKey(ARENA_ART.id);
    if (this.textures.exists(key)) {
      const [top, bottom] = ARENA_ART.lanes;
      const sy = (LANES_Y[2] - LANES_Y[0]) / (bottom - top);
      this.add.image(0, LANES_Y[0] - top * sy, key).setOrigin(0).setDisplaySize(W, this.textures.get(key).getSourceImage().height * sy);
      return;
    }
    // Reserva: chão de grama (arte) ou verde liso, com as trilhas desenhadas.
    if (coverImage(this, GROUND_KEY, W, ARENA_BOTTOM - ARENA_TOP, W / 2, (ARENA_TOP + ARENA_BOTTOM) / 2)) {
      // A grama tem muito detalhe: um véu escuro deixa tropas e trilhas mais legíveis.
      this.add.rectangle(W / 2, (ARENA_TOP + ARENA_BOTTOM) / 2, W, ARENA_BOTTOM - ARENA_TOP, 0x0b1020, 0.28);
    } else {
      this.add.rectangle(W / 2, (ARENA_TOP + ARENA_BOTTOM) / 2, W, ARENA_BOTTOM - ARENA_TOP, COLORS.grass);
    }
    const g = this.add.graphics();
    for (const y of LANES_Y) {
      g.fillStyle(COLORS.lane, 0.72).fillRoundedRect(ARENA_LEFT, y - LANE_HEIGHT / 2 + 25, ARENA_RIGHT - ARENA_LEFT, LANE_HEIGHT - 50, 18);
      g.lineStyle(3, 0x3f2f1a, 0.6).strokeRoundedRect(ARENA_LEFT, y - LANE_HEIGHT / 2 + 25, ARENA_RIGHT - ARENA_LEFT, LANE_HEIGHT - 50, 18);
    }
    g.lineStyle(3, 0xffffff, 0.25);
    for (let y = ARENA_TOP + 10; y < ARENA_BOTTOM; y += 30) g.lineBetween(MID_X, y, MID_X, y + 15);
  }

  private createHud() {
    const pGod = godById(this.loadouts.player.god)!;
    const eGod = godById(this.loadouts.enemy.god)!;
    this.add.rectangle(W / 2, HUD_HEIGHT / 2, W, HUD_HEIGHT, COLORS.ui).setDepth(60);
    new ArtIcon(this, 34, HUD_HEIGHT / 2, 46).set(godFaceKey(pGod.id), pGod.icon).setDepth(61);
    new ArtIcon(this, W - 34, HUD_HEIGHT / 2, 46).set(godFaceKey(eGod.id), eGod.icon).setDepth(61);
    this.timerText = this.add
      .text(W / 2, HUD_HEIGHT / 2 - 6, '', { fontSize: '30px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5).setDepth(61);
    this.phaseText = this.add
      .text(W / 2, HUD_HEIGHT - 8, '', { fontSize: '14px', fontStyle: 'bold', color: '#c084fc' })
      .setOrigin(0.5).setDepth(61);

    this.add.rectangle(W / 2, (CARD_AREA_Y + H) / 2, W, H - CARD_AREA_Y, COLORS.ui).setDepth(45);
    this.manaBar = this.add.graphics().setDepth(50);
    this.manaText = this.add
      .text(W - 300, CARD_AREA_Y + 24, '', { fontSize: '22px', fontStyle: 'bold', color: '#e9d5ff' })
      .setOrigin(0, 0.5).setDepth(51);

    // Magias à esquerda.
    this.spells.player.forEach((slot, i) => {
      const b = new SpellButton(this, 62 + i * 112, CARD_AREA_Y + 72, slot.def, hex(pGod.color));
      b.setInteractive({ useHandCursor: true });
      b.on('pointerdown', () => this.select({ kind: 'spell', index: i }));
      this.spellButtons.push(b);
    });

    const cardY = CARD_AREA_Y + 100;
    const firstX = W / 2 - 1.5 * (CARD_W + 14) + 60;
    for (let i = 0; i < HAND_SIZE; i++) {
      const view = new CardView(this, firstX + i * (CARD_W + 14), cardY);
      view.setInteractive({ useHandCursor: true });
      view.on('pointerdown', () => this.select({ kind: 'card', index: i }));
      this.cardViews.push(view);
    }
    const nextX = firstX - CARD_W - 20;
    this.nextView = new CardView(this, nextX, cardY + 12, true);
    this.add.text(nextX, cardY - 52, 'Próxima', { fontSize: '16px', color: '#9ca3af' }).setOrigin(0.5).setDepth(51);

    this.ghost = this.add.text(0, 0, '', { fontSize: '56px' }).setOrigin(0.5).setDepth(70).setAlpha(0.8).setVisible(false);
    this.refreshHud();
  }

  private refreshHud() {
    const hand = this.hands.player;
    const overtime = this.now >= MATCH_TIME;
    const t = Math.max(0, Math.ceil(overtime ? MATCH_TIME + OVERTIME - this.now : MATCH_TIME - this.now));
    this.timerText.setText(`${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`).setColor(overtime ? '#f87171' : '#ffffff');
    this.phaseText
      .setText(overtime ? 'PRORROGAÇÃO' : this.now >= MATCH_TIME - DOUBLE_MANA_AT ? 'MANA x2' : '')
      .setColor(overtime ? '#f87171' : '#c084fc');

    const x0 = 360;
    const w = W - 700;
    const y = CARD_AREA_Y + 14;
    this.manaBar.clear();
    this.manaBar.fillStyle(0x000000, 0.6).fillRoundedRect(x0, y, w, 20, 8);
    this.manaBar.fillStyle(COLORS.mana).fillRoundedRect(x0, y, Math.max(1, (w * hand.mana) / MAX_MANA), 20, 8);
    this.manaBar.lineStyle(2, 0x0b1020);
    for (let i = 1; i < MAX_MANA; i++) this.manaBar.lineBetween(x0 + (w * i) / MAX_MANA, y, x0 + (w * i) / MAX_MANA, y + 20);
    this.manaText.setX(x0 + w + 12).setText(String(Math.floor(hand.mana)));

    hand.hand.forEach((card, i) => {
      const view = this.cardViews[i];
      view.setCard(card, this.loadouts.player.unitLevels[card.id]);
      view.setPlayable(hand.canPlay(i));
      view.setSelected(this.selection?.kind === 'card' && this.selection.index === i);
    });
    // No tutorial o deck pode ter menos cartas que a mão.
    this.cardViews.forEach((v, i) => v.setVisible(i < hand.hand.length));
    this.nextView.setVisible(!!hand.next);
    if (hand.next) this.nextView.setCard(hand.next, this.loadouts.player.unitLevels[hand.next.id]);
    this.spellButtons.forEach((b, i) =>
      b.refresh(this.spellRemaining('player', i), this.spells.player[i].total, this.selection?.kind === 'spell' && this.selection.index === i),
    );
  }

  /** Faixa com as dicas do tutorial, trocando a cada 6s. */
  private showTutorialHints(step: number) {
    const t = TUTORIAL[step];
    const banner = this.add
      .text(W / 2, ARENA_TOP + 26, '', {
        fontSize: '22px', fontStyle: 'bold', color: '#fef3c7', backgroundColor: '#111827dd', padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(90);
    let i = 0;
    const show = () => {
      banner.setText(`${t.title}  ·  ${t.hints[i % t.hints.length]}`);
      i++;
    };
    show();
    this.time.addEvent({ delay: 6000, loop: true, callback: show });
  }

  // ================================================================ input

  private setupInput() {
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.dragging && p.isDown) this.ghost.setPosition(p.x, p.y).setVisible(this.inArena(p));
      this.drawPreview(p);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const wasDragging = this.dragging;
      this.dragging = false;
      this.ghost.setVisible(false);
      if (wasDragging && this.inArena(p)) this.tryUse(p);
      this.drawPreview(p);
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (!over.length && this.selection && this.inArena(p)) this.tryUse(p);
    });
  }

  private select(sel: NonNullable<Selection>) {
    if (sel.kind === 'spell' && this.spellRemaining('player', sel.index) > 0) {
      this.floatText(this.spellButtons[sel.index].x, CARD_AREA_Y - 10, 'Recarregando', '#e9d5ff');
      return;
    }
    this.selection = sel;
    this.dragging = true;
    this.ghost.setText(sel.kind === 'card' ? this.hands.player.hand[sel.index].icon : this.spells.player[sel.index].def.icon);
    this.refreshHud();
  }

  private inArena(p: Phaser.Input.Pointer) {
    return p.y > HUD_HEIGHT && p.y < CARD_AREA_Y;
  }

  private tryUse(p: Phaser.Input.Pointer) {
    const sel = this.selection;
    if (!sel) return;
    if (sel.kind === 'card') {
      if (this.playCard('player', sel.index, p.x, p.y)) this.selection = null;
      else this.floatText(W / 2, CARD_AREA_Y - 30, 'Mana insuficiente', '#e9d5ff');
    } else {
      const def = this.spells.player[sel.index].def;
      if (this.castSpellAt('player', sel.index, p.x, p.y)) this.selection = null;
      else if (def.target === 'aliado') this.floatText(p.x, p.y - 30, 'Escolha uma tropa sua', '#fde68a');
    }
    this.refreshHud();
  }

  private drawPreview(p: Phaser.Input.Pointer) {
    const g = this.preview;
    g.clear();
    if (!this.selection || !this.inArena(p)) return;
    const lane = this.laneAt(p.y);
    const laneTop = LANES_Y[lane] - LANE_HEIGHT / 2 + 25;
    if (this.selection.kind === 'card') {
      const [minX, maxX] = this.spawnZone('player', lane);
      g.fillStyle(0xffffff, 0.15).fillRect(minX, laneTop, maxX - minX, LANE_HEIGHT - 50);
      const x = Phaser.Math.Clamp(p.x, minX, maxX);
      g.lineStyle(3, 0xffffff, 0.9).strokeCircle(x, LANES_Y[lane], 22);
      return;
    }
    const def = this.spells.player[this.selection.index].def;
    switch (def.target) {
      case 'ponto':
        g.lineStyle(3, 0xffffff, 0.8).strokeCircle(p.x, p.y, def.radius ?? 80);
        g.fillStyle(0xffffff, 0.12).fillCircle(p.x, p.y, def.radius ?? 80);
        break;
      case 'trilha':
        g.fillStyle(0xffffff, 0.15).fillRect(ARENA_LEFT, laneTop, ARENA_RIGHT - ARENA_LEFT, LANE_HEIGHT - 50);
        break;
      case 'aliado': {
        const ally = pickAlly(this, 'player', p.x, p.y);
        if (ally) g.lineStyle(4, COLORS.gold, 1).strokeCircle(ally.x, ally.y, ally.radius + 10);
        else g.lineStyle(3, 0xef4444, 0.8).strokeCircle(p.x, p.y, 20);
        break;
      }
      default:
        g.fillStyle(0xffffff, 0.08).fillRect(ARENA_LEFT, ARENA_TOP, ARENA_RIGHT - ARENA_LEFT, ARENA_BOTTOM - ARENA_TOP);
    }
  }
}
