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

update();
