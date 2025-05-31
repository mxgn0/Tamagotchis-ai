// 🧠 Lade oder setze Anfangswerte
let hunger = Number(localStorage.getItem("gotchiHunger")) || 50;
let mood = Number(localStorage.getItem("gotchiMood")) || 50;
let energy = Number(localStorage.getItem("gotchiEnergy")) || 50;
let level = Number(localStorage.getItem("gotchiLevel")) || 1;
let age = Number(localStorage.getItem("gotchiAge")) || 0;
let xp = Number(localStorage.getItem("gotchiXP")) || 0;
const XP_PER_LEVEL = 60;

let gotchiColor = localStorage.getItem("gotchiColor") || "#000";
document.getElementById("pet").style.color = gotchiColor;

// 🥚 Typ bestimmen
let gotchiType = localStorage.getItem("gotchiType");
if (!gotchiType) {
  const types = ["Feuer", "Wasser", "Pflanze"];
  gotchiType = types[Math.floor(Math.random() * types.length)];
  localStorage.setItem("gotchiType", gotchiType);
}

// 🕒 Reale Zeitveränderung
const lastActive = Number(localStorage.getItem("lastActiveTime"));
const now = Date.now();
if (lastActive) {
  const secondsPassed = Math.floor((now - lastActive) / 1000);
  hunger = Math.min(100, hunger + secondsPassed * 0.12);
  mood = Math.max(0, mood - secondsPassed * 0.1);
  energy = Math.max(0, energy - secondsPassed * 0.08);
  const newAge = age + Math.floor(secondsPassed / 5);
  const levelUps = Math.floor(newAge / 100) - Math.floor(age / 100);
  if (levelUps > 0) {
    level += levelUps;
    speak(`Level up! Ich bin jetzt Level ${level}`);
  }
  age = newAge;
}

// 🐣 Hatch-Logik
const petElement = document.getElementById("pet");
const hatched = localStorage.getItem("gotchiHatched");

const savedColor = localStorage.getItem("gotchiColor");
if (savedColor) {
  petElement.style.color = savedColor;
}

if (!hatched) {
  petElement.textContent = "🥚";
  petElement.addEventListener("click", function hatchOnce() {
    petElement.removeEventListener("click", hatchOnce);
    petElement.classList.add("shake");
    playBeep("hatch");
    setTimeout(() => {
      petElement.classList.remove("shake");
      petElement.textContent = getGotchiFace(gotchiType);

      // 🟢 Setze Standardfarbe nur beim ersten Mal
      const defaultColor = "#4CAF50";
      localStorage.setItem("gotchiColor", defaultColor);
      petElement.style.color = defaultColor;

      localStorage.setItem("gotchiHatched", "true");
    }, 1500);
  });
} else {
  petElement.textContent = getGotchiFace(gotchiType);
}

// 😺 Aussehen nach Typ
function getGotchiFace(type) {
  switch (type) {
    case "Feuer": return "🔥(•‿•)";
    case "Wasser": return "💧(◕‿◕)";
    case "Pflanze": return "🌿(＾▽＾)";
    default: return "(^_^)";
  }
}

// 📊 Anzeige
function updateStats() {
  document.getElementById("hunger").textContent = Math.round(hunger);
  document.getElementById("mood").textContent = Math.round(mood);
  document.getElementById("energy").textContent = Math.round(energy);
  document.getElementById("level").textContent = level;

  // Fortschrittsbalken: XP anzeigen ohne Zahl
  const xpProgress = document.getElementById("xpProgress");
  const xpInLevel = xp % XP_PER_LEVEL;
  if (xpProgress) {
    xpProgress.value = xpInLevel;
    xpProgress.max = XP_PER_LEVEL;

    // Optional: Farbe je nach Fortschritt
    const percent = (xpInLevel / XP_PER_LEVEL) * 100;
    if (percent < 33) xpProgress.style.setProperty('--progress-color', '#ff6666');
    else if (percent < 66) xpProgress.style.setProperty('--progress-color', '#ffaa00');
    else xpProgress.style.setProperty('--progress-color', '#66cc66');
  }

  // Alter anzeigen
  const ageMinutes = Math.floor(age / 12);
  const ageDays = Math.floor(ageMinutes / 1440);
  const ageHours = Math.floor((ageMinutes % 1440) / 60);
  const ageMins = ageMinutes % 60;
  document.getElementById("age").textContent = `${ageDays}d ${ageHours}h ${ageMins}m`;

  // Tod
  const now = Date.now();
const lastCare = Number(localStorage.getItem("lastCareTime")) || now;
const hoursSinceCare = (now - lastCare) / (1000 * 60 * 60);

if (hunger >= 100 || mood <= 0 || energy <= 0 || hoursSinceCare > 36) {
  petElement.textContent = "(x_x)";
  clearInterval(timer);
  speak("Ich bin gestorben...");
  alert("Dein Gotchi ist gestorben...");
} else if (hunger > 85 || energy < 20 || hoursSinceCare > 24) {
  petElement.textContent = "(ಠ_ಠ)";
} else {
  petElement.textContent = getGotchiFace(gotchiType);
}
}

// 🌱 Level & XP Management
function gainXP(amount) {
  xp += amount;
  if (xp >= level * XP_PER_LEVEL) {
    level += 1;
    speak(`Level up! Ich bin jetzt Level ${level}`);
      // 🎨 Neue Farbe generieren
  const randomColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
  document.getElementById("pet").style.color = randomColor;
  localStorage.setItem("gotchiColor", randomColor);
  }
}

// 🧠 GPT-Anfrage
async function askGotchi() {
  const chatBox = document.getElementById("chat");
  const loadingBar = document.getElementById("loadingBar");
  loadingBar.style.display = "block";
  chatBox.textContent = "";

  try {
    const response = await fetch("https://openai-proxy-swart-one.vercel.app/api/gpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hunger, mood, energy })
    });

    const data = await response.json();
    const reply = data?.reply || data?.choices?.[0]?.message?.content?.trim() || "GPT hat nichts gesagt 😕";
    chatBox.textContent = reply;
    speak(reply);
  } catch (error) {
    console.error("Fehler bei GPT-Anfrage:", error);
    chatBox.textContent = "Ich erreiche GPT gerade nicht.";
  } finally {
    loadingBar.style.display = "none";
  }
}

// 🔊 Sprachausgabe
function speak(text) {
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Sprechen fehlgeschlagen:", e);
  }
}

// 🔔 Töne
function playBeep(type = "default") {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = "sine";

  const freqMap = {
    eat: 300, play: 600, sleep: 150, hatch: 1200, default: 440
  };
  oscillator.frequency.setValueAtTime(freqMap[type] || freqMap.default, audioCtx.currentTime);
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.15);
}

// 🍎 Aktionen
function feed() {
  if (hunger > 60) gainXP(5);
  hunger = Math.max(0, hunger - 20);
  playBeep("eat");
  updateStats();
}

function play() {
  if (mood < 40) gainXP(5);
  mood = Math.min(100, mood + 20);
  playBeep("play");
  updateStats();
}

function sleep() {
  if (energy < 40) gainXP(5);
  energy = Math.min(100, energy + 20);
  playBeep("sleep");
  updateStats();
}

// ⏳ Hintergrundverlauf
const timer = setInterval(() => {
  hunger = Math.min(100, hunger + 0.6);
  mood = Math.max(0, mood - 0.5);
  energy = Math.max(0, energy - 0.4);
  if (hunger < 100 && mood > 0 && energy > 0) {
    age += 1;
    

  }
  localStorage.setItem("gotchiHunger", hunger);
  localStorage.setItem("gotchiMood", mood);
  localStorage.setItem("gotchiEnergy", energy);
  localStorage.setItem("gotchiLevel", level);
  localStorage.setItem("gotchiAge", age);
  localStorage.setItem("gotchiXP", xp);
  localStorage.setItem("lastActiveTime", Date.now());
  updateStats();
}, 5000);

// 👁 Initial anzeigen
updateStats();

// 📱 iOS-Zoom blockieren
let lastTouchTime = 0;
document.addEventListener('touchstart', function (e) {
  const currentTime = new Date().getTime();
  if (currentTime - lastTouchTime <= 300) e.preventDefault();
  lastTouchTime = currentTime;
}, { passive: false });
