import { state } from './state.js';
import { apiKeyInput, saveApiKeyButton, clearApiKeyButton, apiKeyStatus, appendChatMessage } from './ui.js';

const OPENAI_KEY_STORAGE = 'gotchiOpenAIKey';

export function getOpenAiKey() {
  return (window.OPENAI_API_KEY || localStorage.getItem(OPENAI_KEY_STORAGE) || '').trim();
}

export function updateApiKeyStatus() {
  const key = getOpenAiKey();
  if (window.OPENAI_API_KEY) {
    apiKeyStatus.textContent = 'Externer Key erkannt (window.OPENAI_API_KEY).';
  } else if (key) {
    apiKeyStatus.textContent = 'Lokaler API-Key gespeichert.';
  } else {
    apiKeyStatus.textContent = 'Kein API-Key gespeichert. Chat nutzt lokale Fallback-Antwort.';
  }
}

export function initAI() {
  if (saveApiKeyButton) {
    saveApiKeyButton.addEventListener('click', function () {
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
    clearApiKeyButton.addEventListener('click', function () {
      localStorage.removeItem(OPENAI_KEY_STORAGE);
      apiKeyInput.value = '';
      updateApiKeyStatus();
    });
  }

  updateApiKeyStatus();

  document.getElementById('talk').addEventListener('click', async function () {
    if (state.dead) return;
    const OPENAI_API_KEY = getOpenAiKey();
    const messages = [
      {
        role: "system",
        content: "Du bist ein virtuelles Tamagotchi-Haustier. Wenn der Benutzer dich fragt, wie es dir geht, antworte abwechslungsreich und liebevoll in Ich-Form mit nur einem Satz. Deine Antwort soll auf den aktuellen Werten für Hunger, Laune und Energie basieren."
      },
      {
        role: "user",
        content: `Wie geht's dir? (Hunger: ${Math.round(state.hunger)}/100, Laune: ${Math.round(state.mood)}/100, Energie: ${Math.round(state.energy)}/100)`
      }
    ];

    if (!OPENAI_API_KEY) {
      appendChatMessage(`Ich fühle mich gerade ${Math.round((state.hunger + state.mood + state.energy) / 3)}% fit. Trag unten deinen API-Key ein, dann antworte ich dynamischer.`);
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
      if (answer) appendChatMessage(answer);
    } catch (error) {
      appendChatMessage("Netzwerkfehler – probier es gleich nochmal.");
      console.error("Netzwerk- oder API-Fehler bei GPT-Anfrage:", error);
    }
  });
}
