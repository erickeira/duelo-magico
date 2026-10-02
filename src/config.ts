// Layout (paisagem, 1280x720) e regras gerais da partida.
// O castelo do jogador fica à esquerda e o da IA à direita; as tropas andam no eixo X.
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
