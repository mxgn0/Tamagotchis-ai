let hunger = 50;
let mood = 50;
let energy = 50;

function update() {
  document.getElementById('hunger').textContent = hunger;
  document.getElementById('mood').textContent = mood;
  document.getElementById('energy').textContent = energy;

  if (hunger >= 100 || mood <= 0 || energy <= 0) {
    document.getElementById('pet').textContent = "(x_x)";
    clearInterval(timer);
    alert("Dein Gotchi ist gestorben...");
  }
}

function feed() {
  hunger = Math.max(0, hunger - 10);
  update();
}

function play() {
  mood = Math.min(100, mood + 10);
  energy = Math.max(0, energy - 10);
  update();
}

function sleep() {
  energy = Math.min(100, energy + 20);
  hunger = Math.min(100, hunger + 10);
  update();
}

const timer = setInterval(() => {
  hunger += 5;
  mood -= 2;
  energy -= 3;
  update();
}, 3000);

//chat gpt chat
async function getPetAdvice(hunger, mood, energy) {
  const prompt = `Das Haustier hat Hunger: ${hunger}, Laune: ${mood}, Energie: ${energy}. Was braucht es am meisten? Antworte so, als wärst du das Haustier.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer DEIN_API_KEY_HIER"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    })
  });

  const data = await response.json();
  const message = data.choices[0].message.content;
  document.getElementById("chat").textContent = message;
}

update();
