// Variables globales
let cards = [];
let cardWidth = 100, cardHeight = 100;
let cols = 5, rows = 4;
let selectedCards = [];
let canClick = true;
let totalPairs = 10;
let matchedCount = 0;
let gameState = "notStarted"; // Estados: notStarted, playing, won

// Referencias a botones
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

// Clase Card
class Card {
  constructor(image, id) {
    this.image = image;
    this.id = id;
    this.isFaceUp = false;
    this.isMatched = false;
    this.x = 0;
    this.y = 0;
  }
  
  draw() {
    stroke(0);
    // Dibujamos el contorno de la carta
    fill(255);
    rect(this.x, this.y, cardWidth, cardHeight);
    // Si la carta está volteada o ya fue emparejada, se muestra la imagen
    if (this.isFaceUp || this.isMatched) {
      if (this.image) {
        image(this.image, this.x, this.y, cardWidth, cardHeight);
      }
    } else {
      // Parte trasera de la carta
      fill(150);
      rect(this.x, this.y, cardWidth, cardHeight);
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(20);
      text("Poké", this.x + cardWidth / 2, this.y + cardHeight / 2);
    }
  }
  
  contains(px, py) {
    return (px >= this.x && px <= this.x + cardWidth &&
            py >= this.y && py <= this.y + cardHeight);
  }
}

// p5.js setup: crea el canvas
function setup() {
  // Creamos un canvas con un margen para centrarlo
  let canvas = createCanvas(cols * cardWidth + 20, rows * cardHeight + 20);
  canvas.parent(document.body);
}

// p5.js draw: se dibuja el fondo y las cartas según el estado del juego
function draw() {
  background(220);
  
  if (gameState === "playing" || gameState === "won") {
    for (let card of cards) {
      card.draw();
    }
  }
  
  // Si el juego ha finalizado, se muestra el mensaje de victoria y el botón de reiniciar
  if (gameState === "won") {
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(0);
    text("¡Ganaste!", width / 2, height / 2);
    restartButton.style.display = "inline-block";
  }
}

// Función para iniciar/reiniciar el juego
function startGame() {
  // Reiniciamos variables globales
  cards = [];
  selectedCards = [];
  matchedCount = 0;
  canClick = true;
  gameState = "playing";
  
  // Ocultamos los botones de inicio/reinicio
  startButton.style.display = "none";
  restartButton.style.display = "none";
  
  // Cargamos las cartas
  loadPokemonCards();
}

// Función asíncrona para obtener 10 Pokémon desde la PokéAPI
async function loadPokemonCards() {
  let ids = [];
  // Elegimos 10 números aleatorios únicos entre 1 y 151
  while(ids.length < totalPairs) {
    let num = floor(random(1, 152));
    if (!ids.includes(num)) {
      ids.push(num);
    }
  }
  
  // Obtenemos la URL de la imagen de cada Pokémon (sprites.front_default)
  let promises = ids.map(async (id) => {
    let url = `https://pokeapi.co/api/v2/pokemon/${id}/`;
    let response = await fetch(url);
    let data = await response.json();
    return { id: id, imgUrl: data.sprites.front_default };
  });
  
  let results = await Promise.all(promises);
  
  // Para cada resultado, cargamos la imagen y creamos dos cartas (pares)
  let tempCards = [];
  for (let res of results) {
    let img = await new Promise(resolve => {
      loadImage(res.imgUrl, resolve);
    });
    let card1 = new Card(img, res.id);
    let card2 = new Card(img, res.id);
    tempCards.push(card1, card2);
  }
  
  // Mezclamos las cartas aleatoriamente
  shuffleArray(tempCards);
  // Asignamos posiciones en una cuadrícula
  for (let i = 0; i < tempCards.length; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    tempCards[i].x = col * cardWidth + 10;
    tempCards[i].y = row * cardHeight + 10;
  }
  cards = tempCards;
}

// p5.js mousePressed: maneja la selección de cartas
function mousePressed() {
  if (gameState !== "playing" || !canClick) return;
  
  // Verifica si se hizo clic sobre alguna carta
  for (let card of cards) {
    if (card.contains(mouseX, mouseY) && !card.isFaceUp && !card.isMatched) {
      card.isFaceUp = true;
      selectedCards.push(card);
      break;
    }
  }
  
  // Si se han seleccionado dos cartas, se comprueba si coinciden
  if (selectedCards.length === 2) {
    canClick = false;
    if (selectedCards[0].id === selectedCards[1].id) {
      // Si coinciden, se marcan como emparejadas y se reinicia la selección
      selectedCards[0].isMatched = true;
      selectedCards[1].isMatched = true;
      matchedCount++;
      selectedCards = [];
      canClick = true;
      // Si se han encontrado todas las parejas, se cambia el estado del juego
      if (matchedCount === totalPairs) {
        gameState = "won";
      }
    } else {
      // Si no coinciden, se voltean nuevamente después de 1 segundo
      setTimeout(() => {
        selectedCards[0].isFaceUp = false;
        selectedCards[1].isFaceUp = false;
        selectedCards = [];
        canClick = true;
      }, 1000);
    }
  }
}

// Función para mezclar el arreglo de cartas (algoritmo Fisher-Yates)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = floor(random(0, i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Asignamos los eventos a los botones
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
