// ===================================================
// 🧩 BLOCKA - Juego de Rompecabezas (Canvas Puro)
// ===================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Estados del juego
let gameState = "menu"; // "menu", "playing", "win"
let currentLevel = 1;
let pieces = [];
let image = new Image();
let currentFilter = null;

// Elementos del DOM
const menuScreen = document.getElementById("menuScreen");
const winScreen = document.getElementById("winScreen");
const winLevel = document.getElementById("winLevel");
const startBtn = document.getElementById("startBtn");
const nextLevelBtn = document.getElementById("nextLevelBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");

// Imagen base
const images = [
  "images/simpsons1.jpg",
  "images/simpsons2.jpg",
  "images/simpsons3.jpg",
  "images/simpsons4.jpg",
  "images/simpsons5.jpg",
];

// ---------------------------------------------------
// 🎮 INICIO DEL JUEGO
// ---------------------------------------------------
startBtn.addEventListener("click", () => {
  menuScreen.style.display = "none";
  canvas.style.display = "block";
  winScreen.style.display = "none";
  startLevel(currentLevel);
});

nextLevelBtn.addEventListener("click", () => {
  winScreen.style.display = "none";

  if (currentLevel < images.length) {
    currentLevel++;
    startLevel(currentLevel);
  } else {
    canvas.style.display = "block";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = "none";

    let dotCount = 0;
    const maxDots = 3;

    const interval = setInterval(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // limpiar canvas

      // Fondo semitransparente
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Texto centrado
      ctx.fillStyle = "#E0AAFF";
      ctx.font = "bold 36px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 4;

      // Texto con puntos animados
      let dots = ".".repeat(dotCount);
      ctx.fillText(`Cargando nuevamente el juego${dots}`, canvas.width / 2, canvas.height / 2);

      dotCount = (dotCount + 1) % (maxDots + 1); // incrementa hasta maxDots y vuelve a 0
    }, 500); // cada 0.5 segundos cambia

    // Después de 3 segundos, volver al menú
    setTimeout(() => {
      clearInterval(interval); // detener animación
      canvas.style.display = "none";
      menuScreen.style.display = "block";
      currentLevel = 1;
      gameState = "menu";
    }, 6000);
  }
});



backToMenuBtn.addEventListener("click", () => {
  winScreen.style.display = "none";
  canvas.style.display = "none";
  menuScreen.style.display = "block";
  currentLevel = 1;
  gameState = "menu";
});

// ---------------------------------------------------
// 🖼️ CONFIGURAR Y CARGAR NIVEL
// ---------------------------------------------------
function startLevel(level) {
  gameState = "playing";
  canvas.style.display = "block";
  image.src = images[level - 1];

  image.onload = () => {
    setupPieces();
    draw();
  };
}

// ---------------------------------------------------
// 🧠 CREAR PIEZAS DEL ROMPECABEZAS
// ---------------------------------------------------
function setupPieces() {
  pieces = [];
  const rows = 2; // siempre 2 filas
  const cols = 2; // siempre 2 columnas
  const pieceW = canvas.width / cols;
  const pieceH = canvas.height / rows;

  // Filtros disponibles
  const filters = ["grayscale", "brightness", "blur", "darken"];

  // FILTRO GLOBAL POR NIVEL: cada 2 niveles a partir del 2 aplica un filtro diferente
  if (currentLevel >= 2) {
    const filterIndex = Math.floor(currentLevel - 2)  % filters.length;
    currentFilter = filters[filterIndex];
  } else {
    currentFilter = null;
  }

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const piece = {
        x: j * pieceW,
        y: i * pieceH,
        w: pieceW,
        h: pieceH,
        sx: j * (image.width / cols),
        sy: i * (image.height / rows),
        sw: image.width / cols,
        sh: image.height / rows,
        rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)],
        filter: currentFilter
      };
      pieces.push(piece);
    }
  }
}

// ---------------------------------------------------
// 🌀 APLICAR FILTROS VISUALES
// ---------------------------------------------------
function applyFilter(ctx, filterName) {
  switch (filterName) {
    case "grayscale":
      ctx.filter = "grayscale(100%)";
      break;
    case "brightness":
      ctx.filter = "brightness(20%)";
      break;
    case "blur":
      ctx.filter = "blur(5px)";
      break;
    case "darken":
      ctx.filter = "opacity(20%)";
      break;
    default:
      ctx.filter = "none";
  }
}

// ---------------------------------------------------
// 🎨 DIBUJAR PIEZAS EN EL CANVAS
// ---------------------------------------------------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const piece of pieces) {
    ctx.save();
    ctx.translate(piece.x + piece.w / 2, piece.y + piece.h / 2);
    ctx.rotate((piece.rotation * Math.PI) / 180);
    ctx.translate(-piece.w / 2, -piece.h / 2);

    applyFilter(ctx, piece.filter);
    ctx.drawImage(image, piece.sx, piece.sy, piece.sw, piece.sh, 0, 0, piece.w, piece.h);
    ctx.restore();
  }

  ctx.filter = "none";

  if (gameState === "playing") requestAnimationFrame(draw);
}

// ---------------------------------------------------
// 🖱️ CONTROL DE ROTACIÓN DE PIEZAS
// ---------------------------------------------------
canvas.addEventListener("click", (e) => {
  if (gameState !== "playing") return;

  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  for (const piece of pieces) {
    if (
      mx >= piece.x &&
      mx < piece.x + piece.w &&
      my >= piece.y &&
      my < piece.y + piece.h
    ) {
      piece.rotation = (piece.rotation + 90) % 360;
      draw();
      checkWin();
      break;
    }
  }
});

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  if (gameState !== "playing") return;

  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  for (const piece of pieces) {
    if (
      mx >= piece.x &&
      mx < piece.x + piece.w &&
      my >= piece.y &&
      my < piece.y + piece.h
    ) {
      piece.rotation = (piece.rotation + 270) % 360;
      draw();
      checkWin();
      break;
    }
  }
});

// ---------------------------------------------------
// 🏆 VERIFICAR SI GANÓ
// ---------------------------------------------------
function checkWin() {
  const allCorrect = pieces.every(p => p.rotation === 0);
  if (allCorrect) {
    gameState = "win";
    showWinScreen();
  }
}

// ---------------------------------------------------
// 🎉 MOSTRAR PANTALLA DE VICTORIA
// ---------------------------------------------------
function showWinScreen() {
  winLevel.textContent = currentLevel;
  winScreen.style.display = "block";
  canvas.style.display = "none";
}
