import { state } from './state.js';
import { refs } from './renderer.js';
import { moodEmoji, updateUI } from './ui.js';
import { applyLevelVisuals } from './pet.js';
import { notify } from './notifications.js';

export function die() {
  state.dead = true;
  if (refs.model) {
    refs.model.traverse(function (child) {
      if (child.isMesh && child.material) {
        child.material.color.set(0x555555);
      }
    });
  }
  moodEmoji.textContent = "👻";
  moodEmoji.style.display = "block";
  document.querySelectorAll('#actions button').forEach(btn => btn.disabled = true);
  alert("Oh nein! Dein Gotchi ist gestorben. Das Spiel startet neu...");
  localStorage.clear();
  location.reload();
}

export function checkNeglect() {
  if (Date.now() - state.lastActionTime > 36 * 60 * 60 * 1000) {
    die();
  }
}

export function levelUp() {
  state.level++;
  state.xp = 0;
  if (refs.model) {
    const newColor = new THREE.Color();
    newColor.setHSL(Math.random(), 0.8, 0.5);
    refs.model.traverse(function (child) {
      if (child.isMesh && child.material && child.name === 'gotchi-body') {
        child.material.color.set(newColor);
      }
    });
    state.baseColor = "#" + newColor.getHexString();
    localStorage.setItem('gotchiColor', state.baseColor);
  }
  applyLevelVisuals();
  updateUI();
  notify("🎉 Dein Gotchi ist auf Level " + state.level + " aufgestiegen!");
}

export function degrade(diffMs) {
  if (state.dead) return;
  const diffHours = diffMs / (1000 * 60 * 60);
  state.hunger -= 4 * diffHours;
  state.mood   -= 2 * diffHours;
  state.energy -= 4 * diffHours;
  if (state.hunger < 0) state.hunger = 0;
  if (state.mood   < 0) state.mood   = 0;
  if (state.energy < 0) state.energy = 0;
  if (state.hunger <= 0 || state.energy <= 0 || state.mood <= 0) {
    die();
    return;
  }
  updateUI();
  if (!state.dangerNotified && (
    state.hunger < 20 || state.energy < 20 || state.mood < 20 ||
    (Date.now() - state.lastActionTime > 30 * 60 * 60 * 1000)
  )) {
    notify("⚠️ Dein Gotchi braucht dringend Pflege!");
    state.dangerNotified = true;
  }
  localStorage.setItem('gotchiHunger', state.hunger);
  localStorage.setItem('gotchiMood', state.mood);
  localStorage.setItem('gotchiEnergy', state.energy);
  checkNeglect();
}

export function startGameLoop() {
  const now = Date.now();
  if (now > state.lastTickTime) {
    degrade(now - state.lastTickTime);
  }
  state.lastTickTime = Date.now();
  localStorage.setItem('gotchiLastTick', state.lastTickTime);

  setInterval(function () {
    const now = Date.now();
    degrade(now - state.lastTickTime);
    state.lastTickTime = now;
    localStorage.setItem('gotchiLastTick', state.lastTickTime);
  }, 60000);
}
