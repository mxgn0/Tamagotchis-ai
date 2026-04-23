export const state = {
  hunger: 100,
  mood: 100,
  energy: 100,
  level: 1,
  xp: 0,
  baseColor: null,
  birthTime: null,
  lastActionTime: null,
  lastTickTime: null,
  dead: false,
  dangerNotified: false
};

export function loadState() {
  if (localStorage.getItem('gotchiBirth')) {
    state.birthTime = parseInt(localStorage.getItem('gotchiBirth'));
  } else {
    state.birthTime = Date.now();
    localStorage.setItem('gotchiBirth', state.birthTime);
  }

  if (localStorage.getItem('gotchiLastAction')) {
    state.lastActionTime = parseInt(localStorage.getItem('gotchiLastAction'));
  } else {
    state.lastActionTime = Date.now();
    localStorage.setItem('gotchiLastAction', state.lastActionTime);
  }

  if (localStorage.getItem('gotchiLastTick')) {
    state.lastTickTime = parseInt(localStorage.getItem('gotchiLastTick'));
  } else {
    state.lastTickTime = Date.now();
    localStorage.setItem('gotchiLastTick', state.lastTickTime);
  }

  if (localStorage.getItem('gotchiHunger') !== null) {
    state.hunger = parseFloat(localStorage.getItem('gotchiHunger'));
    state.mood = parseFloat(localStorage.getItem('gotchiMood'));
    state.energy = parseFloat(localStorage.getItem('gotchiEnergy'));
    state.level = parseInt(localStorage.getItem('gotchiLevel'));
    state.xp = parseInt(localStorage.getItem('gotchiXP'));
    state.baseColor = localStorage.getItem('gotchiColor');
    if (!state.baseColor || !/^#?[0-9a-fA-F]{6}$/.test(state.baseColor)) {
      state.baseColor = null;
    } else if (state.baseColor.charAt(0) !== '#') {
      state.baseColor = '#' + state.baseColor;
    }
  } else {
    localStorage.setItem('gotchiHunger', state.hunger);
    localStorage.setItem('gotchiMood', state.mood);
    localStorage.setItem('gotchiEnergy', state.energy);
    localStorage.setItem('gotchiLevel', state.level);
    localStorage.setItem('gotchiXP', state.xp);
  }
}

export function saveStats() {
  localStorage.setItem('gotchiHunger', state.hunger);
  localStorage.setItem('gotchiMood', state.mood);
  localStorage.setItem('gotchiEnergy', state.energy);
  localStorage.setItem('gotchiLevel', state.level);
  localStorage.setItem('gotchiXP', state.xp);
}

export function saveState() {
  localStorage.setItem('gotchiLastTick', Date.now());
  localStorage.setItem('gotchiHunger', state.hunger);
  localStorage.setItem('gotchiMood', state.mood);
  localStorage.setItem('gotchiEnergy', state.energy);
  localStorage.setItem('gotchiLevel', state.level);
  localStorage.setItem('gotchiXP', state.xp);
  if (state.baseColor) {
    localStorage.setItem('gotchiColor', state.baseColor);
  }
}
