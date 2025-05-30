// Anfangszustände
let hunger = 50;
let mood = 50;
let energy = 50;

// Gotchi-Typ festlegen
let gotchiType = localStorage.getItem("gotchiType");
if (!gotchiType) {
  const types = ["Feuer", "Wasser", "Pflanze"];
  gotchiType = types[Math.floor(Math.random() * types.length)];
  localStorage.setItem("gotchiType", gotchiType);
}

// Hat es schon geschlüpft?
const petElement = document.getElementById("pet");
const hatched = localStorage.getItem("gotchiHatched");

if (!hatched) {
  petElement.textContent = "🥚";
  setTimeout(() => {
    petElement.textContent = getGotchiFace(gotchiType);
    localStorage.setItem("gotchiHatched", "true");
  }, 3000);
} else {
  petElement.textContent = getGotchiFace(gotchiType);
}

// Zeigt das Gesicht je nach Typ
function getGotchiFace(type) {
  switch (type) {
    case "Feuer": return "🔥(•‿•)";
    case "Wasser": return "💧(◕‿◕)";
    case "Pflanze": return "🌿(＾▽＾)";
    default: return "(^_^)";
  }
}

// Anzeige aktualisieren
function updateStats() {
  document.getElementById("hunger").textContent = Math.round(hunger);
  document.getElementById("mood").textContent = Math.round(mood);
  document.getElementById("energy").textContent = Math.round(energy);

  if (hunger >= 100 || mood <= 0 || energy <= 0) {
    document.getElementById('pet').textContent = "(x_x)";
    clearInterval(timer);
    speak("Ich bin gestorben...");
    alert("Dein Gotchi ist gestorben...");
  }
}

// GPT-Anfrage
async function askGotchi() {
  const chatBox = document.getElementById("chat");
  const loadingBar = document.getElementById("loadingBar");

  loadingBar.style.display = "block";
  chatBox.textContent = "";

  try {
    const response = await fetch("https://openai-proxy-swart-one.vercel.app/api/gpt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ hunger, mood, energy })
    });

    const data = await response.json();
    const reply =
      data?.reply ||
      data?.choices?.[0]?.message?.content?.trim() ||
      "GPT hat nichts gesagt 😕";

    chatBox.textContent = reply;
    speak(reply);

  } catch (error) {
    console.error("Fehler bei GPT-Anfrage:", error);
    chatBox.textContent = "Ich erreiche GPT gerade nicht.";
  } finally {
    loadingBar.style.display = "none";
  }
}

// Sprachausgabe
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

// Töne
function playBeep(type = "default") {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = "sine";

  if (type === "eat") oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
  else if (type === "play") oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
  else if (type === "sleep") oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
  else oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.15);
}

// Aktionen
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

// Zustand verschlechtert sich über Zeit
const timer = setInterval(() => {
  hunger = Math.min(100, hunger + 0.6);
  mood = Math.max(0, mood - 0.5);
  energy = Math.max(0, energy - 0.4);
  updateStats();
}, 5000);

// Initial anzeigen
updateStats();

// Doppeltipp-Zoom auf iOS blockieren
let lastTouchTime = 0;
document.addEventListener('touchstart', function (e) {
  const currentTime = new Date().getTime();
  if (currentTime - lastTouchTime <= 300) e.preventDefault();
  lastTouchTime = currentTime;
}, { passive: false });
