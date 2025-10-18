// ===================================================
// 🧩 BLOCKA - Juego de Rompecabezas (Canvas Puro)
// ===================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = "menu"; // "menu", "playing", "win"
let currentLevel = 1;
let maxLevels = 3;
let timer = 0;
let timerInterval;
let pieces = [];
let image = new Image();
let imageLoaded = false;

// ===================================================
// 🎨 UTILIDADES
// ===================================================
function drawText(text, x, y, size = 30, color = "#fff", align = "center") {
  ctx.fillStyle = color;
  ctx.font = `${size}px Arial`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function clearCanvas() {
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ===================================================
// 🕹️ ESTADOS DEL JUEGO
// ===================================================
function drawMenu() {
  clearCanvas();
  drawText("🎮 BLOCKA", canvas.width / 2, 150, 60, "#ffcc00");
  drawText("Haz clic para comenzar", canvas.width / 2, 300, 30, "#fff");

  drawText("Instrucciones:", canvas.width / 2, 400, 24, "#aaa");
  drawText("🖱️ Izquierdo: Gira a la izquierda", canvas.width / 2, 440, 20, "#aaa");
  drawText("🖱️ Derecho: Gira a la derecha", canvas.width / 2, 470, 20, "#aaa");
}

function drawGame() {
  clearCanvas();

  // Dibuja timer y nivel
  drawText(`Nivel ${currentLevel}/${maxLevels}`, 100, 50, 24, "#ffcc00", "left");
  drawText(`⏱️ ${timer}s`, canvas.width - 100, 50, 24, "#ffcc00", "right");

  if (!imageLoaded) return;

  // Dibuja piezas
  for (let piece of pieces) {
    ctx.save();
    ctx.translate(piece.x + piece.w / 2, piece.y + piece.h / 2);
    ctx.rotate(piece.rotation * Math.PI / 180);
    ctx.drawImage(
      image,
      piece.sx, piece.sy, piece.sw, piece.sh,
      -piece.w / 2, -piece.h / 2, piece.w, piece.h
    );
    ctx.restore();

    // borde tenue
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(piece.x, piece.y, piece.w, piece.h);
  }
}

function drawWinScreen() {
  clearCanvas();
  drawText("🎉 ¡Nivel completado!", canvas.width / 2, 250, 50, "#00ff88");
  drawText(`Tiempo: ${timer}s`, canvas.width / 2, 320, 30, "#fff");
  drawText("Haz clic para continuar", canvas.width / 2, 400, 24, "#aaa");
}

// ===================================================
// 🧩 FUNCIONES DE JUEGO
// ===================================================
function startLevel(level) {
  gameState = "playing";
  timer = 0;
  imageLoaded = false; // reinicia bandera

  // Selecciona imagen aleatoria
  const imgs = [
    "images/simpsons1.jpg",
    "images/simpsons2.jpg",
    "images/simpsons3.jpg",
    "images/simpsons4.jpg",
    "images/simpsons5.jpg"
  ];
  const randomSrc = imgs[Math.floor(Math.random() * imgs.length)];

  // Crea nueva instancia para evitar caché/reutilización
  image = new Image();
  image.src = randomSrc;

  image.onload = () => {
    imageLoaded = true;
    setupPieces();
    startTimer();
    // no es necesario llamar a render(), ya que ya corre en loop
  };
}


function setupPieces() {
  pieces = [];
  const rows = 2, cols = 2;
  const pieceW = canvas.width / cols;
  const pieceH = canvas.height / rows;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      pieces.push({
        x: j * pieceW,
        y: i * pieceH,
        w: pieceW,
        h: pieceH,
        sx: j * (image.width / cols),
        sy: i * (image.height / rows),
        sw: image.width / cols,
        sh: image.height / rows,
        rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)]
      });
    }
  }
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer++;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function checkWin() {
  return pieces.every(p => p.rotation % 360 === 0);
}

// ===================================================
// 🖱️ EVENTOS
// ===================================================
canvas.addEventListener("click", (e) => {
  if (gameState === "menu") {
    startLevel(currentLevel);
  } else if (gameState === "playing") {
    const { offsetX, offsetY } = e;
    for (let piece of pieces) {
      if (
        offsetX > piece.x && offsetX < piece.x + piece.w &&
        offsetY > piece.y && offsetY < piece.y + piece.h
      ) {
        piece.rotation -= 90;
        if (checkWin()) {
          stopTimer();
          gameState = "win";
        }
        break;
      }
    }
  } else if (gameState === "win") {
    currentLevel++;
    if (currentLevel > maxLevels) currentLevel = 1;
    startLevel(currentLevel);
  }
});

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  if (gameState !== "playing") return;

  const { offsetX, offsetY } = e;
  for (let piece of pieces) {
    if (
      offsetX > piece.x && offsetX < piece.x + piece.w &&
      offsetY > piece.y && offsetY < piece.y + piece.h
    ) {
      piece.rotation += 90;
      if (checkWin()) {
        stopTimer();
        gameState = "win";
      }
      break;
    }
  }
});

// ===================================================
// 🔁 LOOP PRINCIPAL
// ===================================================
function render() {
  if (gameState === "menu") drawMenu();
  else if (gameState === "playing") drawGame();
  else if (gameState === "win") drawWinScreen();

  requestAnimationFrame(render);
}

render();
