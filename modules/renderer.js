import { state } from './state.js';

const container = document.getElementById('model-container');

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe4ebf5);

export const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 0.8, 8);

export let webglRenderer = null;

// Mutable references to scene objects (object properties stay live across module imports)
export const refs = { model: null, eggMesh: null, hatchTimeoutId: null };

try {
  webglRenderer = new THREE.WebGLRenderer({ antialias: true });
  webglRenderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(webglRenderer.domElement);
} catch (error) {
  console.error('WebGL konnte nicht initialisiert werden:', error);
  container.innerHTML = '<p style="padding:1rem;">3D-Ansicht ist auf diesem Gerät/Browser nicht verfügbar.</p>';
}

const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
dirLight.position.set(0, 50, 50);
scene.add(dirLight);
const rimLight = new THREE.DirectionalLight(0xb0c4ff, 0.6);
rimLight.position.set(-20, 20, -30);
scene.add(rimLight);

export function renderScene() {
  if (webglRenderer) {
    webglRenderer.render(scene, camera);
  }
}

export function animate() {
  requestAnimationFrame(animate);
  const t = Date.now();
  if (refs.model && !state.dead) {
    // Sanftes Schweben: zwei überlagerte Frequenzen für organisches Gefühl
    refs.model.position.y = Math.sin(t * 0.0014) * 0.16 + Math.sin(t * 0.0031) * 0.04;
    // Leichtes Wiegen links/rechts
    refs.model.rotation.z = Math.sin(t * 0.0009) * 0.055;
    // Minimales Nicken vor/zurück
    refs.model.rotation.x = Math.sin(t * 0.0007 + 1.2) * 0.025;
  }
  if (refs.eggMesh) {
    refs.eggMesh.rotation.y += 0.015;
  }
  renderScene();
}

window.addEventListener('resize', function () {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (!webglRenderer) return;
  webglRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderScene();
});
