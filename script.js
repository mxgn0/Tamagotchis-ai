// 🧠 Werte initialisieren
let hunger = Number(localStorage.getItem("gotchiHunger")) || 50;
let mood = Number(localStorage.getItem("gotchiMood")) || 50;
let energy = Number(localStorage.getItem("gotchiEnergy")) || 50;
let level = Number(localStorage.getItem("gotchiLevel")) || 1;
let age = Number(localStorage.getItem("gotchiAge")) || 0;
let xp = Number(localStorage.getItem("gotchiXP")) || 0;
const XP_PER_LEVEL = 60;

// 📊 Anzeige aktualisieren
function updateStats() {
  document.getElementById("hunger").textContent = Math.round(hunger);
  document.getElementById("mood").textContent = Math.round(mood);
  document.getElementById("energy").textContent = Math.round(energy);
  document.getElementById("level").textContent = level;

  const xpProgress = document.getElementById("xpProgress");
  const xpInLevel = xp % XP_PER_LEVEL;
  xpProgress.value = xpInLevel;
  xpProgress.max = XP_PER_LEVEL;

  const ageMinutes = Math.floor(age / 12);
  const ageDays = Math.floor(ageMinutes / 1440);
  const ageHours = Math.floor((ageMinutes % 1440) / 60);
  const ageMins = ageMinutes % 60;
  document.getElementById("age").textContent = `${ageDays}d ${ageHours}h ${ageMins}m`;
}

function gainXP(amount) {
  xp += amount;
  if (xp >= level * XP_PER_LEVEL) {
    level += 1;
    const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
    if (model && model.children?.[0]?.material) {
      model.children[0].material.color.set(color);
    }
  }
}

// 🍎 Aktionen
function feed() {
  if (hunger > 60) gainXP(5);
  hunger = Math.max(0, hunger - 20);
  updateStats();
}

function play() {
  if (mood < 40) gainXP(5);
  mood = Math.min(100, mood + 20);
  updateStats();
}

function sleep() {
  if (energy < 40) gainXP(5);
  energy = Math.min(100, energy + 20);
  updateStats();
}

// ⏳ Hintergrundprozess
setInterval(() => {
  hunger = Math.min(100, hunger + 0.6);
  mood = Math.max(0, mood - 0.5);
  energy = Math.max(0, energy - 0.4);
  if (hunger < 100 && mood > 0 && energy > 0) age += 1;
  updateStats();
}, 5000);

// 👁️ Darstellung mit Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 400 / 400, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
const modelContainer = document.getElementById("pet");
renderer.setSize(400, 400);
modelContainer.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 1, 1).normalize();
scene.add(light);

camera.position.z = 100;

let model;
const loader = new THREE.FBXLoader();
loader.load("model.fbx", function (object) {
  model = object;
  model.scale.set(0.5, 0.5, 0.5);
  scene.add(model);
  animate();
}, undefined, function (error) {
  console.error("FBX Fehler:", error);
});

function animate() {
  requestAnimationFrame(animate);
  if (model) model.rotation.y += 0.01;
  renderer.render(scene, camera);
}

updateStats();
