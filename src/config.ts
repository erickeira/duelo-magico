// Layout (retrato, 720x1280) e regras gerais da partida.
export const W = 720;
export const H = 1280;

export const LANES_X = [150, 360, 570];
export const LANE_WIDTH = 190;

export const ARENA_TOP = 200; // frente do castelo inimigo
export const ARENA_BOTTOM = 940; // frente do castelo do jogador
export const MID_Y = (ARENA_TOP + ARENA_BOTTOM) / 2;
export const CARD_AREA_Y = 1060;

export const MATCH_TIME = 180;
export const DOUBLE_MANA_AT = 60; // últimos N segundos com mana em dobro
export const MAX_MANA = 10;
export const START_MANA = 5;
export const MANA_PER_SEC = 1 / 1.4;
export const HAND_SIZE = 4;

export const CASTLE_HP = 3000;
export const CASTLE_RANGE = 240;
export const CASTLE_DAMAGE = 45;
export const CASTLE_ATTACK_INTERVAL = 0.9;

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
