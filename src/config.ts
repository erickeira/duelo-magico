import { BATTLE_RULES, CASTLE_BASE_HP } from './data/content';

// Layout (paisagem, 1280x720). O castelo do jogador fica à esquerda e o da IA à direita;
// as tropas andam no eixo X. As regras da partida vêm de src/data/content/rules.ts.
export const W = 1280;
export const H = 720;

export const HUD_HEIGHT = 56;
export const ARENA_TOP = 60;
export const ARENA_BOTTOM = 540;
export const LANES_Y = [140, 300, 460];
export const LANE_HEIGHT = 150;

export const ARENA_LEFT = 170; // frente do castelo do jogador
export const ARENA_RIGHT = 1110; // frente do castelo inimigo
export const MID_X = (ARENA_LEFT + ARENA_RIGHT) / 2;
export const CARD_AREA_Y = 550;
/** Distância mínima entre a tropa invocada e a tropa inimiga mais avançada. */
export const SPAWN_MARGIN = 40;

export const MATCH_TIME = BATTLE_RULES.matchSeconds;
export const DOUBLE_MANA_AT = BATTLE_RULES.doubleManaLastSeconds;
export const OVERTIME = BATTLE_RULES.overtimeSeconds;
export const MAX_MANA = BATTLE_RULES.maxMana;
export const START_MANA = BATTLE_RULES.startMana;
export const MANA_PER_SEC = 1 / BATTLE_RULES.secondsPerMana;
export const HAND_SIZE = BATTLE_RULES.handSize;

export const CASTLE_HP = CASTLE_BASE_HP;
export const CASTLE_RANGE = BATTLE_RULES.castleRange;
export const CASTLE_DAMAGE = BATTLE_RULES.castleDamage;
export const CASTLE_ATTACK_INTERVAL = BATTLE_RULES.castleAttackInterval;

export const COLORS = {
  player: 0x3b82f6,
  playerDark: 0x1e3a8a,
  enemy: 0xef4444,
  enemyDark: 0x7f1d1d,
  grass: 0x2f5d3a,
  lane: 0x6b5a3e,
  mana: 0xa855f7,
  gold: 0xfacc15,
  ui: 0x111827,
};

export type Team = 'player' | 'enemy';
export const other = (t: Team): Team => (t === 'player' ? 'enemy' : 'player');
