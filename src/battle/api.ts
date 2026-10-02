import type Phaser from 'phaser';
import type { Team } from '../config';
import type { Castle } from './Castle';
import type { StatusKind, Unit, UnitStats } from './Unit';

/** Efeito contínuo na arena (chão em brasa, muralha, lança atravessando a trilha…). */
export interface ArenaEffect {
  /** Retorna false quando terminou. */
  update(dt: number): boolean;
  destroy(): void;
}

export interface SpawnOptions {
  summoned?: boolean;
  /** Segundos até a tropa sumir (invocações). */
  duration?: number;
  onExpire?: (u: Unit) => void;
}

/** O que habilidades, magias e IA podem fazer na batalha. Implementado pelo BattleScene. */
export interface BattleApi {
  /** Fábrica de objetos da cena (para efeitos visuais). */
  readonly add: Phaser.GameObjects.GameObjectFactory;
  /** Segundos desde o início da partida (inclui prorrogação). */
  readonly now: number;
  readonly units: Unit[];
  readonly castles: Record<Team, Castle>;

  spawnUnit(team: Team, stats: UnitStats, lane: number, x: number, opts?: SpawnOptions): Unit;
  /** Dano com escudo, aura, vulnerabilidade, roubo de vida e abates. Retorna o dano que chegou à vida. */
  dealDamage(target: Unit | Castle, amount: number, source?: Unit | null): number;
  heal(target: Unit, amount: number): void;
  addShield(target: Unit, amount: number, duration: number, onBreak?: (u: Unit) => void): void;
  applyStatus(target: Unit, kind: StatusKind, duration: number, value?: number): void;
  knockback(target: Unit, px: number): void;

  enemiesInRadius(team: Team, x: number, y: number, r: number, includeAir?: boolean): Unit[];
  alliesInRadius(team: Team, x: number, y: number, r: number): Unit[];
  unitsInLane(team: Team, lane: number): Unit[];
  /** Tropa de `team` mais próxima do castelo inimigo dela, na trilha. */
  mostAdvanced(team: Team, lane: number): Unit | undefined;
  laneAt(y: number): number;

  addEffect(effect: ArenaEffect): void;
  /** Círculo que aparece e some, para feedback visual de área. */
  pulse(x: number, y: number, r: number, color: number, alpha?: number): void;
  floatText(x: number, y: number, text: string, color?: string): void;
}
