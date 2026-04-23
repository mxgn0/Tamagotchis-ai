import { state } from './state.js';
import { scene, refs, webglRenderer } from './renderer.js';
import { appendChatMessage } from './ui.js';

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

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: palette.body,
    roughness: 0.55,
    metalness: theme === 'Metall' ? 0.8 : 0.2
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.15, 32, 32), bodyMaterial);
  body.name = 'gotchi-body';
  body.position.y = 0.35;
  group.add(body);

  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), eyeMaterial);
  eyeLeft.name = 'gotchi-eye';
  const eyeRight = eyeLeft.clone();
  eyeRight.name = 'gotchi-eye';
  eyeLeft.position.set(-0.33, 0.55, 1.0);
  eyeRight.position.set(0.33, 0.55, 1.0);
  group.add(eyeLeft);
  group.add(eyeRight);

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: palette.accent,
    emissive: palette.accent,
    emissiveIntensity: theme === 'Feuer' ? 0.3 : 0.1,
    metalness: theme === 'Metall' ? 0.9 : 0.1
  });

  if (theme === 'Feuer') {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 16), accentMaterial);
    flame.position.set(0, 1.7, 0);
    group.add(flame);
  } else if (theme === 'Wasser') {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 16), accentMaterial);
    drop.scale.set(0.8, 1.4, 0.8);
    drop.position.set(0, 1.6, 0);
    group.add(drop);
  } else if (theme === 'Erde') {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.2), accentMaterial);
    leaf.rotation.z = 0.45;
    leaf.position.set(0, 1.45, 0);
    group.add(leaf);
  } else if (theme === 'Luft') {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 12, 48), accentMaterial);
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, 1.55, 0);
    group.add(halo);
  } else if (theme === 'Metall') {
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12), accentMaterial);
    antenna.position.set(0, 1.55, 0);
    group.add(antenna);
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), accentMaterial);
    node.position.set(0, 1.95, 0);
    group.add(node);
  }

  return group;
}

export function applyLevelVisuals() {
  if (!refs.model) return;

  const levelScale = 1 + Math.min((state.level - 1) * 0.05, 0.6);
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
  refs.model = createGotchi(theme);
  if (state.baseColor) {
    refs.model.traverse(function (child) {
      if (child.isMesh && child.material && child.name === 'gotchi-body') {
        child.material.color.set(state.baseColor);
      }
    });
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
