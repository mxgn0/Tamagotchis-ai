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
  const loading = document.getElementById("loading");

  // Ladeanzeige zeigen
  loading.style.display = "block";
  chatBox.textContent = "";

  try {
    const response = await fetch("https://openai-proxy-swart-one.vercel.app/api/gpt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        hunger: hunger,
        mood: mood,
        energy: energy
      })
    });

    const data = await response.json();
    console.log("GPT Antwort (roh):", data);

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
    // Ladeanzeige ausblenden
    loading.style.display = "none";
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
  hunger += 5;
  mood -= 2;
  energy -= 3;
  update();
}, 5000);

// Initial anzeigen
update();
