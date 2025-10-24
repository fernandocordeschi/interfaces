// solo para blocka.html
class Button {
  constructor(x, y, width, height, text, onClick, style = {}) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.onClick = onClick;
    this.style = {
      fillColor: style.fillColor || '#667eea',
      textColor: style.textColor || '#ffffff',
      hoverColor: style.hoverColor || '#5568d3',
      fontSize: style.fontSize || 20,
      ...style
    };
    this.isHovered = false;
  }

  contains(x, y) {
    return x >= this.x && x <= this.x + this.width &&
      y >= this.y && y <= this.y + this.height;
  }

  draw(ctx) {
    ctx.fillStyle = this.isHovered ? this.style.hoverColor : this.style.fillColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = this.style.textColor;
    ctx.font = `bold ${this.style.fontSize}px "Segoe UI"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
  }

  checkHover(x, y) {
    this.isHovered = this.contains(x, y);
  }
}

class BlockaPiece {
  constructor(x, y, size, sourceX, sourceY) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.sourceX = sourceX;
    this.sourceY = sourceY;
    this.rotation = Math.floor(Math.random() * 4) * 90;
    this.correctRotation = 0;
    this.isFixed = false;
  }

  rotate(direction) {
    if (this.isFixed) return;
    if (direction === "left") {
      this.rotation = (this.rotation - 90 + 360) % 360;
    } else {
      this.rotation = (this.rotation + 90) % 360;
    }
  }

  isCorrect() {
    return this.rotation === this.correctRotation;
  }

  contains(x, y) {
    return x >= this.x && x <= this.x + this.size &&
      y >= this.y && y <= this.y + this.size;
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    // Evita que el texto del menú se "mueva" en el primer hover
this.ctx.font = '24px "Segoe UI"';
this.ctx.textAlign = 'center';
this.ctx.textBaseline = 'middle';
    //banco de imagenes
    this.images = [
      "images/simpsons1.jpg",
      "images/simpsons2.jpg",
      "images/simpsons3.jpg",
      "images/simpsons4.jpg",
      "images/simpsons5.jpg",
      "images/simpsons6.jpg"
    ];

    this.currentScreen = 'menu';
    this.currentLevel = 1;
    this.dificultad = 1
    this.gridSize = 2;
    this.pieces = [];
    this.currentImage = null;
    this.timer = 0;
    this.maxTimePerLevel = {
      1: 20,  // Nivel 1: 1 minuto
      2: 40,  // Nivel 2: 1 minuto 30 segundos
      3: 80  // Nivel 3: 2 minutos
    };
    this.maxTimePerDifficulty = {
      1: 10,  // Fácil (4 piezas) → 1 minuto
      2: 30,  // Medio (9 piezas) → 1:30
      3: 50  // Difícil (16 piezas) → 2 minutos
    };
    this.moves = 0;
    this.helpUsed = false;
    this.timerInterval = null;
    this.previewImage = null;  // Imagen completa para vista previa
    this.buttons = [];

    this.gameAreaY = 0;
    this.gameAreaSize = 600;
    this.canvasWidth = 1200;
    this.canvasHeight = 600;
    this.previewThumbnails = [];        // Array de mini imágenes
    this.galleryThumbnails = [];
    this.selectedImageIndex = null;     // Índice de la imagen seleccionada
    this.previewAnimationFrame = 0;     // Contador de frames para animación
    this.previewAnimationDone = false;  // Si la animación terminó
    this.isChoosingImage = false;

    this.setupEventListeners();
    this.createMenuButtons();
    this.render();
  }
  renderPreview() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.previewAnimationDone) {
      // Mostrar thumbnails en fila centrada
      const thumbSize = 140;
      const spacing = 160;
      const totalWidth = this.previewThumbnails.length * thumbSize + (this.previewThumbnails.length - 1) * (spacing - thumbSize);
      const startX = (this.canvas.width - totalWidth) / 2;
      const totalHeight = thumbSize;
      const startY = (this.canvas.height - totalHeight) / 2;


      this.previewThumbnails.forEach((thumb, i) => {
        const x = startX + i * spacing;
        const y = startY;
        this.ctx.globalAlpha = 0.5;
        this.ctx.drawImage(thumb, x, y, thumbSize, thumbSize);
      });

      // Animación del borde rojo
      const animSpeed = 10; // frames por miniatura
      const index = Math.floor(this.previewAnimationFrame / animSpeed) % this.previewThumbnails.length;

      this.ctx.globalAlpha = 1;
      this.ctx.strokeStyle = '#ff0000';
      this.ctx.lineWidth = 4;
      const thumbX = startX + index * spacing;
      const thumbY = startY;
      this.ctx.strokeRect(thumbX, thumbY, thumbSize, thumbSize);

      this.previewAnimationFrame++;
      requestAnimationFrame(() => this.render());
    } else {
      // Mostrar solo la imagen final centrada
      const canvasCenterX = this.canvas.width / 2;
      const canvasCenterY = this.canvas.height / 2;
      const maxWidth = 600;
      const maxHeight = 600;

      const img = this.previewThumbnails[this.selectedImageIndex];
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
      const imgWidth = img.width * scale;
      const imgHeight = img.height * scale;

      const x = canvasCenterX - imgWidth / 2;
      const y = canvasCenterY - imgHeight / 2;

      this.ctx.globalAlpha = 1;
      this.ctx.drawImage(img, x, y, imgWidth, imgHeight);

      // Texto encima
      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = '24px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('IMAGEN A RESOLVER', canvasCenterX, y - 20);
    }

    // Dibujar botones
    this.buttons.forEach(btn => btn.draw(this.ctx));

      if (!this.previewAnimationDone) {
    const opacity = 0.6 + 0.4 * Math.sin(Date.now() / 250);
    this.ctx.font = '24px "Segoe UI"';
    this.ctx.fillStyle = `rgba(230, 57, 70, ${opacity})`; // rojo suave animado
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('🧩 Eligiendo imagen a resolver...', this.canvas.width / 2, this.canvas.height - 60);
  }
  }

  async loadThumbnail(src, size) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.src = src;
    });
  }

  applyFilter(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (this.currentLevel === 1) {
        // Escala de grises
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = data[i + 1] = data[i + 2] = gray;
      }
      else if (this.currentLevel === 2) {
        // Oscuro
        data[i] = r * 0.3;
        data[i + 1] = g * 0.3;
        data[i + 2] = b * 0.3;
      }
      else if (this.currentLevel === 3) {
        // Invertido
        data[i] = 255 - r;
        data[i + 1] = 255 - g;
        data[i + 2] = 255 - b;
      }
    }
    return imageData;
  }
  setupEventListeners() {
    this.canvas.addEventListener('click', (e) => this.handleClick(e, 'left'));
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.handleClick(e, 'right');
    });
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  handleMouseMove(e) {
    const pos = this.getMousePos(e);
    let needsRedraw = false;

    this.buttons.forEach(btn => {
      const wasHovered = btn.isHovered;
      btn.checkHover(pos.x, pos.y);
      if (wasHovered !== btn.isHovered) needsRedraw = true;
    });

    if (needsRedraw) this.render();
  }

  handleClick(e, direction) {
  const pos = this.getMousePos(e);

  if (this.currentScreen === 'game' && direction !== 'menu') {
    const offsetX = 25;
    const boardHeight = this.rows * (this.gameAreaSize / Math.max(this.rows, this.cols));
    const offsetY = (this.canvas.height - boardHeight) / 2; // 🔹 mismo offsetY del render

    // ahora el clic se compara correctamente dentro del tablero
    const piece = this.pieces.find(p =>
      p.contains(pos.x - offsetX, pos.y - offsetY)
    );

    if (piece && !piece.isFixed) {
      piece.rotate(direction);
      this.moves++;
      this.render();

      if (this.checkVictory()) {
        this.handleVictory();
      }
      return;
    }
  }

  this.buttons.forEach(btn => {
    if (btn.contains(pos.x, pos.y)) {
      btn.onClick();
    }
  });
}


  createMenuButtons() {
    this.buttons = [
      new Button(450, 200, 300, 60, '▶️ Jugar', () => this.showLevelSelect()),
      new Button(450, 280, 300, 60, 'ℹ️ Instrucciones', () => this.showInstructions()),
      new Button(450, 360, 300, 60, '🖼️ Galería', () => this.showGallery())
    ];
  }

  createPreviewButtons() {
    this.buttons = [
      new Button(500, 520, 200, 50, 'Comenzar', () => this.beginGame())
    ];
  }

  createLevelSelectButtons() {
    this.buttons = [
      new Button(380, 150, 150, 50, 'Fácil (4 P)', () => this.setDificultad(1),
        {
          fillColor: this.dificultad === 1 ? '#667eea' : '#f0f0f0',
          textColor: this.dificultad === 1 ? '#fff' : '#333'
        }),
      new Button(520, 150, 150, 50, 'Medio (6 P)', () => this.setDificultad(2),
        {
          fillColor: this.dificultad === 2 ? '#667eea' : '#f0f0f0',
          textColor: this.dificultad === 2 ? '#fff' : '#333'
        }),
      new Button(660, 150, 150, 50, 'Difícil (8 P)', () => this.setDificultad(3),
        {
          fillColor: this.dificultad === 3 ? '#667eea' : '#f0f0f0',
          textColor: this.dificultad === 3 ? '#fff' : '#333'
        }),

      new Button(310, 250, 180, 100, 'Nivel 1\nGris', () => this.startLevel(1)),
      new Button(510, 250, 180, 100, 'Nivel 2\nOscuro', () => this.startLevel(2)),
      new Button(710, 250, 180, 100, 'Nivel 3\nInvertido', () => this.startLevel(3)),

      new Button(450, 400, 300, 50, '↩️ Volver', () => this.showMenu(),
        { fillColor: '#f0f0f0', textColor: '#333' })
    ];
  }

  createGameButtons() {
    this.buttons = [
      new Button(700, 520, 200, 50, '💡 Ayuda (+5s)', () => this.useHelp(),
        { fillColor: '#d4a017', textColor: '#333' }),
      new Button(920, 520, 180, 50, '☰ Menú', () => this.showMenu(),
        { fillColor: '#f0f0f0', textColor: '#333' })
    ];
  }

  createVictoryButtons() {
    this.buttons = [
      new Button(700, 520, 180, 50, '➡️ Siguiente', () => this.nextLevel()),
      new Button(900, 520, 180, 50, '☰ Menú', () => this.showMenu(),
        { fillColor: '#f0f0f0', textColor: '#333' })
    ];
  }

  createDefeatButtons() {
    this.buttons = [
      new Button(900, 520, 180, 50, '☰ Menú', () => this.showMenu(),
        { fillColor: '#ff5252', textColor: '#333' })
    ];
  }

  setGridSize(size) {
    this.gridSize = size;
    this.createLevelSelectButtons();
    this.render();
  }
  setDificultad(dificultad) {
    this.dificultad = dificultad;
    this.createLevelSelectButtons();
    this.render();
  }

  showMenu() {
    this.stopTimer();
    this.currentScreen = 'menu';
    this.createMenuButtons();
    this.render();
  }

  showInstructions() {
    this.currentScreen = 'instructions';
    this.buttons = [
      new Button(450, 520, 300, 50, '↩️ Volver', () => this.showMenu(),
        { fillColor: '#f0f0f0', textColor: '#333' })
    ];
    this.render();
  }

  showLevelSelect() {
    this.currentScreen = 'levelSelect';
    this.createLevelSelectButtons();
    this.render();
  }

  async showGallery() {
  this.currentScreen = 'gallery';
  this.buttons = [
    new Button(450, 520, 300, 50, '↩️ Volver', () => this.showMenu(), {
      fillColor: '#f0f0f0',
      textColor: '#333'
    })
  ];

  // 🔹 Precargar las miniaturas solo la primera vez
  if (this.galleryThumbnails.length === 0) {
    this.galleryThumbnails = await Promise.all(
      this.images.map(src => this.loadThumbnail(src, 150))
    );
  }

  this.render();
}


  async startLevel(level) {
    this.currentLevel = level;
    this.moves = 0;
    this.timer = 0;
    this.helpUsed = false;

    // 🔹 Definir cantidad de filas y columnas según nivel
    if (this.dificultad === 1) {
        this.cols = 2;
        this.rows = 2; // 4 piezas
    } else if (this.dificultad === 2) {
        this.cols = 3;
        this.rows = 2; // 6 piezas
    } else if (this.dificultad === 3) {
        this.cols = 4;
        this.rows = 2; // 8 piezas
    }

    // Selección random de imagen
    const randomIndex = Math.floor(Math.random() * this.images.length);
    await this.loadImage(this.images[randomIndex]);

    // Guardamos la imagen en preview
    this.previewImage = this.currentImage;
    this.selectedImageIndex = randomIndex;

    // Crear thumbnails
    this.previewThumbnails = await Promise.all(this.images.map(src => this.loadThumbnail(src, 100)));

    // Cambiamos pantalla y reiniciamos animación
    this.currentScreen = 'preview';
    this.buttons = [];
    this.previewAnimationFrame = 0;
    this.previewAnimationDone = false;

    this.render();

    // Elegir imagen final después de tiempo aleatorio
    const randomTime = 1000 + Math.random() * 4000; // 1000 a 5000 ms
    setTimeout(() => {
      this.previewAnimationDone = true;
      this.createPreviewButtons();
      this.render();
    }, randomTime);
  }
  beginGame() {
    this.currentScreen = 'game';
    this.currentImage = this.previewImage;
    this.createPieces();
    this.createGameButtons();
    this.startTimer();
    this.render();
  }

  async loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.currentImage = img;
        this.createPieces();
        resolve();
      };
      img.src = src;
    });
  }

 createPieces() {
    // 🔹 Limpia el array de piezas
    this.pieces = [];

    // 🔹 Usa el lado más grande (entre columnas y filas)
    const mayorDimension = Math.max(this.rows, this.cols);

    // 🔹 Tamaño base (lado del canvas que querés usar, por ejemplo 600)
    const tamañoPiezaBase = this.gameAreaSize / mayorDimension;

    // 🔹 Calcula dimensiones reales del tablero
    const boardWidth = this.cols * tamañoPiezaBase;
    const boardHeight = this.rows * tamañoPiezaBase;

    // 🔹 (Opcional) guardarlas si las usás luego en renderGame
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;

    // 🔹 Calcula relación de aspecto imagen vs tablero
    const relacionImagen = this.currentImage.width / this.currentImage.height;
    const relacionTablero = this.cols / this.rows;

    // 🔹 Área de imagen a usar (por si hay que recortar)
    let anchoImagenUsada = this.currentImage.width;
    let altoImagenUsada = this.currentImage.height;
    let offsetX = 0;
    let offsetY = 0;

    if (relacionImagen < relacionTablero) {
        // Imagen más "vertical" → recortamos arriba/abajo
        altoImagenUsada = this.currentImage.width / relacionTablero;
        offsetY = (this.currentImage.height - altoImagenUsada) / 2;
    } else if (relacionImagen > relacionTablero) {
        // Imagen más "horizontal" → recortamos izquierda/derecha
        anchoImagenUsada = this.currentImage.height * relacionTablero;
        offsetX = (this.currentImage.width - anchoImagenUsada) / 2;
    }

    // 🔹 Dimensiones del recorte de origen (imagen)
    const anchoOrigen = anchoImagenUsada / this.cols;
    const altoOrigen = altoImagenUsada / this.rows;

    // 🔹 Dimensiones de destino (canvas)
    const tamañoDestino = tamañoPiezaBase;

    // 🔹 Crear cada pieza
    for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
            const pieza = new BlockaPiece(
                col * tamañoDestino,       // X destino (en canvas)
                row * tamañoDestino,       // Y destino (en canvas)
                tamañoDestino,             // tamaño de pieza cuadrada
                offsetX + col * anchoOrigen, // X origen (imagen)
                offsetY + row * altoOrigen   // Y origen (imagen)
            );

            this.pieces.push(pieza);
        }
    }
}

  checkVictory() {
    return this.pieces.every(p => p.isCorrect());
  }

  handleVictory() {
    this.stopTimer();
    this.currentScreen = 'victory';
    this.createVictoryButtons();
    this.render();
  }

  useHelp() {
    if (this.helpUsed) return;

    const incorrect = this.pieces.filter(p => !p.isCorrect() && !p.isFixed);
    if (incorrect.length === 0) return;

    const piece = incorrect[Math.floor(Math.random() * incorrect.length)];
    piece.rotation = piece.correctRotation;
    piece.isFixed = true;

    this.timer += 5;
    this.helpUsed = true;
    this.render();

    if (this.checkVictory()) {
      this.handleVictory();
    }
  }

  startTimer() {
    const maxTime = this.maxTimePerDifficulty[this.dificultad] || 120;
    this.timerInterval = setInterval(() => {
      this.timer++;

      if (this.timer >= maxTime) {
        this.stopTimer();
        this.currentScreen = 'defeat';
        this.createDefeatButtons();
        this.render();
        return;
      }

      this.render();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  nextLevel() {
    if (this.currentLevel < 3) {
      this.startLevel(this.currentLevel + 1);
    } else {
      this.showMenu();
    }
  }

  render() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    switch (this.currentScreen) {
      case 'menu':
        this.renderMenu();
        break;
      case 'instructions':
        this.renderInstructions();
        break;
      case 'levelSelect':
        this.renderLevelSelect();
        break;
      case 'preview':
        this.renderPreview();
        break;
      case 'game':
        this.renderGame();
        break;
      case 'victory':
        this.renderVictory();
        break;
      case 'defeat':
        this.renderDefeat();
        break;
      case 'gallery':
        this.renderGallery();
        break;
    }

    this.buttons.forEach(btn => btn.draw(this.ctx));
  }

  renderMenu() {
    this.ctx.fillStyle = '#667eea';
    this.ctx.font = 'bold 48px "Segoe UI"';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
  this.ctx.fillText('🎮 BLOCKA', 600, 80);

    this.ctx.font = '24px "Segoe UI"';
    this.ctx.fillStyle = '#666';
    this.ctx.fillText('Rota las piezas y descubre la imagen', 600, 140);
  }

  renderInstructions() {
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 32px "Segoe UI"';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ℹ️ Instrucciones', 600, 50);

    this.ctx.font = '16px "Segoe UI"';
    this.ctx.textAlign = 'left';
    const instructions = [
      '🎯 OBJETIVO:',
      'Rota todas las piezas hasta su posición correcta',
      '',
      '🕹️ CONTROLES:',
      '• 🖱️ Click Izquierdo: Rotar antihorario',
      '• 🖱️ Click Derecho: Rotar horario',
      '',
      '🎚️ NIVELES:',
      '• 🩶 Nivel 1: Escala de grises',
      '• 🌙 Nivel 2: Bajo brillo',
      '• 🎨 Nivel 3: Colores invertidos',
      '',
      '⭐ CARACTERÍSTICAS:',
      '• ⏱️ Temporizador para medir tu tiempo',
      '• 🆘 Botón de ayuda (+5 segundos)',
      '• 🔢 Elige dificultad: 4, 6 u 8 piezas'
    ];

    instructions.forEach((line, i) => {
      this.ctx.fillText(line, 350, 100 + i * 27);
    });
  }

  renderLevelSelect() {
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 32px "Segoe UI"';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🎚️ Selecciona un Nivel', 580, 60);

    this.ctx.font = '20px "Segoe UI"';
    this.ctx.fillText('⚡ Dificultad:', 570, 120);
  }

  renderGame() {
    // Panel de información a la derecha
    const infoX = 650;
    const infoStartY = 50;

    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 24px "Segoe UI"';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`⭐ Nivel ${this.currentLevel}`, infoX, infoStartY);
    const maxTime = this.maxTimePerDifficulty[this.dificultad] || 120;
    this.ctx.fillText(`⏱ Tiempo: ${this.formatTime(this.timer)} / ${this.formatTime(maxTime)}`, infoX, infoStartY + 50);
    this.ctx.fillText(`🔄 Movimientos: ${this.moves}`, infoX, infoStartY + 100);

    // Área del juego a la izquierda
    const offsetX = 25;
    const boardHeight = this.rows * (this.gameAreaSize / Math.max(this.rows, this.cols));
    const offsetY = (this.canvas.height - boardHeight) / 2;

    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);

    this.pieces.forEach(piece => {
      this.ctx.save();

      const centerX = piece.x + piece.size / 2;
      const centerY = piece.y + piece.size / 2;

      this.ctx.translate(centerX, centerY);
      this.ctx.rotate((piece.rotation * Math.PI) / 180);

      // if (!this.checkVictory() && this.filters[this.currentLevel]) {
      //     this.filters[this.currentLevel](this.ctx);
      // }

      // Crear un canvas temporal para la pieza
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = piece.size;
      tempCanvas.height = piece.size;

      // Dibujar la porción original
      tempCtx.drawImage(
        this.currentImage,
        piece.sourceX, piece.sourceY,
        piece.size * (this.currentImage.width / this.gameAreaSize),
        piece.size * (this.currentImage.height / this.gameAreaSize),
        0, 0,
        piece.size, piece.size
      );

      // Aplicar filtro
      let imageData = tempCtx.getImageData(0, 0, piece.size, piece.size);
      imageData = this.applyFilter(imageData);
      tempCtx.putImageData(imageData, 0, 0);

      // Dibujar la pieza filtrada rotada
      this.ctx.drawImage(tempCanvas, -piece.size / 2, -piece.size / 2, piece.size, piece.size);

      this.ctx.restore();

      this.ctx.strokeStyle = piece.isFixed ? '#4CAF50' : '#ddd';
      this.ctx.lineWidth = piece.isFixed ? 4 : 2;
      this.ctx.strokeRect(piece.x, piece.y, piece.size, piece.size);
    });

    this.ctx.restore();
  }

  renderVictory() {
    this.ctx.fillStyle = '#667eea';
    this.ctx.font = 'bold 40px "Segoe UI"';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('¡Nivel Completado! 🎉', 900, 80);

    const size = 550;
    const x = 25;
    const y = 25;

    this.ctx.drawImage(this.currentImage, x, y, size, size);

    this.ctx.fillStyle = '#333';
    this.ctx.font = '24px "Segoe UI"';
    this.ctx.fillText(`Tiempo: ${this.formatTime(this.timer)}`, 900, 200);
    this.ctx.fillText(`Movimientos: ${this.moves}`, 900, 250);
    if (this.helpUsed) {
      this.ctx.fillText('Ayuda usada: Sí (+5 segundos)', 900, 300);
    }
  }
  renderDefeat() {
    this.ctx.fillStyle = '#ff5252';
    this.ctx.font = 'bold 40px "Segoe UI"';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('¡Tiempo Agotado! ⏰', 900, 80);

    const size = 550;
    const x = 25;
    const y = 25;

    // Mostrar la imagen para que el jugador vea qué iba a resolver
    this.ctx.drawImage(this.currentImage, x, y, size, size);

    this.ctx.fillStyle = '#333';
    this.ctx.font = '24px "Segoe UI"';
    this.ctx.fillText(`Movimientos: ${this.moves}`, 900, 200);

    this.buttons.forEach(btn => btn.draw(this.ctx));
  }

  renderGallery() {
  this.ctx.fillStyle = '#333';
  this.ctx.font = 'bold 32px "Segoe UI"';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('Galería de Imágenes', 600, 60);

  this.ctx.font = '18px "Segoe UI"';
  this.ctx.fillStyle = '#666';
  this.ctx.fillText('Estas son las imágenes que encontrarás en el juego', 600, 100);

  const thumbSize = 150;
  const padding = 20;
  const cols = 3;
  const totalRowWidth = cols * thumbSize + (cols - 1) * padding;
  const startX = (this.canvas.width - totalRowWidth) / 2;

  // 🔹 Usar las imágenes precargadas
  this.galleryThumbnails.forEach((img, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (thumbSize + padding);
    const y = 150 + row * (thumbSize + padding);
    this.ctx.drawImage(img, x, y, thumbSize, thumbSize);
  });
}
}
const game = new Game();
