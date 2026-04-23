import { state } from './state.js';

export const hungerBar = document.getElementById('hunger-bar');
export const moodBar = document.getElementById('mood-bar');
export const energyBar = document.getElementById('energy-bar');
export const xpBar = document.getElementById('xp-bar');
export const levelNum = document.getElementById('level-num');
export const ageDisplay = document.getElementById('age');
export const chatBox = document.getElementById('chat');
export const hungerValue = document.getElementById('hunger-value');
export const moodValue = document.getElementById('mood-value');
export const energyValue = document.getElementById('energy-value');
export const apiKeyInput = document.getElementById('api-key-input');
export const saveApiKeyButton = document.getElementById('save-api-key');
export const clearApiKeyButton = document.getElementById('clear-api-key');
export const apiKeyStatus = document.getElementById('api-key-status');

export const moodEmoji = document.createElement('div');
moodEmoji.className = 'mood-emoji';
document.getElementById('model-container').appendChild(moodEmoji);

export function updateUI() {
  hungerBar.value = state.hunger;
  moodBar.value = state.mood;
  energyBar.value = state.energy;
  xpBar.value = state.xp;
  hungerValue.textContent = String(Math.round(state.hunger));
  moodValue.textContent = String(Math.round(state.mood));
  energyValue.textContent = String(Math.round(state.energy));
  levelNum.textContent = state.level;

  const now = Date.now();
  const ageMs = now - state.birthTime;
  let ageMinutes = Math.floor(ageMs / 60000);
  let ageHours = Math.floor(ageMinutes / 60);
  const ageDays = Math.floor(ageHours / 24);
  ageHours = ageHours % 24;
  ageMinutes = ageMinutes % 60;
  const dayText = ageDays === 1 ? "Tag" : "Tage";
  const hourText = ageHours === 1 ? "Stunde" : "Stunden";
  const minuteText = ageMinutes === 1 ? "Minute" : "Minuten";
  ageDisplay.textContent = `Alter: ${ageDays} ${dayText}, ${ageHours} ${hourText}, ${ageMinutes} ${minuteText}`;

  if (!state.dead) {
    if (state.mood < 20) {
      moodEmoji.textContent = "😠";
      moodEmoji.style.display = "block";
    } else if (state.energy < 20) {
      moodEmoji.textContent = "😴";
      moodEmoji.style.display = "block";
    } else if (state.hunger < 20) {
      moodEmoji.textContent = "😢";
      moodEmoji.style.display = "block";
    } else {
      moodEmoji.style.display = "none";
    }
  }
}

export function appendChatMessage(text) {
  if (chatBox.textContent) {
    chatBox.textContent += "\n" + text;
  } else {
    chatBox.textContent = text;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}
