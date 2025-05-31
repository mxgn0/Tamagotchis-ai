// 🧠 Lade oder setze Anfangswerte
let hunger = Number(localStorage.getItem("gotchiHunger")) || 50;
let mood = Number(localStorage.getItem("gotchiMood")) || 50;
let energy = Number(localStorage.getItem("gotchiEnergy")) || 50;
let level = Number(localStorage.getItem("gotchiLevel")) || 1;
let age = Number(localStorage.getItem("gotchiAge")) || 0;

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

if (!hatched) {
  petElement.textContent = "🥚";
  petElement.addEventListener("click", function hatchOnce() {
    petElement.removeEventListener("click", hatchOnce);
    petElement.classList.add("shake");
    playBeep("hatch");
    setTimeout(() => {
      petElement.classList.remove("shake");
      petElement.textContent = getGotchiFace(gotchiType);
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

// 🧮 Anzeige
function updateStats() {
  document.getElementById("hunger").textContent = Math.round(hunger);
  document.getElementById("mood").textContent = Math.round(mood);
  document.getElementById("energy").textContent = Math.round(energy);
  const levelDisplay = document.getElementById("level");
  if (levelDisplay) levelDisplay.textContent = level;

  if (hunger >= 100 || mood <= 0 || energy <= 0) {
    document.getElementById('pet').textContent = "(x_x)";
    clearInterval(timer);
    speak("Ich bin gestorben...");
    alert("Dein Gotchi ist gestorben...");
  }
}

// 🗣 GPT-Anfrage
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
  hunger = Math.max(0, hunger - 20);
  playBeep("eat");
  updateStats();
}
function play() {
  mood = Math.min(100, mood + 20);
  playBeep("play");
  updateStats();
}
function sleep() {
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
    if (age % 100 === 0) {
      level += 1;
      speak(`Level up! Ich bin jetzt Level ${level}`);
    }
  }
  localStorage.setItem("gotchiHunger", hunger);
  localStorage.setItem("gotchiMood", mood);
  localStorage.setItem("gotchiEnergy", energy);
  localStorage.setItem("gotchiLevel", level);
  localStorage.setItem("gotchiAge", age);
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
