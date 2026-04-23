import { state, loadState, saveState, saveStats } from './modules/state.js';
import { initNotifications } from './modules/notifications.js';
import { updateUI } from './modules/ui.js';
import { animate, renderScene } from './modules/renderer.js';
import { loadGotchiModel, hatchFirstGotchiIfNeeded } from './modules/pet.js';
import { startGameLoop, levelUp } from './modules/gameLoop.js';
import { initAI } from './modules/ai.js';

// 1. State aus localStorage laden
loadState();

// 2. Sofortige Vernachlässigungs-Prüfung (>36h keine Pflege)
if (Date.now() - state.lastActionTime > 36 * 60 * 60 * 1000) {
  alert("Oh nein! Dein Gotchi ist gestorben. Das Spiel startet neu...");
  localStorage.clear();
  location.reload();
}

// 3. UI mit geladenen Werten befüllen
updateUI();

// 4. OBJ parallel laden + Ei sofort zeigen — kein Blocking mehr
const modelReady = loadGotchiModel();
hatchFirstGotchiIfNeeded(modelReady);

// 5. Render-Loop starten
animate();

// 6. Spielschleife starten (Offline-Ausgleich + minütlicher Tick)
startGameLoop();

// 7. Aktions-Buttons
function handleAction(stat, amount) {
  if (state.dead || state[stat] >= 100) return;
  const oldVal = state[stat];
  state[stat] = Math.min(state[stat] + amount, 100);
  if (oldVal < 100) state.xp += 10;
  state.lastActionTime = Date.now();
  localStorage.setItem('gotchiLastAction', state.lastActionTime);
  state.dangerNotified = false;
  if (state.xp >= 100) { state.xp -= 100; levelUp(); }
  saveStats();
  updateUI();
  renderScene();
}

document.getElementById('feed').addEventListener('click',  () => handleAction('hunger', 20));
document.getElementById('play').addEventListener('click',  () => handleAction('mood',   20));
document.getElementById('sleep').addEventListener('click', () => handleAction('energy', 20));

// 8. AI-Chat initialisieren
initAI();

// 9. Push-Benachrichtigungen initialisieren
initNotifications();

// 10. Zustand beim Schließen der Seite sichern
window.addEventListener('beforeunload', saveState);
