/**
 * Mapa dos ossos de cada modelo do Meshy (o rig automático usa nomes genéricos: Bone_000…)
 * e as animações procedurais. Os ângulos usam eixos do MUNDO: o personagem olha para +Z,
 * o lado esquerdo dele é +X e "pitch" positivo gira o membro para a frente.
 */

export interface RigMap {
  root: string;
  spine: string[]; // da base para o peito
  head: string;
  leftArm: [string, string]; // ombro, cotovelo
  rightArm: [string, string];
  leftLeg: [string, string]; // quadril, joelho
  rightLeg: [string, string];
}

export const RIGS: Record<string, RigMap> = {
  golem: {
    root: 'Bone_000',
    spine: ['Bone_004', 'Bone_003', 'Bone_002'],
    head: 'Bone_017',
    leftArm: ['Bone_021', 'Bone_020'],
    rightArm: ['Bone_026', 'Bone_025'],
    leftLeg: ['Bone_009', 'Bone_008'],
    rightLeg: ['Bone_014', 'Bone_013'],
  },
};

/** Pose de um quadro: rotações em graus por parte do corpo e deslocamento do corpo inteiro. */
export interface Pose {
  /** Inclinação para a frente (graus). */
  pitch?: Partial<Record<Part, number>>;
  /** Giro em torno do eixo vertical (graus). */
  yaw?: Partial<Record<Part, number>>;
  /** Inclinação lateral (graus). */
  roll?: Partial<Record<Part, number>>;
  /** Deslocamento do modelo inteiro, em metros. */
  offset?: { y?: number; z?: number };
}

export type Part =
  | 'root' | 'spine' | 'head'
  | 'leftShoulder' | 'leftElbow' | 'rightShoulder' | 'rightElbow'
  | 'leftHip' | 'leftKnee' | 'rightHip' | 'rightKnee';

export interface AnimDef {
  frames: number;
  fps: number;
  loop: boolean;
  /** p de 0 a 1 (fração da animação) → pose. */
  pose: (p: number) => Pose;
}

const TAU = Math.PI * 2;
const ease = (t: number) => t * t * (3 - 2 * t);
/** Interpola entre pares [p, valor], com suavização. */
function keys(p: number, k: [number, number][]): number {
  if (p <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (p <= k[i][0]) {
      const [p0, v0] = k[i - 1];
      const [p1, v1] = k[i];
      return v0 + (v1 - v0) * ease((p - p0) / (p1 - p0));
    }
  }
  return k[k.length - 1][1];
}

/** Animações de um personagem pesado (Golem). Outros tipos de corpo podem ter conjuntos próprios. */
export const HEAVY_ANIMS: Record<string, AnimDef> = {
  idle: {
    frames: 8, fps: 6, loop: true,
    pose: (p) => {
      const s = Math.sin(p * TAU);
      return {
        pitch: { spine: 2 * s, head: -1.5 * s, leftShoulder: 3 * s, rightShoulder: 3 * s },
        offset: { y: -0.01 * (1 - Math.cos(p * TAU)) / 2 },
      };
    },
  },
  walk: {
    frames: 8, fps: 8, loop: true,
    pose: (p) => {
      const s = Math.sin(p * TAU);
      return {
        pitch: {
          leftHip: 24 * s,
          rightHip: -24 * s,
          leftKnee: -32 * Math.max(0, -s),
          rightKnee: -32 * Math.max(0, s),
          leftShoulder: -18 * s,
          rightShoulder: 18 * s,
          spine: 4,
        },
        yaw: { spine: 5 * s },
        roll: { spine: 3 * Math.sin(p * TAU * 2) },
        // Passo pesado: o corpo afunda quando um pé toca o chão.
        offset: { y: -0.035 * Math.abs(Math.cos(p * TAU)) },
      };
    },
  },
  attack: {
    frames: 10, fps: 12, loop: false,
    pose: (p) => {
      // Ergue os dois punhos acima da cabeça e soca o chão à frente. No Golem os punhos já ficam
      // à frente do corpo em repouso, então o soco é um giro para baixo (pitch negativo).
      const arms = keys(p, [[0, 0], [0.35, 150], [0.55, -40], [0.8, -40], [1, 0]]);
      const elbow = keys(p, [[0, 0], [0.35, 40], [0.55, 0], [1, 0]]);
      const spine = keys(p, [[0, 0], [0.35, -12], [0.55, 32], [0.8, 32], [1, 0]]);
      return {
        pitch: { leftShoulder: arms, rightShoulder: arms, leftElbow: elbow, rightElbow: elbow, spine, head: -spine * 0.4 },
        offset: { y: keys(p, [[0, 0], [0.35, 0.02], [0.55, -0.08], [0.8, -0.08], [1, 0]]) },
      };
    },
  },
  death: {
    frames: 10, fps: 12, loop: false,
    pose: (p) => {
      // Cambaleia para trás e desaba de frente.
      const fall = keys(p, [[0, 0], [0.25, -10], [1, 82]]);
      return {
        pitch: {
          root: fall,
          leftShoulder: keys(p, [[0, 0], [0.25, -20], [1, 60]]),
          rightShoulder: keys(p, [[0, 0], [0.25, -20], [1, 50]]),
          leftKnee: keys(p, [[0, 0], [0.5, -40], [1, -10]]),
          rightKnee: keys(p, [[0, 0], [0.5, -40], [1, -10]]),
          head: keys(p, [[0, 0], [1, 20]]),
        },
        offset: { y: keys(p, [[0, 0], [0.3, -0.05], [1, -0.5]]), z: keys(p, [[0, 0], [1, 0.25]]) },
      };
    },
  },
};
