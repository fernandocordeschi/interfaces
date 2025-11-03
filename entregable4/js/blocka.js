// solo para blocka.html

//representa un botón gráfico con posición, tamaño, texto, colores y comportamiento al hacer clic
class Button {
  constructor(x, y, width, height, text, onClick, style = {}) {
    this.x = x; //posicion (coordenada x) del boton
    this.y = y; //posicion (coordenada y) del boton
    this.width = width;
    this.height = height;
    this.text = text; //texto que se muestra en el boton
    this.onClick = onClick; //funcion que se ejecuta al hacer clic en el boton
    this.style = {
      fillColor: style.fillColor || '#667eea',
      textColor: style.textColor || '#ffffff',
      hoverColor: style.hoverColor || '#5568d3',
      fontSize: style.fontSize || 20,
      ...style
    };
    this.isHovered = false; //indica si el cursor esta sobre el boton
  }


  //Verifica si un punto (x, y) está dentro del área del botón.
  // Devuelve true si el mouse o un clic están dentro del rectángulo del botón.
  contains(x, y) {
    return x >= this.x && x <= this.x + this.width &&
      y >= this.y && y <= this.y + this.height;
  }

  //dibuja el boton en el contexto de canvas proporcionado (ctx)
  draw(ctx) {
    ctx.fillStyle = this.isHovered ? this.style.hoverColor : this.style.fillColor; //Si el mouse está encima (isHovered === true), usa hoverColor. si no fillColor
    ctx.fillRect(this.x, this.y, this.width, this.height); //Dibuja el rectángulo del botón

    ctx.fillStyle = this.style.textColor;
    ctx.font = `bold ${this.style.fontSize}px "Segoe UI"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
  }

  //Actualiza el estado isHovered:
  // Llama a contains(x, y) con las coordenadas del mouse.
  // Si el mouse está dentro del botón, isHovered = true; si no, false.

  checkHover(x, y) {
    this.isHovered = this.contains(x, y);
  }
}



//representa una pieza cuadrada de un rompecabezas o bloque de juego que puede rotarse, 
// comprobar si está correctamente orientada y detectar clics o posiciones del mouse dentro de su área.
class BlockaPiece { //Cada instancia representa una pieza del juego
  constructor(x, y, size, sourceX, sourceY) {
    this.x = x; //posición x donde se dibujará la pieza en el canvas.
    this.y = y; //posición y donde se dibujará la pieza en el canvas.
    this.size = size; // tamaño (ancho y alto) de la pieza cuadrada.
    this.sourceX = sourceX; //coordenada x de la porción de la imagen original que corresponde a esta pieza.
    this.sourceY = sourceY; //coordenada y de la porción de la imagen original que corresponde a esta pieza.
    this.rotation = Math.floor(Math.random() * 4) * 90; //rotación inicial aleatoria (0, 90, 180 o 270 grados).
    this.correctRotation = 0;  //rotación correcta (la que debería tener cuando está bien orientada).
    this.isFixed = false; //Indica si la pieza está fijada (ya colocada correctamente y no puede girarse más).
  }

  rotate(direction) {
    if (this.isFixed) return; //Si la pieza está fijada (isFixed === true), no hace nada (se sale del método).
    if (direction === "left") { //Si direction es "left" → rota 90° hacia la izquierda (resta 90).
      this.rotation = (this.rotation - 90 + 360) % 360; // % 360 asegura que la rotación siempre se mantenga entre 0° y 359°.
    } else { //+360 evita números negativos antes del módulo
      this.rotation = (this.rotation + 90) % 360; //Si no, rota 90° hacia la derecha (suma 90).
    }
  }

  isCorrect() { //
    return this.rotation === this.correctRotation; //Devuelve true si la pieza está en la rotación correcta,
    // es decir, si rotation coincide con correctRotation
  }

  contains(x, y) { //Verifica si un punto (x, y) está dentro del área cuadrada de la pieza.
    return x >= this.x && x <= this.x + this.size &&
      y >= this.y && y <= this.y + this.size;
  } //Usado para detectar clics o selección con el mouse.
}

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas'); //Obtiene el elemento <canvas> donde se dibuja todo,
    this.ctx = this.canvas.getContext('2d'); // y su contexto 2D para poder dibujar rectángulos, texto, imágenes, etc.
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

    this.currentScreen = 'menu'; //// Pantalla actual: menu, game, victory, etc.
    this.currentLevel = 1; // Nivel de dificultad visual (gris, oscuro, invertido)
    this.dificultad = 1 // Cantidad de piezas
    this.gridSize = 2; // Cantidad de divisiones base
    this.pieces = []; // Piezas del rompecabezas
    this.currentImage = null; // Imagen actual seleccionada
    this.timer = 0;  // Contador de tiempo
    this.maxTimePerLevel = {
      1: 20,  // Nivel 1: 20s
      2: 40,  // Nivel 2: 40s
      3: 80  // Nivel 3: 80s
    };
    this.maxTimePerDifficulty = {
      1: 10,  // Fácil (4 piezas) → 10s
      2: 30,  // Medio (9 piezas) → 30s
      3: 50  // Difícil (16 piezas) → 50s
    };
    this.moves = 0; //cantidad de movimientos
    this.helpUsed = false; // Si se usó ayuda
    this.timerInterval = null;
    this.previewImage = null;  // Imagen completa para vista previa
    this.buttons = [];

    this.gameAreaY = 0;

    //Configuración del área de juego
    this.gameAreaSize = 600;
    this.canvasWidth = 1200;
    this.canvasHeight = 600;
    //Define el tamaño del área donde se renderizan las piezas.

    //Control de miniaturas y animación
    // Se usan en la pantalla previa, cuando se elige o muestra la imagen antes de jugar.
    this.previewThumbnails = [];        // Array de mini imágenes
    this.galleryThumbnails = [];
    this.selectedImageIndex = null;     // Índice de la imagen seleccionada
    this.previewAnimationFrame = 0;     // Contador de frames para animación
    this.previewAnimationDone = false;  // Si la animación terminó
    this.isChoosingImage = false;

    // Se configuran los eventos del mouse, se crean los primeros botones del menú principal, y se dibuja la primera pantalla.
    this.setupEventListeners(); //registra clics, clic derecho y movimiento del mouse.
    this.createMenuButtons();
    this.render();
  }
  
  renderPreview() {
    this.ctx.fillStyle = '#ffffff'; //Antes de dibujar nada, borra toda la pantalla llenándola con blanco.
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); //Esto evita que queden restos del dibujo anterior.

    if (!this.previewAnimationDone) { //Si la animación de miniaturas aún está en curso, se dibuja una fila animada de imágenes pequeñas.
      // Mostrar thumbnails en fila centrada
      const thumbSize = 140; //tamaño de cada miniatura (140x140 px).
      const spacing = 160; //separación entre una y otra (160 px).
      const totalWidth = this.previewThumbnails.length * thumbSize + (this.previewThumbnails.length - 1) * (spacing - thumbSize); //ancho total de la fila completa.
      const startX = (this.canvas.width - totalWidth) / 2; //punto donde debe comenzar la primera miniatura para que quede centrada en el canvas.
      const totalHeight = thumbSize;
      const startY = (this.canvas.height - totalHeight) / 2; //punto vertical centrado.


      this.previewThumbnails.forEach((thumb, i) => {
        const x = startX + i * spacing; //Cada una se dibuja en posición x desplazada según el índice i.
        const y = startY;
        this.ctx.globalAlpha = 0.5; //globalAlpha = 0.5 → las hace semitransparentes, como fondo.
        this.ctx.drawImage(thumb, x, y, thumbSize, thumbSize);
      });

      // Animación del borde rojo
      const animSpeed = 10; // frames por miniatura, Cada 10 cuadros (animSpeed = 10), el borde rojo pasa a la siguiente imagen.
      const index = Math.floor(this.previewAnimationFrame / animSpeed) % this.previewThumbnails.length;
      //Usa this.previewAnimationFrame (contador de frames) para saber cuál miniatura destacar en cada momento.

      this.ctx.globalAlpha = 1; //le devuelve la opacidad
      this.ctx.strokeStyle = '#ff0000'; //Dibuja un borde rojo grueso (4 px) alrededor de la miniatura actualmente seleccionada.
      this.ctx.lineWidth = 4;
      const thumbX = startX + index * spacing;
      const thumbY = startY;
      this.ctx.strokeRect(thumbX, thumbY, thumbSize, thumbSize);

      this.previewAnimationFrame++; //avanza la animacion y redibuja
      requestAnimationFrame(() => this.render()); //Incrementa el contador de frames y vuelve a llamar a this.render() para actualizar la animación en el siguiente frame
    } else { //Si la animación ya terminó (else)
      // Mostrar solo la imagen final centrada
      //la animación terminó, se muestra solo la imagen elegida centrada en el canvas.
      const canvasCenterX = this.canvas.width / 2; //Calcula x e y para colocarla exactamente centrada.
      const canvasCenterY = this.canvas.height / 2; //Calcula x e y para colocarla exactamente centrada.
      const maxWidth = 600; //Escala la imagen para que no supere 600x600 px.
      const maxHeight = 600;

      const img = this.previewThumbnails[this.selectedImageIndex];
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
      const imgWidth = img.width * scale;
      const imgHeight = img.height * scale;

      const x = canvasCenterX - imgWidth / 2;
      const y = canvasCenterY - imgHeight / 2;

      this.ctx.globalAlpha = 1;
      this.ctx.drawImage(img, x, y, imgWidth, imgHeight); //Muestra la imagen elegida, con opacidad completa.

      // Texto encima
      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = '24px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('IMAGEN A RESOLVER', canvasCenterX, y - 20);
    }

    // Dibujar botones
    this.buttons.forEach(btn => btn.draw(this.ctx)); //Llama al método draw() de cada botón (de la clase Button) para pintarlos en pantalla: “Volver”, “Jugar”, etc.

    if (!this.previewAnimationDone) {
      const opacity = 0.6 + 0.4 * Math.sin(Date.now() / 250);
      this.ctx.font = '24px "Segoe UI"';
      this.ctx.fillStyle = `rgba(230, 57, 70, ${opacity})`; // rojo suave animado
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText('🧩 Eligiendo imagen a resolver...', this.canvas.width / 2, this.canvas.height - 60);
    }
    //Si la animación todavía no terminó, se muestra un texto parpadeante en rojo suave.
    //La opacidad cambia con un efecto de onda senoidal → Math.sin(Date.now() / 250) produce un parpadeo suave.
  }

  async loadThumbnail(src, size) { //se encarga de cargar imágenes en memoria (miniaturas o “thumbnails”) de forma asíncrona, antes de mostrarlas en pantalla.
    return new Promise((resolve) => { //Crea una nueva promesa, que se resolverá (resolve) cuando la imagen haya terminado de cargarse.
      const img = new Image();
      img.crossOrigin = 'anonymous'; //Indica que se permite cargar imágenes de otros dominios (externas) sin credenciales, si vienen de un servidor o carpeta dif las imagenes
      img.onload = () => resolve(img); //Cuando la imagen termina de cargar correctamente, se ejecuta esta función y resuelve la promesa, devolviendo la imagen (img).
      //A partir de ahí, el programa sabe que ya puede usarla (por ejemplo, para dibujarla con drawImage()).
      img.src = src;
    });
  }


  //modificar los colores de una imagen directamente a nivel de píxeles, aplicando un filtro visual distinto según el nivel de dificultad del juego.
  applyFilter(imageData) { //imageData es un objeto del tipo ImageData que contiene toda la información de una imagen ya dibujada o cargada en el canvas.
    const data = imageData.data; //array de números (Uint8ClampedArray) con los valores de color de cada píxel, en este orden: R, G, B, A (rojo, verde, azul, alfa).
    //se obtiene una referencia directa al array donde están los valores RGBA de todos los píxeles
    for (let i = 0; i < data.length; i += 4) { //Se recorre el array de a 4 en 4 pasos, porque cada píxel tiene 4 valores (R, G, B, A).
      //De esa forma, i siempre apunta al comienzo de un píxel.
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      //Se extraen los componentes rojo, verde y azul del píxel actual.
      // El alfa (data[i + 3]) no se toca, porque normalmente se deja la transparencia igual. 

      if (this.currentLevel === 1) {
        // Escala de grises
        //Convierte el píxel a blanco y negro (gris) usando una fórmula estándar que pondera cada color según cómo lo percibe el ojo humano:
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = data[i + 1] = data[i + 2] = gray;
      }
      else if (this.currentLevel === 2) {
        // Oscuro
        data[i] = r * 0.3;
        data[i + 1] = g * 0.3;
        data[i + 2] = b * 0.3;
        //Multiplica cada color por 0.3, reduciendo su brillo al 30% del original.
        // La imagen se ve más oscura, lo que aumenta la dificultad.
      }
      else if (this.currentLevel === 3) {
        // Invertido
        data[i] = 255 - r;
        data[i + 1] = 255 - g;
        data[i + 2] = 255 - b;
        //Invierte cada componente de color.
      }
    }
    return imageData; //Devuelve el objeto ImageData ya alterado, listo para volver a dibujarlo en el canvas con ctx.putImageData(imageData, x, y);
  }

  setupEventListeners() {
    this.canvas.addEventListener('click', (e) => this.handleClick(e, 'left')); //escucha los clics normales (izquierdos) sobre el canvas y llama a this.handleClick(e, 'left')
    this.canvas.addEventListener('contextmenu', (e) => { //detecta el clic derecho del mouse (evento contextmenu)
      e.preventDefault(); //bloquea ese evento que abriría el menú contextual del navegador (copiar, pegar, etc.
      this.handleClick(e, 'right');
    });
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e)); //escucha cuando el mouse se mueve dentro del canvas y llama al metodo handlemousemove
    //Detecta si el cursor está sobre un botón.
    // Cambia su estado visual (isHovered = true o false).
    // Provoca que el botón cambie de color o tono, simulando el efecto “hover”.
  }

  getMousePos(e) { //convertir las coordenadas del mouse (en toda la ventana) a coordenadas dentro del canvas.
    const rect = this.canvas.getBoundingClientRect(); //devuelve un objeto con las dimensiones y la posición del elemento <canvas> respecto a la ventana del navegador.
    return {
      x: e.clientX - rect.left, //son las coordenadas del mouse en la ventana.
      y: e.clientY - rect.top //Restando rect.left y rect.top, se obtiene la posición relativa al canvas..
    };//Retorna un objeto con las coordenadas ya ajustadas,
  }

  handleMouseMove(e) { //controla lo que ocurre cuando el jugador mueve el mouse sobre el canvas.
    const pos = this.getMousePos(e); //traducir la posición del mouse desde las coordenadas de pantalla
    let needsRedraw = false; //para saber si hubo algún cambio visual que requiere volver a renderizar el canvas.

    this.buttons.forEach(btn => {
      const wasHovered = btn.isHovered; //Guarda el estado anterior del botón (si el mouse estaba encima o no).
      btn.checkHover(pos.x, pos.y); //Llama al método del botón que comprueba si el mouse está dentro de su área:
      if (wasHovered !== btn.isHovered) needsRedraw = true; //hay que volver a dibujar el canvas, porque el botón debe cambiar de color.
    });

    if (needsRedraw) this.render(); //Si se detectó al menos un cambio de estado de hover,
    // se llama a this.render(), que redibuja toda la escena:
  }



  //interpretar qué fue clickeado (una pieza del puzzle o un botón) y actuar en consecuencia (rotar piezas, contar movimientos, o ejecutar acciones de botones)
  handleClick(e, direction) {
    const pos = this.getMousePos(e); //convertir las coordenadas globales del clic (e.clientX, e.clientY) a coordenadas dentro del canvas.

    if (this.currentScreen === 'game' && direction !== 'menu') { //solo se ejecuta si el jugador está en la pantalla de juego
      const offsetX = 25; //el tablero está desplazado 25 px hacia la derecha.
      const boardHeight = this.rows * (this.gameAreaSize / Math.max(this.rows, this.cols)); //calcula la altura total del tablero según el número de filas y el tamaño asignado a cada pieza.
      const offsetY = (this.canvas.height - boardHeight) / 2; // 🔹 mismo offsetY del render,  centra verticalmente el tablero dentro del canvas, igual que en el método render()

      // ahora el clic se compara correctamente dentro del tablero
      const piece = this.pieces.find(p => //this.pieces es el array de todas las piezas del puzzle.
        p.contains(pos.x - offsetX, pos.y - offsetY) //true si el punto (clic) está dentro del área de la pieza.
      );

      if (piece && !piece.isFixed) { //clickeó una pieza que no está fija (isFixed = false)
        piece.rotate(direction); //la gira
        this.moves++; //aumenta el contador
        this.render(); //para mostrar la pieza rotada

        if (this.checkVictory()) { //Si todas las piezas están en su orientación correcta, se ejecuta la secuencia de victoria.
          this.handleVictory();
        }
        return; //Si todas las piezas están en su orientación correcta, se ejecuta la secuencia de victoria.
      }
    }

    this.buttons.forEach(btn => { //Si no fue una pieza → comprobar botones , se revisa cada botón de la pantalla actual.
      if (btn.contains(pos.x, pos.y)) { // determina si el clic ocurrió dentro del área del botón.
        btn.onClick(); //Si es así, ejecuta su acción:
      }
    });
  }


  createMenuButtons() {
    this.buttons = [
      new Button(450, 200, 300, 60, '▶️ Jugar', () => this.showLevelSelect()), //Cada botón se posiciona con (x, y, width, height)
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

  async showGallery() { //mostrar la pantalla de galería de imágenes dentro del juego.
    this.currentScreen = 'gallery';
    this.buttons = [
      new Button(450, 520, 300, 50, '↩️ Volver', () => this.showMenu(), {
        fillColor: '#f0f0f0',
        textColor: '#333'
      })
    ];

    // 🔹 Precargar las miniaturas solo la primera vez
    // Solo carga las imágenes la primera vez que se entra a la galería.
// Así evita descargar o procesar las mismas imágenes cada vez que el jugador vuelve a esta pantalla.
    if (this.galleryThumbnails.length === 0) {
      this.galleryThumbnails = await Promise.all(
        this.images.map(src => this.loadThumbnail(src, 150)) //.map(...) aplica la función loadThumbnail a cada imagen (que carga la imagen y la devuelve como objeto Image
      );
    }

    this.render(); //redibuja el canvas mostrando la galería y el botón “Volver”.
  }


  async startLevel(level) {
    this.currentLevel = level; // guarda qué nivel visual (1, 2 o 3) eligió el jugador.
    this.moves = 0;
    this.timer = 0;
    this.helpUsed = false;

    // 🔹 Definir cantidad de filas y columnas según la dificultad
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
    // Esto determina el tamaño y cantidad de bloques a mostrar.

    // Selección random de imagen
    const randomIndex = Math.floor(Math.random() * this.images.length);
    await this.loadImage(this.images[randomIndex]); //para cargarla completamente antes de continuar.

    // Guardamos la imagen en preview
    this.previewImage = this.currentImage; //Se guarda la imagen seleccionada para usarla luego en la pantalla de previsualización (“Imagen a resolver”).
    this.selectedImageIndex = randomIndex;

    // Crear thumbnails
    this.previewThumbnails = await Promise.all(this.images.map(src => this.loadThumbnail(src, 100))); //Carga todas las imágenes como miniaturas para mostrarlas en la seleccion

    // Cambiamos pantalla y reiniciamos animación
    this.currentScreen = 'preview';
    this.buttons = [];
    this.previewAnimationFrame = 0;
    this.previewAnimationDone = false;

    this.render();

    // Elegir imagen final después de tiempo aleatorio
    const randomTime = 1000 + Math.random() * 4000; // 1000 a 5000 ms
    setTimeout(() => {
      this.previewAnimationDone = true; //se detiene la animación.
      this.createPreviewButtons(); //agrega el boton Comenzar
      this.render();
    }, randomTime);
  }

  beginGame() { //inicia realmente la partida después de la pantalla de previsualización
    this.currentScreen = 'game';
    this.currentImage = this.previewImage; //Copia la imagen que se había elegido durante la animación previa (previewImage) para usarla como imagen base del puzzle.
    this.createPieces(); //dividir la imagen en piezas, Cada pieza se almacena como un objeto (por ejemplo, instancias de BlockaPiece), con su posición, rotación aleatoria y coordenadas dentro de la imagen original.
    this.createGameButtons(); //configura los botones específicos de la pantalla de juego (Ayuda, Menú).
    this.startTimer();
    this.render();
  }

  async loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.currentImage = img;
        this.createPieces(); //método que corta la imagen en bloques (instancias de BlockaPiece)
        resolve();
      };
      img.src = src;
    });
  }

  createPieces() {
    // 🔹 Limpia el array de piezas
    this.pieces = []; //Así, si el jugador reinicia o cambia de nivel, no se mezclan las piezas viejas con las nuevas.

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

    // 🔹 Dimensiones del recorte de origen (imagen) tamaño de cada pedazo de la imagen original (zona que se recorta).
    const anchoOrigen = anchoImagenUsada / this.cols; 
    const altoOrigen = altoImagenUsada / this.rows;

    // 🔹 Dimensiones de destino (canvas)
    const tamañoDestino = tamañoPiezaBase; // tamaño de cada pieza dentro del canvas.

    // 🔹 Crear cada pieza
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const pieza = new BlockaPiece(
          col * tamañoDestino,       // pos X (en canvas)
          row * tamañoDestino,       // pos Y  (en canvas)
          tamañoDestino,             //  ancho/alto de la pieza
          offsetX + col * anchoOrigen, // punto de recorte X de la imagen
          offsetY + row * altoOrigen   // punto de recorte Y de la imagen
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
    if (this.helpUsed) return; //Evita que el jugador use la ayuda más de una vez por partida.

    const incorrect = this.pieces.filter(p => !p.isCorrect() && !p.isFixed); //filtra las piezas que no están en la rotación correcta y que no están fijas (isFixed = false).
    if (incorrect.length === 0) return; //Si todas las piezas ya están correctas, no hace nada.

    const piece = incorrect[Math.floor(Math.random() * incorrect.length)]; // Elige una pieza al azar de las incorrectas.
    piece.rotation = piece.correctRotation; //la pone en la rotacion correcta
    piece.isFixed = true; //y le cambia el isFixed a true

    this.timer += 5;
    this.helpUsed = true; //Marca que la ayuda ya fue utilizada
    this.render();

    if (this.checkVictory()) {
      this.handleVictory();
    }
    //Después de usar la ayuda, si esa pieza corregida hace que todas las piezas estén correctas,
    // entonces el jugador gana el nivel, y se llama a handleVictory().
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

  render() { //Dibuja la pantalla según el valor de this.currentScreen:
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Cada pantalla tiene su propio método renderX(), que pinta los textos, imágenes y botones correspondientes.
    switch (this.currentScreen) {
      case 'menu':
        this.renderMenu(); //título y botones del menú principal.
        break;
      case 'instructions':
        this.renderInstructions(); //muestra texto explicativo del juego.
        break;
      case 'levelSelect':
        this.renderLevelSelect(); //permite elegir nivel y dificultad.
        break;
      case 'preview':
        this.renderPreview(); //muestra animación y la imagen a resolver.
        break;
      case 'game':
        this.renderGame(); //renderiza las piezas, el temporizador y los botones de juego.
        break;
      case 'victory':
        this.renderVictory(); //pantalla de ganar 
        break;
      case 'defeat':
        this.renderDefeat(); // pantalla de perder.
        break;
      case 'gallery':
        this.renderGallery(); //muestra todas las imágenes del juego.
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
      '• ⭐ Nivel 1: Escala de grises',
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
    const offsetX = 25; //deja un margen a la izquierda
    const boardHeight = this.rows * (this.gameAreaSize / Math.max(this.rows, this.cols)); //calcula el alto total del tablero
    const offsetY = (this.canvas.height - boardHeight) / 2; //centra verticalmente el tablero dentro del canvas.

    this.ctx.save(); //Guarda el estado del contexto (save) 
    this.ctx.translate(offsetX, offsetY); //traslada el origen del dibujo para que todo el tablero quede posicionado correctamente.

    this.pieces.forEach(piece => {
      this.ctx.save();

      const centerX = piece.x + piece.size / 2;
      const centerY = piece.y + piece.size / 2;

      this.ctx.translate(centerX, centerY);
      this.ctx.rotate((piece.rotation * Math.PI) / 180);

      // if (!this.checkVictory() && this.filters[this.currentLevel]) {
      //     this.filters[this.currentLevel](this.ctx);
      // }

      //
      //Se crea un canvas auxiliar temporal para procesar cada pieza individualmente.
      // Esto permite aplicar filtros o rotaciones sin alterar el canvas principal.
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

      this.ctx.strokeStyle = piece.isFixed ? '#4CAF50' : '#ddd'; //Dibuja un borde verde grueso si la pieza está fija (correcta), o gris fino si no.
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
