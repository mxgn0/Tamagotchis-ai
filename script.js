// Anfangszustände
let hunger = 50;
let mood = 50;
let energy = 50;

// Anzeige aktualisieren
function update() {
  document.getElementById('hunger').textContent = hunger;
  document.getElementById('mood').textContent = mood;
  document.getElementById('energy').textContent = energy;

  if (hunger >= 100 || mood <= 0 || energy <= 0) {
    document.getElementById('pet').textContent = "(x_x)";
    clearInterval(timer);
    speak("Ich bin gestorben...");
    alert("Dein Gotchi ist gestorben...");
  }
}

// GPT-Anfrage mit Debug-Ausgabe
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
    window.speechSynthesis.cancel(); // Stopp vorherige Ausgabe
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Sprechen fehlgeschlagen:", e);
  }
}

// Aktionen
function feed() {
  hunger = Math.max(0, hunger - 10);
  speak("Danke fürs Füttern!");
  update();
}

function play() {
  mood = Math.min(100, mood + 10);
  energy = Math.max(0, energy - 10);
  speak("Juhu, das macht Spaß!");
  update();
}

function sleep() {
  energy = Math.min(100, energy + 20);
  hunger = Math.min(100, hunger + 10);
  speak("Gute Nacht...");
  update();
}

// Zustand verschlechtert sich über Zeit
const timer = setInterval(() => {
  hunger = Math.min(100, hunger + 0.3);  // langsamerer Anstieg
  mood = Math.max(0, mood - 0.2);
  energy = Math.max(0, energy - 0.2);
  updateStats();
}, 8000); // alle 8 Sekunden statt 5

// Initial anzeigen
update();
