import Phaser from 'phaser';
import type { Rarity } from '../data/content';

/** Medidas de cada moldura, geradas por scripts/process-frames.py (public/assets/frames/frames.json). */
interface FrameMeta {
  width: number;
  height: number;
  /** Espessura média da borda, em pixels da textura. */
  border: number;
  /** Tamanho do recorte de canto do nine-slice, em pixels da textura. */
  slice: number;
}

export const FRAMES_JSON = 'frames';
export const frameKey = (rarity: Rarity) => `frame-${rarity}`;
export const RARITY_IDS: Rarity[] = ['comum', 'rara', 'epica', 'lendaria'];

export type FrameObject = Phaser.GameObjects.NineSlice | Phaser.GameObjects.Image;

/**
 * Moldura da raridade com `w`×`h` e borda de aproximadamente `borderPx` pixels.
 * Usa nine-slice (cantos ornamentados sem distorção) e uma escala para a borda ficar fina e nítida.
 * Retorna null se a arte da moldura não carregou.
 */
export function rarityFrame(scene: Phaser.Scene, rarity: Rarity, w: number, h: number, borderPx: number): FrameObject | null {
  const meta = (scene.cache.json.get(FRAMES_JSON) as Record<string, FrameMeta> | undefined)?.[rarity];
  if (!meta || !scene.textures.exists(frameKey(rarity))) return null;
  // O nine-slice do Phaser só existe no WebGL; no Canvas a moldura é só esticada.
  if (scene.sys.renderer.type !== Phaser.WEBGL) return scene.add.image(0, 0, frameKey(rarity)).setDisplaySize(w, h);
  const scale = borderPx / meta.border;
  const ns = scene.add.nineslice(0, 0, frameKey(rarity), undefined, w / scale, h / scale, meta.slice, meta.slice, meta.slice, meta.slice);
  ns.setScale(scale);
  return ns;
}
