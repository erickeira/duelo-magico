/**
 * Renderizador de sprites: carrega um modelo do Meshy (art/models/<id>.glb), anima o esqueleto por
 * código (rigs.ts), renderiza cada quadro de lado com fundo transparente e salva as folhas em
 * public/assets/sprites/<id>/ via a rota de desenvolvimento /__sprites (vite.config.ts).
 *
 * Uso: npm run dev → http://localhost:5180/tools/sprite-renderer/?model=golem&save=1
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HEAVY_ANIMS, RIGS, type AnimDef, type Part, type Pose, type RigMap } from './rigs';

const RENDER = 512; // resolução de trabalho
const FRAME_H = 192; // altura final de cada quadro
const OUTLINE = 3; // contorno em px (no quadro final)
const OUTLINE_COLOR = '#14101f';
const CAM_YAW = 25; // graus mostrando um pouco da frente
const CAM_PITCH = 12; // graus de cima

const params = new URLSearchParams(location.search);
const modelId = params.get('model') ?? 'golem';
const save = params.get('save') === '1';
const log = (msg: string) => {
  document.getElementById('log')!.textContent += `${msg}\n`;
  console.log(msg);
};

// ------------------------------------------------------------ cena

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(RENDER, RENDER);
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);
document.getElementById('stage')!.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x5a5470, 1.6));
const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(-3, 5, 4);
scene.add(key);
const rim = new THREE.DirectionalLight(0xbfe7ff, 1.2);
rim.position.set(2, 3, -4);
scene.add(rim);

const HALF = 1.4;
const camera = new THREE.OrthographicCamera(-HALF, HALF, HALF, -HALF, 0.1, 50);
const target = new THREE.Vector3(0, 0.9, 0);
{
  const a = THREE.MathUtils.degToRad(CAM_YAW);
  const e = THREE.MathUtils.degToRad(CAM_PITCH);
  // Câmera do lado -X: assim a frente do personagem (+Z) fica à direita da tela.
  camera.position.copy(target).add(new THREE.Vector3(-Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)).multiplyScalar(10));
  camera.lookAt(target);
}

// ------------------------------------------------------------ esqueleto

interface BoneRef {
  bone: THREE.Object3D;
  rest: THREE.Quaternion;
}

const AXIS = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
/** Partes que apontam para baixo (membros): "para a frente" é rotação negativa em X. */
const HANGING: Part[] = ['leftShoulder', 'leftElbow', 'rightShoulder', 'rightElbow', 'leftHip', 'leftKnee', 'rightHip', 'rightKnee'];
/** Ordem de aplicação: pais antes dos filhos. */
const ORDER: Part[] = ['root', 'spine', 'head', 'leftHip', 'leftKnee', 'rightHip', 'rightKnee', 'leftShoulder', 'leftElbow', 'rightShoulder', 'rightElbow'];

function bonesFor(model: THREE.Object3D, rig: RigMap): Record<Part, BoneRef[]> {
  const get = (name: string): BoneRef => {
    const bone = model.getObjectByName(name);
    if (!bone) throw new Error(`osso não encontrado: ${name}`);
    return { bone, rest: bone.quaternion.clone() };
  };
  return {
    root: [get(rig.root)],
    spine: rig.spine.map(get),
    head: [get(rig.head)],
    leftShoulder: [get(rig.leftArm[0])],
    leftElbow: [get(rig.leftArm[1])],
    rightShoulder: [get(rig.rightArm[0])],
    rightElbow: [get(rig.rightArm[1])],
    leftHip: [get(rig.leftLeg[0])],
    leftKnee: [get(rig.leftLeg[1])],
    rightHip: [get(rig.rightLeg[0])],
    rightKnee: [get(rig.rightLeg[1])],
  };
}

/** Gira um osso em torno de um eixo do mundo, preservando a hierarquia. */
function rotateWorld(bone: THREE.Object3D, axis: THREE.Vector3, deg: number) {
  if (!deg) return;
  const parentQ = new THREE.Quaternion();
  bone.parent!.getWorldQuaternion(parentQ);
  const qWorld = new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(deg));
  const delta = parentQ.clone().invert().multiply(qWorld).multiply(parentQ);
  bone.quaternion.premultiply(delta);
  bone.updateMatrixWorld(true);
}

function applyPose(model: THREE.Object3D, bones: Record<Part, BoneRef[]>, pose: Pose) {
  for (const refs of Object.values(bones)) for (const r of refs) r.bone.quaternion.copy(r.rest);
  model.position.set(0, pose.offset?.y ?? 0, pose.offset?.z ?? 0);
  model.updateMatrixWorld(true);
  for (const part of ORDER) {
    const refs = bones[part];
    const share = 1 / refs.length; // na coluna, o ângulo é dividido entre as vértebras
    for (const r of refs) {
      const pitch = (pose.pitch?.[part] ?? 0) * share;
      rotateWorld(r.bone, AXIS.x, HANGING.includes(part) ? -pitch : pitch);
      rotateWorld(r.bone, AXIS.y, (pose.yaw?.[part] ?? 0) * share);
      rotateWorld(r.bone, AXIS.z, (pose.roll?.[part] ?? 0) * share);
    }
  }
}

// ------------------------------------------------------------ 2D: recorte, contorno e folhas

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Caixa que contém os pixels visíveis de todos os quadros. */
function unionBox(frames: HTMLCanvasElement[]) {
  let x0 = RENDER, y0 = RENDER, x1 = 0, y1 = 0;
  for (const f of frames) {
    const data = f.getContext('2d')!.getImageData(0, 0, RENDER, RENDER).data;
    for (let y = 0; y < RENDER; y++) {
      for (let x = 0; x < RENDER; x++) {
        if (data[(y * RENDER + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
  }
  return { x0, y0, x1, y1 };
}

/** Recorta, reduz e aplica o contorno escuro (como o traço das cartas). */
function finishFrame(src: HTMLCanvasElement, box: { x: number; y: number; w: number; h: number }, scale: number, fw: number, fh: number) {
  const pad = OUTLINE + 1;
  const scaled = canvas(fw, fh);
  const sctx = scaled.getContext('2d')!;
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(src, box.x, box.y, box.w, box.h, pad, pad, box.w * scale, box.h * scale);

  const silhouette = canvas(fw, fh);
  const sil = silhouette.getContext('2d')!;
  sil.drawImage(scaled, 0, 0);
  sil.globalCompositeOperation = 'source-in';
  sil.fillStyle = OUTLINE_COLOR;
  sil.fillRect(0, 0, fw, fh);

  const out = canvas(fw, fh);
  const ctx = out.getContext('2d')!;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.drawImage(silhouette, Math.cos(a) * OUTLINE, Math.sin(a) * OUTLINE);
  }
  ctx.drawImage(scaled, 0, 0);
  return out;
}

async function post(url: string, body: Blob | string) {
  const res = await fetch(url, { method: 'POST', body });
  if (!res.ok) throw new Error(`falha ao salvar ${url}: ${res.status}`);
}

// ------------------------------------------------------------ execução

async function run() {
  const rig = RIGS[modelId];
  if (!rig) throw new Error(`sem mapa de ossos para "${modelId}" em rigs.ts`);
  const anims: Record<string, AnimDef> = HEAVY_ANIMS;

  log(`Carregando art/models/${modelId}.glb…`);
  const gltf = await new GLTFLoader().loadAsync(`/art/models/${modelId}.glb`);
  const model = gltf.scene;
  scene.add(model);
  const bones = bonesFor(model, rig);

  // 1) Renderiza todos os quadros em alta resolução.
  const rendered: Record<string, HTMLCanvasElement[]> = {};
  for (const [name, def] of Object.entries(anims)) {
    rendered[name] = [];
    for (let i = 0; i < def.frames; i++) {
      const p = def.loop ? i / def.frames : i / (def.frames - 1);
      applyPose(model, bones, def.pose(p));
      renderer.render(scene, camera);
      const c = canvas(RENDER, RENDER);
      c.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
      rendered[name].push(c);
    }
    log(`${name}: ${def.frames} quadros`);
  }

  // 2) Um único recorte para todas as animações, para o personagem manter tamanho e posição.
  const u = unionBox(Object.values(rendered).flat());
  const box = { x: u.x0, y: u.y0, w: u.x1 - u.x0 + 1, h: u.y1 - u.y0 + 1 };
  const scale = (FRAME_H - 2 * (OUTLINE + 1)) / box.h;
  const fw = Math.ceil(box.w * scale) + 2 * (OUTLINE + 1);
  const fh = FRAME_H;

  // Onde fica o chão (pé do personagem) dentro do quadro: usado para posicionar a sprite no jogo.
  applyPose(model, bones, {});
  const ground = new THREE.Vector3(0, 0, 0).project(camera);
  const gx = ((ground.x + 1) / 2) * RENDER;
  const gy = ((1 - ground.y) / 2) * RENDER;
  const anchorX = (OUTLINE + 1 + (gx - box.x) * scale) / fw;
  const anchorY = (OUTLINE + 1 + (gy - box.y) * scale) / fh;

  // 3) Monta as folhas (um quadro ao lado do outro).
  const manifest = { frameWidth: fw, frameHeight: fh, anchorX: +anchorX.toFixed(3), anchorY: +anchorY.toFixed(3), anims: {} as Record<string, unknown> };
  const preview = document.getElementById('sheets')!;
  for (const [name, frames] of Object.entries(rendered)) {
    const def = anims[name];
    const sheet = canvas(fw * frames.length, fh);
    frames.forEach((f, i) => sheet.getContext('2d')!.drawImage(finishFrame(f, box, scale, fw, fh), i * fw, 0));
    manifest.anims[name] = { frames: def.frames, fps: def.fps, loop: def.loop };
    const img = new Image();
    img.src = sheet.toDataURL('image/png');
    img.title = name;
    preview.append(Object.assign(document.createElement('h3'), { textContent: name }), img);
    if (save) {
      const blob = await new Promise<Blob>((r) => sheet.toBlob((b) => r(b!), 'image/png'));
      await post(`/__sprites?unit=${modelId}&anim=${name}`, blob);
    }
  }
  if (save) await post(`/__sprites?unit=${modelId}`, JSON.stringify(manifest));
  log(`Quadro ${fw}×${fh}, âncora (${manifest.anchorX}, ${manifest.anchorY})${save ? ' — salvo em public/assets/sprites/' : ''}`);
  (window as unknown as { renderDone: unknown }).renderDone = manifest;
}

run().catch((e) => {
  log(`ERRO: ${e.message}`);
  (window as unknown as { renderDone: unknown }).renderDone = { error: String(e.message) };
});
