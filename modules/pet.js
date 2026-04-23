import { state } from './state.js';
import { scene, refs, webglRenderer } from './renderer.js';
import { appendChatMessage } from './ui.js';

const MODEL_PATH = './models/ChiniPose01_08.obj';
let loadedOBJ = null;
let modelBaseScale = 1;

export function loadGotchiModel() {
  return new Promise((resolve, reject) => {
    const loader = new THREE.OBJLoader();
    loader.load(
      MODEL_PATH,
      obj => {
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        // Mittelpunkt in die Geometrie einbrennen damit Klone zentriert sind
        // OBJ-Namen (zaehne, bart, krallen, augen) bleiben erhalten
        obj.traverse(child => {
          if (child.isMesh) {
            child.geometry.translate(-center.x, -center.y, -center.z);
          }
        });
        modelBaseScale = 2.5 / Math.max(size.x, size.y, size.z);
        loadedOBJ = obj;
        resolve();
      },
      undefined,
      err => { console.error('OBJ Ladefehler:', err); reject(err); }
    );
  });
}

export const GOTCHI_THEME_STORAGE = 'gotchiTheme';
export const GOTCHI_HATCHED_STORAGE = 'gotchiHasHatched';
export const GOTCHI_THEMES = ['Feuer', 'Wasser', 'Erde', 'Luft', 'Metall'];
export const THEME_COLORS = {
  Feuer:  { body: 0xff7043, accent: 0xffca28 },
  Wasser: { body: 0x42a5f5, accent: 0x80deea },
  Erde:   { body: 0x8d6e63, accent: 0x8bc34a },
  Luft:   { body: 0xb3e5fc, accent: 0xffffff },
  Metall: { body: 0x90a4ae, accent: 0xe0e0e0 }
};

export function createEgg() {
  const group = new THREE.Group();
  const shellMaterial = new THREE.MeshStandardMaterial({ color: 0xfff6de, roughness: 0.7 });
  const egg = new THREE.Mesh(new THREE.SphereGeometry(1.25, 32, 32), shellMaterial);
  egg.scale.set(0.95, 1.2, 0.95);
  group.add(egg);
  const crackMaterial = new THREE.MeshStandardMaterial({ color: 0xd6d6d6, roughness: 1 });
  for (let i = 0; i < 6; i++) {
    const crack = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.02), crackMaterial);
    crack.position.set(Math.sin(i) * 0.55, -0.1 + i * 0.04, Math.cos(i) * 0.55);
    crack.rotation.y = i;
    group.add(crack);
  }
  return group;
}

export function createGotchi(theme) {
  const palette = THEME_COLORS[theme] || THEME_COLORS.Feuer;
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({
    color: palette.body,
    roughness: 0.55,
    metalness: theme === 'Metall' ? 0.8 : 0.15
  });

  // Torso (leicht abgeflachte Kugel)
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.92, 32, 32), skinMat);
  torso.name = 'gotchi-body';
  torso.scale.set(1.08, 0.92, 1.0);
  torso.position.y = 0;
  group.add(torso);

  // Kopf (etwas größer, sitzt oben auf dem Torso)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.82, 32, 32), skinMat);
  head.name = 'gotchi-body';
  head.position.y = 1.45;
  group.add(head);

  // Augen mit Glanz-Punkt
  const eyeMat   = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const glintMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6 });
  const eyeGeo   = new THREE.SphereGeometry(0.115, 16, 16);
  const glintGeo = new THREE.SphereGeometry(0.038, 8, 8);

  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.3, 1.56, 0.73);
  const glintL = new THREE.Mesh(glintGeo, glintMat);
  glintL.position.set(0.04, 0.05, 0.09);
  eyeL.add(glintL);
  group.add(eyeL);

  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.3, 1.56, 0.73);
  const glintR = new THREE.Mesh(glintGeo, glintMat);
  glintR.position.set(0.04, 0.05, 0.09);
  eyeR.add(glintR);
  group.add(eyeR);

  // Wangenröte
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xff8fa3, transparent: true, opacity: 0.45, roughness: 1 });
  const cheekGeo = new THREE.SphereGeometry(0.18, 12, 12);
  const cheekL = new THREE.Mesh(cheekGeo, cheekMat);
  cheekL.scale.set(1, 0.55, 0.65);
  cheekL.position.set(-0.5, 1.38, 0.65);
  group.add(cheekL);
  const cheekR = cheekL.clone();
  cheekR.position.set(0.5, 1.38, 0.65);
  group.add(cheekR);

  // Arme (stumpfe Stummel)
  const armGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const armL = new THREE.Mesh(armGeo, skinMat);
  armL.name = 'gotchi-body';
  armL.scale.set(0.62, 0.48, 0.58);
  armL.position.set(-1.05, 0.05, 0.1);
  group.add(armL);
  const armR = new THREE.Mesh(armGeo, skinMat);
  armR.name = 'gotchi-body';
  armR.scale.set(0.62, 0.48, 0.58);
  armR.position.set(1.05, 0.05, 0.1);
  group.add(armR);

  // Füße (runde Stummel)
  const footGeo = new THREE.SphereGeometry(0.32, 16, 16);
  const footL = new THREE.Mesh(footGeo, skinMat);
  footL.name = 'gotchi-body';
  footL.scale.set(0.85, 0.52, 1.05);
  footL.position.set(-0.38, -0.95, 0.12);
  group.add(footL);
  const footR = new THREE.Mesh(footGeo, skinMat);
  footR.name = 'gotchi-body';
  footR.scale.set(0.85, 0.52, 1.05);
  footR.position.set(0.38, -0.95, 0.12);
  group.add(footR);

  // Element-Accessoire oben auf dem Kopf
  const accentMat = new THREE.MeshStandardMaterial({
    color: palette.accent,
    emissive: palette.accent,
    emissiveIntensity: theme === 'Feuer' ? 0.45 : 0.12,
    metalness: theme === 'Metall' ? 0.9 : 0.1
  });

  if (theme === 'Feuer') {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.72, 16), accentMat);
    flame.position.set(0, 2.32, 0);
    group.add(flame);
  } else if (theme === 'Wasser') {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), accentMat);
    drop.scale.set(0.8, 1.35, 0.8);
    drop.position.set(0, 2.35, 0);
    group.add(drop);
  } else if (theme === 'Erde') {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.18), accentMat);
    leaf.rotation.z = 0.45;
    leaf.position.set(0, 2.22, 0);
    group.add(leaf);
  } else if (theme === 'Luft') {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.07, 12, 48), accentMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, 2.3, 0);
    group.add(halo);
  } else if (theme === 'Metall') {
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 12), accentMat);
    antenna.position.set(0, 2.2, 0);
    group.add(antenna);
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), accentMat);
    node.position.set(0, 2.6, 0);
    group.add(node);
  }

  return group;
}

export function applyLevelVisuals() {
  if (!refs.model) return;

  const levelScale = (1 + Math.min((state.level - 1) * 0.05, 0.6)) * modelBaseScale;
  refs.model.scale.set(levelScale, levelScale, levelScale);

  const oldAura = refs.model.getObjectByName('level-aura');
  if (oldAura) refs.model.remove(oldAura);

  const auraCount = Math.min(Math.floor(state.level / 3), 4);
  if (auraCount <= 0) return;

  const auraGroup = new THREE.Group();
  auraGroup.name = 'level-aura';
  const auraMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff176,
    emissive: 0xfff176,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.85
  });

  for (let i = 0; i < auraCount; i++) {
    const angle = (Math.PI * 2 * i) / auraCount;
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), auraMaterial);
    orb.position.set(Math.cos(angle) * 1.6, 0.9 + (i % 2) * 0.25, Math.sin(angle) * 1.6);
    auraGroup.add(orb);
  }

  refs.model.add(auraGroup);
}

export function spawnGotchi(theme) {
  if (refs.model) scene.remove(refs.model);

  const palette = THEME_COLORS[theme] || THEME_COLORS.Feuer;
  const mat = new THREE.MeshStandardMaterial({
    color: state.baseColor || palette.body,
    roughness: 0.55,
    metalness: theme === 'Metall' ? 0.5 : 0.1
  });

  if (loadedOBJ) {
    refs.model = loadedOBJ.clone();
    const accentMat = new THREE.MeshStandardMaterial({
      color: palette.accent,
      roughness: 0.5,
      metalness: theme === 'Metall' ? 0.6 : 0.1
    });
    const teethMat = new THREE.MeshStandardMaterial({ color: 0xfff9e6, roughness: 0.9 });
    const eyeMat   = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });

    refs.model.traverse(child => {
      if (!child.isMesh) return;
      const n = child.name.toLowerCase();
      if (n.includes('zaehne')) {
        child.material = teethMat;
      } else if (n.includes('augen')) {
        child.material = eyeMat;
      } else if (n.includes('bart') || n.includes('krallen')) {
        child.name = 'gotchi-accent';
        child.material = accentMat;
      } else {
        child.name = 'gotchi-body';
        child.material = mat;
      }
    });
  } else {
    // Fallback: prozedurales Modell falls OBJ nicht geladen
    refs.model = createGotchi(theme);
    if (state.baseColor) {
      refs.model.traverse(child => {
        if (child.isMesh && child.name === 'gotchi-body') {
          child.material.color.set(state.baseColor);
        }
      });
    }
  }

  applyLevelVisuals();
  scene.add(refs.model);
}

export function hatchFirstGotchiIfNeeded() {
  if (!webglRenderer) return;

  const storedTheme = localStorage.getItem(GOTCHI_THEME_STORAGE);
  const hasHatched = localStorage.getItem(GOTCHI_HATCHED_STORAGE) === '1';

  if (storedTheme && hasHatched && GOTCHI_THEMES.includes(storedTheme)) {
    spawnGotchi(storedTheme);
    return;
  }

  refs.eggMesh = createEgg();
  scene.add(refs.eggMesh);

  refs.hatchTimeoutId = setTimeout(function () {
    if (refs.eggMesh) {
      scene.remove(refs.eggMesh);
      refs.eggMesh = null;
    }
    const theme = GOTCHI_THEMES[Math.floor(Math.random() * GOTCHI_THEMES.length)];
    localStorage.setItem(GOTCHI_THEME_STORAGE, theme);
    localStorage.setItem(GOTCHI_HATCHED_STORAGE, '1');
    spawnGotchi(theme);
    if (refs.model) {
      refs.model.scale.multiplyScalar(0.65);
      setTimeout(function () { applyLevelVisuals(); }, 260);
    }
    appendChatMessage(`🐣 Dein Ei ist geschlüpft! Dein erstes Gotchi ist vom Element ${theme}.`);
    refs.hatchTimeoutId = null;
  }, 1800);
}
