// Alle Spielzustands-Variablen
let hunger, mood, energy;
let level, xp;
let baseColor;  // Aktuelle Basisfarbe des Modells (ändert sich bei Level-Up)
let birthTime, lastActionTime, lastTickTime;
let dead = false;
let dangerNotified = false;

// Referenzen auf DOM-Elemente
const hungerBar = document.getElementById('hunger-bar');
const moodBar = document.getElementById('mood-bar');
const energyBar = document.getElementById('energy-bar');
const xpBar = document.getElementById('xp-bar');
const levelNum = document.getElementById('level-num');
const ageDisplay = document.getElementById('age');
const chatBox = document.getElementById('chat');
const hungerValue = document.getElementById('hunger-value');
const moodValue = document.getElementById('mood-value');
const energyValue = document.getElementById('energy-value');
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyButton = document.getElementById('save-api-key');
const clearApiKeyButton = document.getElementById('clear-api-key');
const apiKeyStatus = document.getElementById('api-key-status');
const gotchiThemeSelect = document.getElementById('gotchi-theme-select');
const saveGotchiThemeButton = document.getElementById('save-gotchi-theme');
const randomGotchiThemeButton = document.getElementById('random-gotchi-theme');
const gotchiThemeStatus = document.getElementById('gotchi-theme-status');
// Emoji-Overlay für Gesichtsausdruck
const moodEmoji = document.createElement('div');
moodEmoji.className = 'mood-emoji';
document.getElementById('model-container').appendChild(moodEmoji);

// Gespeicherten Zustand laden (falls vorhanden)
if (localStorage.getItem('gotchiBirth')) {
  birthTime = parseInt(localStorage.getItem('gotchiBirth'));
} else {
  birthTime = Date.now();
  localStorage.setItem('gotchiBirth', birthTime);
}
if (localStorage.getItem('gotchiLastAction')) {
  lastActionTime = parseInt(localStorage.getItem('gotchiLastAction'));
} else {
  lastActionTime = Date.now();
  localStorage.setItem('gotchiLastAction', lastActionTime);
}
if (localStorage.getItem('gotchiLastTick')) {
  lastTickTime = parseInt(localStorage.getItem('gotchiLastTick'));
} else {
  lastTickTime = Date.now();
  localStorage.setItem('gotchiLastTick', lastTickTime);
}
if (localStorage.getItem('gotchiHunger')) {
  hunger = parseFloat(localStorage.getItem('gotchiHunger'));
  mood = parseFloat(localStorage.getItem('gotchiMood'));
  energy = parseFloat(localStorage.getItem('gotchiEnergy'));
  level = parseInt(localStorage.getItem('gotchiLevel'));
  xp = parseInt(localStorage.getItem('gotchiXP'));
  baseColor = localStorage.getItem('gotchiColor'); // kann null sein, falls noch nicht gesetzt
} else {
  hunger = 100;
  mood = 100;
  energy = 100;
  level = 1;
  xp = 0;
  baseColor = null;
  // Initialwerte speichern
  localStorage.setItem('gotchiHunger', hunger);
  localStorage.setItem('gotchiMood', mood);
  localStorage.setItem('gotchiEnergy', energy);
  localStorage.setItem('gotchiLevel', level);
  localStorage.setItem('gotchiXP', xp);
}

// Prüfen, ob >36h keine Aktion erfolgt ist (Vernachlässigung)
if (Date.now() - lastActionTime > 36 * 60 * 60 * 1000) {
  alert("Oh nein! Dein Gotchi ist gestorben. Das Spiel startet neu...");
  localStorage.clear();
  location.reload();
}

// UI mit initialen Werten aktualisieren
function updateUI() {
  hungerBar.value = hunger;
  moodBar.value = mood;
  energyBar.value = energy;
  xpBar.value = xp;
  hungerValue.textContent = String(Math.round(hunger));
  moodValue.textContent = String(Math.round(mood));
  energyValue.textContent = String(Math.round(energy));
  levelNum.textContent = level;
  // Alter berechnen
  let now = Date.now();
  let ageMs = now - birthTime;
  let ageMinutes = Math.floor(ageMs / 60000);
  let ageHours = Math.floor(ageMinutes / 60);
  let ageDays = Math.floor(ageHours / 24);
  ageHours = ageHours % 24;
  ageMinutes = ageMinutes % 60;
  // Plural/Singular anpassen
  let dayText = ageDays === 1 ? "Tag" : "Tage";
  let hourText = ageHours === 1 ? "Stunde" : "Stunden";
  let minuteText = ageMinutes === 1 ? "Minute" : "Minuten";
  ageDisplay.textContent = `Alter: ${ageDays} ${dayText}, ${ageHours} ${hourText}, ${ageMinutes} ${minuteText}`;
  // Gesichtsausdruck entsprechend der Werte
  if (!dead) {
    if (mood < 20) {
      moodEmoji.textContent = "😠";
      moodEmoji.style.display = "block";
    } else if (energy < 20) {
      moodEmoji.textContent = "😴";
      moodEmoji.style.display = "block";
    } else if (hunger < 20) {
      moodEmoji.textContent = "😢";
      moodEmoji.style.display = "block";
    } else {
      moodEmoji.style.display = "none";
    }
  }
}
updateUI();

// Three.js Setup (Szene, Kamera, Renderer)
const container = document.getElementById('model-container');
const width = container.clientWidth;
const height = container.clientHeight;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);
const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
let renderer = null;
let model = null;
let eggMesh = null;

const GOTCHI_THEME_STORAGE = 'gotchiTheme';
const GOTCHI_HATCHED_STORAGE = 'gotchiHasHatched';
const GOTCHI_THEMES = ['Feuer', 'Wasser', 'Erde', 'Luft', 'Metall'];
const THEME_COLORS = {
  Feuer: { body: 0xff7043, accent: 0xffca28 },
  Wasser: { body: 0x42a5f5, accent: 0x80deea },
  Erde: { body: 0x8d6e63, accent: 0x8bc34a },
  Luft: { body: 0xb3e5fc, accent: 0xffffff },
  Metall: { body: 0x90a4ae, accent: 0xe0e0e0 }
};

try {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);
} catch (error) {
  console.error('WebGL konnte nicht initialisiert werden:', error);
  container.innerHTML = '<p style="padding:1rem;">3D-Ansicht ist auf diesem Gerät/Browser nicht verfügbar.</p>';
}

function renderScene() {
  if (renderer) {
    renderer.render(scene, camera);
  }
}

// Lichtquellen hinzufügen
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(0, 50, 50);
scene.add(dirLight);

camera.position.set(0, 0.8, 8);

function createEgg() {
  const group = new THREE.Group();

  const shellMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 });
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

function createGotchi(theme) {
  const palette = THEME_COLORS[theme] || THEME_COLORS.Feuer;
  const group = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: palette.body,
    roughness: 0.55,
    metalness: theme === 'Metall' ? 0.8 : 0.2
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.15, 32, 32), bodyMaterial);
  body.position.y = 0.35;
  group.add(body);

  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), eyeMaterial);
  const eyeRight = eyeLeft.clone();
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

function pickRandomTheme() {
  const index = Math.floor(Math.random() * GOTCHI_THEMES.length);
  return GOTCHI_THEMES[index];
}

function spawnGotchi(theme) {
  if (model) {
    scene.remove(model);
  }
  model = createGotchi(theme);
  if (baseColor) {
    model.traverse(function(child) {
      if (child.isMesh && child.material && child.name === 'gotchi-body') {
        child.material.color.set(baseColor);
      }
    });
  }
  applyLevelVisuals();
  scene.add(model);
}

function hatchFirstGotchiIfNeeded() {
  if (!renderer) return;

  const storedTheme = localStorage.getItem(GOTCHI_THEME_STORAGE);
  const hasHatched = localStorage.getItem(GOTCHI_HATCHED_STORAGE) === '1';

  if (storedTheme && hasHatched) {
    spawnGotchi(storedTheme);
    return;
  }

  eggMesh = createEgg();
  scene.add(eggMesh);

  setTimeout(function() {
    if (eggMesh) {
      scene.remove(eggMesh);
      eggMesh = null;
    }
    const theme = pickRandomTheme();
    localStorage.setItem(GOTCHI_THEME_STORAGE, theme);
    localStorage.setItem(GOTCHI_HATCHED_STORAGE, '1');
    spawnGotchi(theme);
    appendChatMessage(`🐣 Dein Ei ist geschlüpft! Dein erstes Gotchi ist vom Element ${theme}.`);
  }, 1800);
}

hatchFirstGotchiIfNeeded();

// Bei Fenstergrößenänderung Canvas anpassen
window.addEventListener('resize', function() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (!renderer) return;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderScene();
});

// Animationsschleife (kontinuierliches Rendering)
function animate() {
  requestAnimationFrame(animate);
  if (model && !dead) {
    model.rotation.y += 0.004;
    model.position.y = Math.sin(Date.now() * 0.002) * 0.08;
  }
  if (eggMesh) {
    eggMesh.rotation.y += 0.015;
  }
  renderScene();
}
animate();

// Spiel-Logik

// Levelaufstieg verarbeiten
function levelUp() {
  level++;
  xp = 0;
  levelNum.textContent = level;
  // Modellfarbe bei Level-Up ändern
  if (model) {
    // Neue zufällige Farbe wählen (HSL für kräftige Farben)
    const newColor = new THREE.Color();
    newColor.setHSL(Math.random(), 0.8, 0.5);
    model.traverse(function(child) {
      if (child.isMesh && child.material && child.name === 'gotchi-body') {
        child.material.color.set(newColor);
      }
    });
    baseColor = "#" + newColor.getHexString();
    localStorage.setItem('gotchiColor', baseColor);
  }
  applyLevelVisuals();
  // Push-Benachrichtigung bei Level-Up
  notify("🎉 Dein Gotchi ist auf Level " + level + " aufgestiegen!");
}

// Tod des Gotchi verarbeiten
function die() {
  dead = true;
  // Todeszustand anzeigen (Modell grau färben, Emoji)
  if (model) {
    model.traverse(function(child) {
      if (child.isMesh && child.material) {
        child.material.color.set(0x555555);
      }
    });
  }
  moodEmoji.textContent = "👻";
  moodEmoji.style.display = "block";
  // Buttons deaktivieren
  document.querySelectorAll('#actions button').forEach(btn => btn.disabled = true);
  // Meldung anzeigen und Spiel zurücksetzen
  alert("Oh nein! Dein Gotchi ist gestorben. Das Spiel startet neu...");
  // Speicher leeren und Seite neu laden
  localStorage.clear();
  location.reload();
}

// Prüfen, ob Vernachlässigung (>36h keine Pflege)
function checkNeglect() {
  const now = Date.now();
  if (now - lastActionTime > 36 * 60 * 60 * 1000) {
    die();
  }
}

// Stat-Werte anhand vergangener Zeit verringern
function degrade(diffMs) {
  if (dead) return;
  const diffHours = diffMs / (1000 * 60 * 60);
  // Abbaurate pro Stunde
  const hungerRate = 4;
  const energyRate = 4;
  const moodRate = 2;
  hunger -= hungerRate * diffHours;
  mood -= moodRate * diffHours;
  energy -= energyRate * diffHours;
  // Untergrenze 0
  if (hunger < 0) hunger = 0;
  if (mood < 0) mood = 0;
  if (energy < 0) energy = 0;
  // Tod durch Erreichen von 0 prüfen
  if (hunger <= 0 || energy <= 0 || mood <= 0) {
    die();
    return;
  }
  // UI aktualisieren
  updateUI();
  // Bei kritischen Werten Warnung schicken
  if (!dangerNotified && (hunger < 20 || energy < 20 || mood < 20 || (Date.now() - lastActionTime > 30 * 60 * 60 * 1000))) {
    notify("⚠️ Dein Gotchi braucht dringend Pflege!");
    dangerNotified = true;
  }
  // Werte speichern
  localStorage.setItem('gotchiHunger', hunger);
  localStorage.setItem('gotchiMood', mood);
  localStorage.setItem('gotchiEnergy', energy);
  // Vernachlässigung erneut prüfen
  checkNeglect();
}

// Ausgleich für verstrichene Zeit seit letztem Update (bei Seiten-Neuladen)
const now = Date.now();
if (now > lastTickTime) {
  degrade(now - lastTickTime);
}
lastTickTime = Date.now();
localStorage.setItem('gotchiLastTick', lastTickTime);

// Stat-Verringerung im Intervall (jede Minute)
setInterval(function() {
  const now = Date.now();
  degrade(now - lastTickTime);
  lastTickTime = now;
  localStorage.setItem('gotchiLastTick', lastTickTime);
}, 60000);

// Button-Event-Handler für Interaktionen
document.getElementById('feed').addEventListener('click', function() {
  if (dead) return;
  if (hunger < 100) {
    // Füttern
    const oldHunger = hunger;
    hunger += 20;
    if (hunger > 100) hunger = 100;
    // XP vergeben, wenn Hunger tatsächlich aufgefüllt wurde
    if (oldHunger < 100) {
      xp += 10;
    }
    lastActionTime = Date.now();
    localStorage.setItem('gotchiLastAction', lastActionTime);
    dangerNotified = false;
    // Level-Up prüfen
    if (xp >= 100) {
      xp -= 100;
      levelUp();
    }
    // Zustand speichern
    localStorage.setItem('gotchiHunger', hunger);
    localStorage.setItem('gotchiMood', mood);
    localStorage.setItem('gotchiEnergy', energy);
    localStorage.setItem('gotchiLevel', level);
    localStorage.setItem('gotchiXP', xp);
    // UI aktualisieren
    updateUI();
    renderScene();
  }
});

document.getElementById('play').addEventListener('click', function() {
  if (dead) return;
  if (mood < 100) {
    // Spielen
    const oldMood = mood;
    mood += 20;
    if (mood > 100) mood = 100;
    // XP vergeben, wenn Laune tatsächlich aufgefüllt wurde
    if (oldMood < 100) {
      xp += 10;
    }
    lastActionTime = Date.now();
    localStorage.setItem('gotchiLastAction', lastActionTime);
    dangerNotified = false;
    if (xp >= 100) {
      xp -= 100;
      levelUp();
    }
    localStorage.setItem('gotchiHunger', hunger);
    localStorage.setItem('gotchiMood', mood);
    localStorage.setItem('gotchiEnergy', energy);
    localStorage.setItem('gotchiLevel', level);
    localStorage.setItem('gotchiXP', xp);
    updateUI();
    renderScene();
  }
});

document.getElementById('sleep').addEventListener('click', function() {
  if (dead) return;
  if (energy < 100) {
    // Schlafen
    const oldEnergy = energy;
    energy += 20;
    if (energy > 100) energy = 100;
    // XP vergeben, wenn Energie tatsächlich aufgefüllt wurde
    if (oldEnergy < 100) {
      xp += 10;
    }
    lastActionTime = Date.now();
    localStorage.setItem('gotchiLastAction', lastActionTime);
    dangerNotified = false;
    if (xp >= 100) {
      xp -= 100;
      levelUp();
    }
    localStorage.setItem('gotchiHunger', hunger);
    localStorage.setItem('gotchiMood', mood);
    localStorage.setItem('gotchiEnergy', energy);
    localStorage.setItem('gotchiLevel', level);
    localStorage.setItem('gotchiXP', xp);
    updateUI();
    renderScene();
  }
});

// GPT-Button ("Wie geht's dir?") – holt Antwort von OpenAI API
const OPENAI_KEY_STORAGE = 'gotchiOpenAIKey';

function getOpenAiKey() {
  return (window.OPENAI_API_KEY || localStorage.getItem(OPENAI_KEY_STORAGE) || '').trim();
}

function updateApiKeyStatus() {
  const key = getOpenAiKey();
  if (window.OPENAI_API_KEY) {
    apiKeyStatus.textContent = 'Externer Key erkannt (window.OPENAI_API_KEY).';
  } else if (key) {
    apiKeyStatus.textContent = 'Lokaler API-Key gespeichert.';
  } else {
    apiKeyStatus.textContent = 'Kein API-Key gespeichert. Chat nutzt lokale Fallback-Antwort.';
  }
}

function appendChatMessage(text) {
  if (chatBox.textContent) {
    chatBox.textContent += "\n" + text;
  } else {
    chatBox.textContent = text;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

if (saveApiKeyButton) {
  saveApiKeyButton.addEventListener('click', function() {
    const value = apiKeyInput.value.trim();
    if (!value) {
      apiKeyStatus.textContent = 'Bitte zuerst einen API-Key eingeben.';
      return;
    }
    localStorage.setItem(OPENAI_KEY_STORAGE, value);
    apiKeyInput.value = '';
    updateApiKeyStatus();
  });
}

if (clearApiKeyButton) {
  clearApiKeyButton.addEventListener('click', function() {
    localStorage.removeItem(OPENAI_KEY_STORAGE);
    apiKeyInput.value = '';
    updateApiKeyStatus();
  });
}

updateApiKeyStatus();

document.getElementById('talk').addEventListener('click', async function() {
  if (dead) return;
  const OPENAI_API_KEY = getOpenAiKey();
  // GPT-Anfrage vorbereiten
  const messages = [
    {
      role: "system",
      content: "Du bist ein virtuelles Tamagotchi-Haustier. Wenn der Benutzer dich fragt, wie es dir geht, antworte abwechslungsreich und liebevoll in Ich-Form mit nur einem Satz. Deine Antwort soll auf den aktuellen Werten für Hunger, Laune und Energie basieren."
    },
    {
      role: "user",
      content: `Wie geht's dir? (Hunger: ${Math.round(hunger)}/100, Laune: ${Math.round(mood)}/100, Energie: ${Math.round(energy)}/100)`
    }
  ];

  if (!OPENAI_API_KEY) {
    appendChatMessage(`Ich fühle mich gerade ${Math.round((hunger + mood + energy) / 3)}% fit. Trag unten deinen API-Key ein, dann antworte ich dynamischer.`);
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 50,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      appendChatMessage("Ich kann gerade nicht auf den KI-Service zugreifen.");
      console.error("GPT API Fehler:", response.status, response.statusText);
      return;
    }

    const data = await response.json();
    const answer = data.choices && data.choices.length ? data.choices[0].message.content.trim() : "";
    if (answer) {
      appendChatMessage(answer);
    }
  } catch (error) {
    appendChatMessage("Netzwerkfehler – probier es gleich nochmal.");
    console.error("Netzwerk- oder API-Fehler bei GPT-Anfrage:", error);
  }
});

// Benachrichtigungen einrichten
if ('Notification' in window) {
  Notification.requestPermission().then(permission => {
    console.log("Notification permission:", permission);
  });
}
function notify(msg) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(msg);
    } catch (e) {
      console.error("Notification error:", e);
    }
  }
}

// Zustand beim Schließen der Seite speichern
window.addEventListener('beforeunload', function() {
  localStorage.setItem('gotchiLastTick', Date.now());
  localStorage.setItem('gotchiHunger', hunger);
  localStorage.setItem('gotchiMood', mood);
  localStorage.setItem('gotchiEnergy', energy);
  localStorage.setItem('gotchiLevel', level);
  localStorage.setItem('gotchiXP', xp);
  if (baseColor) {
    localStorage.setItem('gotchiColor', baseColor);
  }
});
