// Zustand des Tamagotchis
let hunger = 50;
let mood = 50;
let energy = 50;

// Update-Funktion für Anzeigen
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

// GPT-Chat-Funktion
async function askGotchi() {
  const response = await fetch("https://openai-proxy-swart-one.vercel.app/api/gpt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ hunger, mood, energy })
  });

  const data = await response.json();
  
  console.log("GPT antwortet (roh):", data);

  const reply = data.choices?.[0]?.message?.content?.trim() || "GPT hat nichts gesagt 😕";

  // Versuche verschiedene Zugriffspfade
    const reply =
      data?.reply || // falls dein Proxy `reply:` zurückgibt
      data?.choices?.[0]?.message?.content?.trim() || // direkt aus GPT-Rohstruktur
      "GPT hat nichts gesagt 😕";

    document.getElementById("chat").textContent = reply;
    speak(reply);

  } catch (error) {
    console.error("Fehler bei GPT-Anfrage:", error);
    document.getElementById("chat").textContent = "Ich erreiche GPT gerade nicht.";
  }

  // 🗣️ Sprachwiedergabe
  speak(reply);
}

// Sprachausgabe-Funktion (Text-to-Speech)
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  window.speechSynthesis.speak(utterance);
}

// Timer: Zustände verschlechtern sich
const timer = setInterval(() => {
  hunger += 5;
  mood -= 2;
  energy -= 3;
  update();
}, 5000);

// Initialer Aufruf
update();
