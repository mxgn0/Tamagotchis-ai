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
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
container.appendChild(renderer.domElement);

// Lichtquellen hinzufügen
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(0, 50, 50);
scene.add(dirLight);

// FBX-Modell laden
let model = null;
const loader = typeof THREE.FBXLoader !== 'undefined' ? new THREE.FBXLoader() : new FBXLoader();
loader.load('models/gotchi.fbx', function(object) {
  model = object;
  // Gespeicherte Farbe anwenden (falls vorhanden)
  if (baseColor) {
    model.traverse(function(child) {
      if (child.isMesh && child.material) {
        child.material.color.set(baseColor);
      }
    });
  } else {
    // Falls keine Farbe gespeichert, Standardfarbe aus Modell übernehmen
    model.traverse(function(child) {
      if (!baseColor && child.isMesh && child.material && child.material.color) {
        baseColor = "#" + child.material.color.getHexString();
        localStorage.setItem('gotchiColor', baseColor);
      }
    });
  }
  // Modell zentrieren und an Kameraausschnitt anpassen
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.y -= center.y;
  model.position.z -= center.z;
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const radius = sphere.radius;
  if (radius > 0) {
    const fov = camera.fov * Math.PI / 180;
    const dist = radius / Math.sin(fov / 2);
    camera.position.set(0, 0, dist * 1.2);
  } else {
    camera.position.set(0, 0, 50);
  }
  scene.add(model);
  renderer.render(scene, camera);  // Erste Darstellung
});

// Bei Fenstergrößenänderung Canvas anpassen
window.addEventListener('resize', function() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
});

// Animationsschleife (kontinuierliches Rendering)
function animate() {
  requestAnimationFrame(animate);
  // Optional: Modell langsam rotieren (deaktiviert)
  // if (model) model.rotation.y += 0.002;
  renderer.render(scene, camera);
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
      if (child.isMesh && child.material) {
        child.material.color.set(newColor);
      }
    });
    baseColor = "#" + newColor.getHexString();
    localStorage.setItem('gotchiColor', baseColor);
  }
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
    // XP nur vergeben, wenn Hunger wirklich niedrig war (< 80)
    if (oldHunger < 80) {
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
    renderer.render(scene, camera);
  }
});

document.getElementById('play').addEventListener('click', function() {
  if (dead) return;
  if (mood < 100) {
    // Spielen
    const oldMood = mood;
    mood += 20;
    if (mood > 100) mood = 100;
    // XP nur vergeben, wenn Laune < 80
    if (oldMood < 80) {
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
    renderer.render(scene, camera);
  }
});

document.getElementById('sleep').addEventListener('click', function() {
  if (dead) return;
  if (energy < 100) {
    // Schlafen
    const oldEnergy = energy;
    energy += 20;
    if (energy > 100) energy = 100;
    // XP nur vergeben, wenn Energie < 80
    if (oldEnergy < 80) {
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
    renderer.render(scene, camera);
  }
});

// GPT-Button ("Wie geht's dir?") – holt Antwort von OpenAI API
const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY";
document.getElementById('talk').addEventListener('click', async function() {
  if (dead) return;
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
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 50,
        temperature: 0.7
      })
    });
    if (!response.ok) {
      console.error("GPT API Fehler:", response.statusText);
      return;
    }
    const data = await response.json();
    let answer = data.choices && data.choices.length ? data.choices[0].message.content.trim() : "";
    if (answer) {
      // Antwort im Chat-Fenster anzeigen
      if (chatBox.textContent) {
        chatBox.textContent += "\n" + answer;
      } else {
        chatBox.textContent = answer;
      }
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  } catch (error) {
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
