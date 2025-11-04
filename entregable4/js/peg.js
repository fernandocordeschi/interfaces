//para peg.html

// Clase para manejar los tipos de planetas
class PlanetType { //plantilla para crear objetos que representan tipos de planetas en el juego. serían las piezas del tablero
    constructor(colors, glow, name, imagePath) {
        this.colors = colors; //guarda los colores del planeta.
        this.glow = glow; //guarda el color del resplandor.
        this.name = name;
        this.imagePath = imagePath;
        this.image = null; //inicialmente null; más adelante se usará para almacenar el objeto Image
        this.imageLoaded = false;
        //Cada "tipo de planeta" tiene colores, un efecto de resplandor, un nombre y opcionalmente una imagen.

        // Cargar imagen si se proporciona una ruta
        if (imagePath) {
            this.image = new Image();
            this.image.onload = () => {
                this.imageLoaded = true;
            };
            this.image.src = imagePath;
        }
    }
}

// Clase para representar una posición en el tablero
//útil para juegos tipo "tablero" donde necesitas saber dónde está cada elemento.
class Position {
    constructor(row, col) {
        this.row = row;
        this.col = col;
    }

    equals(other) { //comparar dos posiciones para ver si son iguales.
        return this.row === other.row && this.col === other.col; //true si la fila y la columna coinciden, false si no.
    }
}

// Clase para representar un movimiento válido
class Move {
    constructor(toRow, toCol, jumpRow, jumpCol) {
        this.to = new Position(toRow, toCol); //posición final a donde se mueve la pieza.
        this.jump = new Position(jumpRow, jumpCol); //posición de la pieza que se elimina al hacer el salto.
    }
    /*
    toRow → fila destino del movimiento.
    toCol → columna destino del movimiento.
    jumpRow → fila de la pieza que se va a saltar.
    jumpCol → columna de la pieza que se va a saltar.
    */
}

// Clase para representar un botón
class Button {
    constructor(x, y, width, height, text, callback) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.callback = callback;
        this.isHovered = false;
    }


    /*Recibe coordenadas (x, y) de un punto (por ejemplo, la posición del mouse).
        Retorna true si el punto está dentro del botón, false si no.
        Esto sirve para detectar hover o clics.
    */
    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
            y >= this.y && y <= this.y + this.height;
    }

    draw(ctx) {
        // Sombra
        /**
         * Cambia la sombra dependiendo si el cursor está encima (hover).
        */
        if (this.isHovered) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(255, 165, 0, 0.6)';
        } else {
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(255, 165, 0, 0.3)';
        }

        // Fondo del botón estilo Los Simpson (amarillo a naranja)
        //degradado vertical para el fondo del botón: amarillo arriba, naranja abajo.
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#FDD017');
        gradient.addColorStop(1, '#FF8C00');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Borde negro
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.shadowBlur = 0;

        // Texto
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
    }

    click() {
        if (this.callback) {
            this.callback();
        }
    }
}

// Clase para manejar el temporizador
//iniciar, detener, reiniciar y formatear el tiempo restante.
class GameTimer {
    constructor(initialTime, onTick, onExpire) {
        this.timeLeft = initialTime; //tiempo que queda en la cuenta regresiva.
        this.initialTime = initialTime; //tiempo inicial para reiniciar.
        this.onTick = onTick; //función que se llama cada segundo con el tiempo restante.
        this.onExpire = onExpire; //función que se llama cuando el tiempo llega a 0.
        this.interval = null; //referencia al setInterval para poder detenerlo más tarde.
    }

    start() {
        this.stop(); //// asegura que no haya otro intervalo corriendo
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.onTick(this.timeLeft);

            if (this.timeLeft <= 0) {
                this.stop();
                this.onExpire();
            }
        }, 1000); //restar 1 segundo cada 1000 ms.
    }

    stop() { //Detiene el temporizador cancelando el setInterval.
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    reset() { //Detiene el temporizador y reinicia el tiempo a su valor original.
        this.stop();
        this.timeLeft = this.initialTime;
    }

    getFormattedTime() {
        const minutes = Math.floor(this.timeLeft / 60); //calcula los minutos, % 60 los segundos.
        const seconds = this.timeLeft % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        //padStart(2, '0') asegura que siempre tenga dos dígitos
    }
}

/* Clase principal del juego 
Controla todo el juego: tablero, fichas, pantalla inicial, botones, temporizador y animaciones
maneja estados como pantallas, selección de fichas, movimientos válidos, etc.
*/
class PegSolitaire {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Constantes
        this.BOARD_SIZE = 7; //tablero 7x7. 
        this.CELL_SIZE = 60; //tamaño de cada casilla en píxeles.
        this.PEG_RADIUS = 18; //radio de cada ficha
        this.BOARD_OFFSET_X = 200; //distancia desde el borde del canvas para centrar el tablero.
        this.BOARD_OFFSET_Y = 160; //mismo
        this.GAME_TIME = 300; // 5 minutos deduracion de juego

        // Tipos de planetas
        this.planetTypes = [
            new PlanetType(['#ff6b6b', '#ee5a6f'], '#ff6b6b', 'Bart', 'images/bart.png'),
            new PlanetType(['#4ecdc4', '#44a8b3'], '#056dfeff', 'Homero', 'images/homero.png'),
        ];

        // Imagen de fondo
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'images/sofa.jpg'; // Ajustá la ruta si es distinta
        this.backgroundImageLoaded = false;

        this.backgroundImage.onload = () => {
            this.backgroundImageLoaded = true;
        };

        // Estado del juego
        this.board = []; //matriz 2D de fichas.
        this.selectedPeg = null; //ficha que está siendo movida.
        this.isDragging = false; //si el jugador está arrastrando una ficha.
        this.dragPosition = { x: 0, y: 0 }; //posición actual del mouse al arrastrar.
        this.validMoves = []; //movimientos válidos para la ficha seleccionada.
        this.moveCount = 0;
        this.showHints = false;
        this.showHelp = false;
        this.showMenuHelp = false;
        this.showModal = false;
        this.modalTitle = '';
        this.modalMessage = '';
        this.hintAnimation = 0; //para animaciones de sugerencias.
        this.stars = this.generateStars(150); //fondo de estrellas generado aleatoriamente.

        this.inStartScreen = true;
        this.startButtons = [];


        // Botones
        this.buttons = [];
        this.createButtons(); //botones dentro del juego (p.ej., reiniciar).
        this.createStartButtons(); //botones de la pantalla de inicio (comenzar, cómo jugar).

        // Timer
        this.timer = new GameTimer(
            this.GAME_TIME,
            (timeLeft) => { },
            () => this.handleTimeExpired()
        );

        this.menuButton = new Button(20, 20, 100, 35, '🏠 Menú', () => {  // Cambio: 120x45 → 100x35
            this.inStartScreen = true;
            this.showModal = false;
            this.showHelp = false;
            this.isDragging = false;
            this.selectedPeg = null;
            this.validMoves = [];
            this.timer.stop();
        });
        this.initBoard();
        this.setupEventListeners();
        this.animate();
    }

    createButtons() {
        const buttonWidth = 180;  // Cambio: 200 → 180
        const buttonHeight = 40;  // Cambio: 45 → 40
        const buttonX = 800;  // Cambio: 950 → 580 (más cerca del tablero)
        const startY = 200;  // Cambio: 250 → 200
        const gap = 12;  // Cambio: 15 → 12

        this.resetButton = new Button(buttonX, startY, buttonWidth, buttonHeight, '🔄 Reiniciar Juego', () => this.reset());
        this.helpButton = new Button(buttonX, startY + buttonHeight + gap, buttonWidth, buttonHeight, '❓ Cómo Jugar', () => this.toggleHelp());
        this.hintsButton = new Button(buttonX, startY + (buttonHeight + gap) * 2, buttonWidth, buttonHeight, '💡 Activar Ayudas', () => this.toggleHints());

        this.buttons = [this.resetButton, this.helpButton, this.hintsButton];

    // Botones del modal (ajustados para modal más pequeño)
    const modalWidth = 400;
    const modalHeight = 240;
    const modalX = (this.canvas.width - modalWidth) / 2;
    const modalY = (this.canvas.height - modalHeight) / 2;
    
    this.playAgainButton = new Button(
        this.canvas.width / 2 - 100,  // Centrado en el canvas
        modalY + modalHeight - 90,     // 90px desde el fondo del modal
        200, 
        40,                            // Cambio: 45 → 40 (más pequeño)
        'Jugar de Nuevo', 
        () => {
            this.closeModal();
            this.reset();
        }
    );
    
    this.closeModalButton = new Button(
        this.canvas.width / 2 - 100,   // Centrado en el canvas
        modalY + modalHeight - 45,     // 45px desde el fondo del modal
        200, 
        40,                            // Cambio: 45 → 40 (más pequeño)
        'Cerrar', 
        () => this.closeModal()
    );
    }

    generateStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2
            });
        }
        return stars;
    }

    initBoard() {
        this.board = [];
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if ((row < 2 || row > 4) && (col < 2 || col > 4)) { //define las esquinas inválidas del tablero de Peg Solitaire.
                    this.board[row][col] = -1; //Tablero estándar tiene un patrón en cruz: las esquinas no se usan, se marcan como -1.
                } else if (row === 3 && col === 3) {
                    this.board[row][col] = 0; //La posición central (3,3) está vacía al inicio, representada con 0
                } else {
                    this.board[row][col] = Math.floor(Math.random() * this.planetTypes.length) + 1;
                    //Se elige un número aleatorio entre 1 y planetTypes.length.
                    //Esto representa qué tipo de ficha/planeta se coloca en esa celda.
                }
            }
        }

        this.moveCount = 0;
        this.selectedPeg = null;
        this.validMoves = [];
        this.timer.reset();
        this.timer.start();
    }

    drawBackground() {
        if (this.backgroundImageLoaded) {
            // Fondo con la imagen
            this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);

            // Oscurecer un poco el fondo
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#0a0e27';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // ✨ Estrellas parpadeantes
        const time = Date.now() * 0.005; // velocidad del parpadeo

        this.stars.forEach((star, i) => {
            // Parpadeo más marcado
            const flicker = 0.5 + 0.5 * Math.sin(time + i * 2);
            const alpha = 0.3 + flicker * 0.9; // aumenta contraste

            // Color central brillante
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);

            // Halo luminoso (más grande y cálido)
            const gradient = this.ctx.createRadialGradient(
                star.x + star.size / 2,
                star.y + star.size / 2,
                0,
                star.x + star.size / 2,
                star.y + star.size / 2,
                star.size * 3
            );
            gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha * 0.6})`);
            gradient.addColorStop(1, `rgba(255, 255, 200, 0)`);

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(star.x + star.size / 2, star.y + star.size / 2, star.size * 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }


    drawTitle() {
        // Título estilo Los Simpson
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
        this.ctx.fillStyle = '#FDD017';
        this.ctx.font = 'bold 36px Arial';  // Cambio: 48px → 36px
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeText('PEG SOLITAIRE: Homer vs Bart', this.canvas.width / 2, 40);  // Cambio: 60 → 40
        this.ctx.fillText('PEG SOLITAIRE: Homer vs Bart', this.canvas.width / 2, 40);
        this.ctx.shadowBlur = 0;

        // Subtítulo
        this.ctx.fillStyle = '#FF8C00';
        this.ctx.font = 'italic 18px Arial';  // Cambio: 22px → 18px
        this.ctx.fillText('La Batalla del Sofá', this.canvas.width / 2, 68);  // Cambio: 95 → 68
    }


    //se encarga de mostrar tres paneles de estadísticas sobre el tablero: tiempo restante, piezas restantes y movimientos realizados.
    drawStats() {
        const statsY = 100;  // Cambio: 130 → 100
        const centerX = this.canvas.width / 2;

        // Panel de estadísticas
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.strokeStyle = '#FF8C00';
        this.ctx.lineWidth = 2;

        // Timer
        this.drawStatBox(centerX - 250, statsY, 150, 35, `⏱️ ${this.timer.getFormattedTime()}`);  // Cambio: tamaño 180x40 → 150x35

        // Piezas restantes
        this.drawStatBox(centerX - 75, statsY, 150, 35, `🎯 Piezas: ${this.countPegs()}`);

        // Movimientos
        this.drawStatBox(centerX + 100, statsY, 150, 35, `💫 Movs: ${this.moveCount}`);  // Cambio: "Movimientos" → "Movs"
    }

    drawStatBox(x, y, width, height, text) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeStyle = '#FF8C00';
        this.ctx.strokeRect(x, y, width, height);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '15px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width / 2, y + height / 2);
    }

drawLegend() {
    const legendY = 380;
    const startX = 800;

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 18px Arial';  // Cambio: 16px → 18px (más grande)
    this.ctx.textAlign = 'left';
    this.ctx.fillText('🎨 LEYENDA', startX, legendY);

    this.planetTypes.forEach((type, index) => {
        const y = legendY + 40 + index * 45;  // Cambio: 35 y 32 → 40 y 45 (más espaciado)

        // Fondo para cada item (más grande)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.fillRect(startX - 5, y - 22, 180, 40);  // Cambio: 180x28 → 220x40
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(startX - 5, y - 22, 180, 40);

        // Dibujar mini planeta usando imagen (igual que en el tablero)
        this.drawPlanet(startX + 18, y, 16, index, false);  // Cambio: radio 10 → 16, usa drawPlanet

        // Texto (más grande)
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';  // Cambio: 14px → 16px bold
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(type.name, startX + 45, y);  // Cambio: 30 → 45 (más espacio)
    });
}

    drawBoard() {
        this.drawBackground();
        this.drawTitle();
        this.drawStats();

        // Dibujar celdas del tablero
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === -1) continue; //-1 indica celdas inválidas (no forman parte del tablero).

                //x y y calculan la posición de cada celda en el canvas usando el offset y tamaño de celda.
                const x = this.BOARD_OFFSET_X + col * this.CELL_SIZE;
                const y = this.BOARD_OFFSET_Y + row * this.CELL_SIZE;

                // Dibujar celda
                //Dibuja un rectángulo ligeramente transparente para representar la celda.
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                this.ctx.strokeStyle = '#ff8c00c8';
                this.ctx.lineWidth = 2;
                this.ctx.fillRect(x + 5, y + 5, this.CELL_SIZE - 10, this.CELL_SIZE - 10);
                this.ctx.strokeRect(x + 5, y + 5, this.CELL_SIZE - 10, this.CELL_SIZE - 10);

                //Verifica si la ficha actual está seleccionada y se está arrastrando para no dibujarla en su posición original
                const isBeingDragged = this.selectedPeg && this.selectedPeg.row === row &&
                    this.selectedPeg.col === col && this.isDragging;


                //Solo dibuja las fichas que no están vacías (0) y que no se están arrastrando.
                if (this.board[row][col] > 0 && !isBeingDragged) {
                    const centerX = x + this.CELL_SIZE / 2;
                    const centerY = y + this.CELL_SIZE / 2;
                    this.drawPlanet(centerX, centerY, this.PEG_RADIUS, this.board[row][col] - 1, false);
                }

                //Si la celda está vacía (0), dibuja un círculo transparente para mostrar el lugar disponible.
                if (this.board[row][col] === 0) {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.CELL_SIZE / 2, y + this.CELL_SIZE / 2, 12, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }

        //Si hay una ficha seleccionada y las pistas están activadas, dibuja flechas o indicaciones de los movimientos válidos.
        if (this.selectedPeg) {

            if (this.showHints) {
                this.drawHintArrows();
                this.drawValidMoves();

            }
        }

        //Dibuja la ficha seleccionada siguiendo la posición del mouse (dragPosition).
        if (this.selectedPeg && this.isDragging) {
            const typeIndex = this.board[this.selectedPeg.row][this.selectedPeg.col] - 1;
            this.drawPlanet(this.dragPosition.x, this.dragPosition.y, this.PEG_RADIUS + 5, typeIndex, true);
            //Aumenta ligeramente el tamaño (+5) y le pone en true el isdraggin 
        }

        // Dibujar botones
        this.buttons.forEach(button => button.draw(this.ctx));
        this.menuButton.draw(this.ctx);

        // Dibujar leyenda
        this.drawLegend();

        // Dibujar ayuda
        if (this.showHelp) {
            this.drawHelpScreen();
        }

        // Dibujar modal
        if (this.showModal) {
            this.drawModal();
        }
    }

    drawHelpScreen() {
        // Fondo semi-transparente
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Panel de ayuda más compacto
        const panelWidth = 600;
        const panelHeight = 550;
        const panelX = (this.canvas.width - panelWidth) / 2;
        const panelY = 20;

        this.ctx.fillStyle = 'rgba(62, 37, 26, 0.95)';
        this.ctx.strokeStyle = '#FDD017';
        this.ctx.lineWidth = 3;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Título
        this.ctx.fillStyle = '#FDD017';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('📖 CÓMO JUGAR', this.canvas.width / 2, panelY + 45);

        // Contenido
        this.ctx.fillStyle = 'white';
        this.ctx.font = '15px Arial';
        this.ctx.textAlign = 'left';
        let textY = panelY + 85;
        const lineHeight = 20;
        const leftMargin = panelX + 40;

        const helpText = [
            '🎯 OBJETIVO',
            'Eliminar todas las piezas excepto una en el centro.',
            '',
            '🎮 REGLAS',
            '• Clic en un planeta para seleccionarlo',
            '• Arrastra sobre otra pieza hacia un espacio vacío',
            '• La pieza saltada se elimina',
            '• Solo movimientos horizontales/verticales',
            '',
            '💡 AYUDAS',
            '• Flechas doradas: movimientos posibles',
            '• Círculos verdes: destinos válidos',
            '',
            '⏱️ TIEMPO',
            'Tienes 5 minutos para completar',
            '',
            '🏆 FIN DEL JUEGO',
            '• Victoria: Solo queda 1 pieza',
            '• Derrota: Sin movimientos válidos o tiempo agotado'
        ];

        helpText.forEach((line, index) => {
            if (line.includes('OBJETIVO') || line.includes('REGLAS') || line.includes('AYUDAS') ||
                line.includes('TIEMPO') || line.includes('FIN')) {
                this.ctx.fillStyle = '#FF8C00';
                this.ctx.font = 'bold 16px Arial';
            } else {
                this.ctx.fillStyle = 'white';
                this.ctx.font = '14px Arial';
            }
            this.ctx.fillText(line, leftMargin, textY + index * lineHeight);
        });

        // Botón cerrar
        this.ctx.fillStyle = '#FDD017';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Clic en cualquier lugar para cerrar', this.canvas.width / 2, panelY + panelHeight - 25);
    }

    drawMenuHelpScreen() {

        // Fondo semi-transparente
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.60)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Panel
        const panelWidth = 600;
        const panelHeight = 550;
        const panelX = (this.canvas.width - panelWidth) / 2;
        const panelY = 25;

        this.ctx.fillStyle = 'rgba(62, 37, 26, 0.95)';
        this.ctx.strokeStyle = '#FDD017';
        this.ctx.lineWidth = 3;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Título
        this.ctx.fillStyle = '#FDD017';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('📖 CÓMO JUGAR', this.canvas.width / 2, panelY + 45);

        // Contenido (puedes reutilizar el arreglo de texto)
        const helpText = [
            '🎯 OBJETIVO',
            'Eliminar todas las piezas excepto una en el centro.',
            '',
            '🎮 REGLAS',
            '• Clic en un planeta para seleccionarlo',
            '• Arrastra sobre otra pieza hacia un espacio vacío',
            '• La pieza saltada se elimina',
            '• Solo movimientos horizontales/verticales',
            '',
            '💡 AYUDAS',
            '• Flechas doradas: movimientos posibles',
            '• Círculos verdes: destinos válidos',
            '',
            '⏱️ TIEMPO',
            'Tienes 5 minutos para completar',
            '',
            '🏆 FIN DEL JUEGO',
            '• Victoria: Solo queda 1 pieza',
            '• Derrota: Sin movimientos válidos o tiempo agotado'
        ];

        const lineHeight = 20;
        const leftMargin = panelX + 300;
        let textY = panelY + 85;

        helpText.forEach((line, index) => {
            if (line.includes('OBJETIVO') || line.includes('REGLAS') || line.includes('AYUDAS') ||
                line.includes('TIEMPO') || line.includes('FIN')) {
                this.ctx.fillStyle = '#FF8C00';
                this.ctx.font = 'bold 16px Arial';
            } else {
                this.ctx.fillStyle = 'white';
                this.ctx.font = '14px Arial';
            }
            this.ctx.fillText(line, leftMargin, textY + index * lineHeight);
        });

        // Botón para cerrar (clic en cualquier lugar)
        this.ctx.fillStyle = '#FDD017';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Clic en cualquier lugar para cerrar', this.canvas.width / 2, panelY + panelHeight - 25);
    }

    drawModal() {
        // Fondo semi-transparente
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Panel del modal (más pequeño)
        const modalWidth = 400;  // Cambio: 500 → 400
        const modalHeight = 240;  // Cambio: 300 → 240
        const modalX = (this.canvas.width - modalWidth) / 2;
        const modalY = (this.canvas.height - modalHeight) / 2;

        // Fondo del modal
        const gradient = this.ctx.createLinearGradient(modalX, modalY, modalX, modalY + modalHeight);
        gradient.addColorStop(0, 'rgba(62, 37, 26, 0.95)');
        gradient.addColorStop(1, '#5f442dff');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(modalX, modalY, modalWidth, modalHeight);

        // Borde brillante
        this.ctx.strokeStyle = '#FDD017';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);

        this.ctx.shadowBlur = 30;
        this.ctx.shadowColor = '#FDD017';
        this.ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);
        this.ctx.shadowBlur = 0;

        // Título (más pequeño)
        this.ctx.fillStyle = '#FDD017';
        this.ctx.font = 'bold 28px Arial';  // Cambio: 36px → 28px
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.modalTitle, this.canvas.width / 2, modalY + 60);

        // Mensaje (más pequeño)
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';  // Cambio: 20px → 16px
        this.ctx.fillText(this.modalMessage, this.canvas.width / 2, modalY + 105);

        // Botones del modal
        this.playAgainButton.draw(this.ctx);
        this.closeModalButton.draw(this.ctx);
    }

    drawValidMoves() { //dibuja círculos verdes pulsantes sobre todas las celdas a las que la ficha seleccionada puede moverse.
        this.validMoves.forEach(move => {
            const x = this.BOARD_OFFSET_X + move.to.col * this.CELL_SIZE + this.CELL_SIZE / 2;
            const y = this.BOARD_OFFSET_Y + move.to.row * this.CELL_SIZE + this.CELL_SIZE / 2; //+ this.CELL_SIZE / 2 centra el círculo sobre la celda.
            //Convierte las coordenadas de fila/columna del tablero a coordenadas (x, y) en el canvas.

            //efecto de “pulso”
            const pulse = Math.sin(this.hintAnimation * 0.05) * 5 + 5;
            /*
            this.hintAnimation es un contador que aumenta con cada frame de animación.
            Math.sin() genera un movimiento oscilante.
            * 5 + 5 ajusta la amplitud para que el radio del círculo oscile entre 0 y 10 pixeles adicionales.
            Esto da un efecto de pulso o respiración en las indicaciones de movimiento.
            */

            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.PEG_RADIUS + pulse, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        });
    }

    drawHintArrows() {
        if (!this.selectedPeg) return;

        const fromX = this.BOARD_OFFSET_X + this.selectedPeg.col * this.CELL_SIZE + this.CELL_SIZE / 2;
        const fromY = this.BOARD_OFFSET_Y + this.selectedPeg.row * this.CELL_SIZE + this.CELL_SIZE / 2;

        //validMoves es un array de posibles movimientos desde la ficha seleccionada.
        this.validMoves.forEach(move => {
            const toX = this.BOARD_OFFSET_X + move.to.col * this.CELL_SIZE + this.CELL_SIZE / 2;
            const toY = this.BOARD_OFFSET_Y + move.to.row * this.CELL_SIZE + this.CELL_SIZE / 2;

            this.drawAnimatedArrow(fromX, fromY, toX, toY); //se encarga de dibujar una flecha desde la ficha seleccionada hasta la posición destino.
        });
    }

    drawAnimatedArrow(fromX, fromY, toX, toY) { //ace que cada flecha sea animada, pulsante y visible
        const angle = Math.atan2(toY - fromY, toX - fromX); //dirección de la flecha desde el punto de origen hacia el destino (en radianes)
        const distance = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2); //distancia total entre el inicio y el fin del movimiento

        const animProgress = (Math.sin(this.hintAnimation * 0.08) + 1) / 2; //oscila entre 0 y 1 usando sin, lo que hace que la flecha “crezca y se achique” suavemente.
        const arrowLength = distance * (0.4 + animProgress * 0.3); //define la longitud actual de la flecha según la animación, nunca llega hasta el destino completo para crear efecto dinámico.

        const midX = fromX + Math.cos(angle) * arrowLength;
        const midY = fromY + Math.sin(angle) * arrowLength;
        //midX y midY son las coordenadas del punto final visible de la flecha, que varía según la animación.

        const opacity = 0.6 + animProgress * 0.4;
        //La flecha se vuelve más brillante y más tenue en el ciclo de animación, dando efecto de resaltado.

        this.ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(fromX + Math.cos(angle) * 35, fromY + Math.sin(angle) * 35);
        //La línea empieza a 35 px del centro de la ficha, no desde el centro exacto, para que la flecha no “tape” la ficha.
        this.ctx.lineTo(midX, midY); //Se dibuja hasta midX, midY, la longitud animada.
        this.ctx.stroke();


        //cabeza de la flecha
        const headLength = 20;
        const headAngle = Math.PI / 5; //cuán “ancha” es la punta

        this.ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
        this.ctx.beginPath();
        this.ctx.moveTo(midX, midY);
        this.ctx.lineTo(
            midX - headLength * Math.cos(angle - headAngle),
            midY - headLength * Math.sin(angle - headAngle)
        );
        this.ctx.lineTo(
            midX - headLength * Math.cos(angle + headAngle),
            midY - headLength * Math.sin(angle + headAngle)
        );
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = `rgba(255, 215, 0, ${opacity * 0.5})`;
        this.ctx.beginPath();
        this.ctx.arc(fromX + Math.cos(angle) * 35, fromY + Math.sin(angle) * 35, 6, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPlanet(x, y, radius, typeIndex, dragging = false) {
        const type = this.planetTypes[typeIndex];

        // Sombra/Glow
        this.ctx.shadowBlur = dragging ? 30 : 15; //Si el planeta se está arrastrando (dragging = true), el brillo es más intenso
        this.ctx.shadowColor = type.glow;

        // Si tiene imagen cargada, dibujarla
        if (type.imageLoaded && type.image) {
            // Guardar el contexto
            this.ctx.save();

            // Crear máscara circular
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.closePath();
            this.ctx.clip();

            // Dibujar la imagen centrada y escalada
            const size = radius * 2;
            this.ctx.drawImage(type.image, x - radius, y - radius, size, size);

            // Restaurar el contexto
            this.ctx.restore();

            //save() y restore() permiten aislar la máscara para no afectar otros dibujos.

            // Borde del planeta
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.stroke();

            // Brillo superior opcional
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            const highlightGradient = this.ctx.createRadialGradient(
                x - radius / 2, y - radius / 2, 0,
                x - radius / 2, y - radius / 2, radius / 1.5
            );
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = highlightGradient;
            this.ctx.beginPath();
            this.ctx.arc(x - radius / 3, y - radius / 3, radius / 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        } else {
            // Si no hay imagen, usar gradiente de colores (fallback)
            const gradient = this.ctx.createRadialGradient(
                x - radius / 3, y - radius / 3, 0,
                x, y, radius
            );
            gradient.addColorStop(0, type.colors[0]);
            gradient.addColorStop(1, type.colors[1]);

            // Dibujar planeta
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Brillo superior
            const highlightGradient = this.ctx.createRadialGradient(
                x - radius / 2, y - radius / 2, 0,
                x - radius / 2, y - radius / 2, radius / 2
            );
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = highlightGradient;
            this.ctx.beginPath();
            this.ctx.arc(x - radius / 3, y - radius / 3, radius / 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Borde
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.ctx.shadowBlur = 0; //Se resetea shadowBlur para que no afecte a otros elementos que se dibujen después.
    }


    //convierte coordenadas de pantalla del mouse en una posición de celda dentro del tablero (row, col).
    getBoardPosition(x, y) {
        const col = Math.floor((x - this.BOARD_OFFSET_X) / this.CELL_SIZE);
        const row = Math.floor((y - this.BOARD_OFFSET_Y) / this.CELL_SIZE);

        if (row >= 0 && row < this.BOARD_SIZE && col >= 0 && col < this.BOARD_SIZE) {
            return new Position(row, col);
        }
        return null;
    }

    isValidPosition(row, col) { //comprobación de límites y validez de celda antes de hacer cualquier movimiento.
        return row >= 0 && row < this.BOARD_SIZE &&
            col >= 0 && col < this.BOARD_SIZE &&
            this.board[row][col] !== -1;
    }

    getValidMoves(row, col) {  //Determinar todos los movimientos válidos para una ficha situada en (row, col) en el tablero
        const moves = []; //Lista donde se van a guardar los movimientos válidos.

        //4 posibles saltos (arriba, abajo, izquierda, derecha).
        const directions = [
            { dr: -2, dc: 0, jr: -1, jc: 0 },
            { dr: 2, dc: 0, jr: 1, jc: 0 },
            { dr: 0, dc: -2, jr: 0, jc: -1 },
            { dr: 0, dc: 2, jr: 0, jc: 1 }
        ];

        directions.forEach(dir => {
            const newRow = row + dir.dr;
            const newCol = col + dir.dc;
            const jumpRow = row + dir.jr;
            const jumpCol = col + dir.jc;

            if (this.isValidPosition(newRow, newCol) &&
                this.board[newRow][newCol] === 0 &&
                this.board[jumpRow][jumpCol] > 0) {
                moves.push(new Move(newRow, newCol, jumpRow, jumpCol));
            }
        });

        return moves;
        //Devuelve la lista de todos los movimientos válidos para la ficha en (row, col).
    }

    hasValidMoves() { //Determinar si hay al menos un movimiento válido en todo el tablero.
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] > 0) {
                    if (this.getValidMoves(row, col).length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    //movimiento solo si es válido: mueve una ficha desde fromPos a toPos, 
    // elimina la ficha saltada y actualiza el contador de movimientos.
    makeMove(fromPos, toPos) {

        /*
        Recorre todos los movimientos válidos (this.validMoves) para la ficha seleccionada.
        Busca uno cuyo destino (m.to) sea igual a toPos.
        Si no encuentra ninguno → validMove será undefined.
        */
        const validMove = this.validMoves.find(m => m.to.equals(toPos));

        if (validMove) {
            this.board[toPos.row][toPos.col] = this.board[fromPos.row][fromPos.col];
            this.board[fromPos.row][fromPos.col] = 0;
            this.board[validMove.jump.row][validMove.jump.col] = 0;
            this.moveCount++;

            setTimeout(() => this.checkGameOver(), 100); //Comprueba si el juego terminó.
            return true;
        }
        return false;
    }

    countPegs() { //Cuenta cuántas fichas (pegs) quedan en el tablero.
        let count = 0;
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] > 0) count++; //Si la celda contiene una ficha (> 0), incrementa el contador.
            }
        }
        return count;
    }

    handleTimeExpired() {
        this.showGameOverModal('⏰ ¡Tiempo Agotado!', 'Se acabó el tiempo. ¡Intenta de nuevo!');
    }


    /**
    Determina si el juego terminó, ya sea porque:
        Victoria: Solo queda una ficha en el tablero.
        Derrota / fin de juego: No quedan movimientos válidos aunque haya más de una ficha.
    */
    checkGameOver() {
        const pegsLeft = this.countPegs();

        if (pegsLeft === 1) {//Detiene el temporizador.
            this.timer.stop();
            this.showGameOverModal('🎉 ¡VICTORIA!', '¡Felicitaciones! Solo queda un planeta.'); //modal victoria
        } else if (!this.hasValidMoves()) { //Si no hay movimientos válidos (aunque queden varias fichas):
            this.timer.stop();
            this.showGameOverModal('😔 Juego Terminado', `No hay movimientos. Piezas: ${pegsLeft}`); //modal derrota
        }
    }

    //no dibuja el modal directamente, solo prepara los datos y activa la bandera para que el método de dibujo (drawModal()) lo muestre en pantalla.
    showGameOverModal(title, message) {
        this.modalTitle = title;
        this.modalMessage = message;
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        //showModal a false, por lo que en el próximo renderizado drawModal() ya no dibujará nada.
    }

    reset() { //Esta función reinicia el juego completamente.
        this.timer.stop(); //Detiene el temporizador actual.
        this.selectedPeg = null; //Ninguna ficha está seleccionada.
        this.isDragging = false; //No se está arrastrando ninguna ficha.
        this.validMoves = []; //No hay movimientos válidos resaltados.
        this.showHelp = false;
        this.showModal = false;
        this.initBoard(); //Reinicia el tablero a su estado inicial.
    }

    toggleHints() { //Cambia el estado de las ayudas visuales del juego (flechas y círculos de sugerencia).
        this.showHints = !this.showHints;
        this.hintsButton.text = this.showHints ? '💡 Desactivar Ayudas' : '💡 Activar Ayudas';
    }

    toggleHelp() { //Alterna la pantalla de ayuda del juego.
        this.showHelp = !this.showHelp;
    }



    setupEventListeners() {

        // --- Mouse move (hover + drag) ---
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect(); //rect toma en cuenta la posición del canvas en la página.
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Si estamos en la pantalla de inicio
            if (this.inStartScreen) { //Comprueba si el mouse está sobre los botones de inicio.
                this.startButtons.forEach(btn => btn.isHovered = btn.isPointInside(x, y));
                this.canvas.style.cursor = this.startButtons.some(b => b.isHovered) ? 'pointer' : 'default';
                return; //Retorna porque no necesita procesar el resto de eventos del tablero mientras está en la pantalla de inicio.
            }

            // Hover de botones principales
            this.buttons.forEach(button => {
                button.isHovered = button.isPointInside(x, y); //Actualiza la propiedad isHovered de cada botón
            });

            // Hover del botón de menú
            this.menuButton.isHovered = this.menuButton.isPointInside(x, y);

            // Hover de botones del modal
            if (this.showModal) {
                this.playAgainButton.isHovered = this.playAgainButton.isPointInside(x, y);
                this.closeModalButton.isHovered = this.closeModalButton.isPointInside(x, y);
            }

            // Drag and drop
            //Si se está arrastrando una ficha seleccionada, se actualiza la posición de arrastre (dragPosition)
            if (this.isDragging && this.selectedPeg) {
                this.dragPosition.x = x;
                this.dragPosition.y = y;
            }

            // Cambiar cursor si pasa sobre un botón
            const isOverButton =
                this.buttons.some(b => b.isHovered) ||
                this.menuButton.isHovered ||
                (this.showModal && (this.playAgainButton.isHovered || this.closeModalButton.isHovered));
            this.canvas.style.cursor = isOverButton ? 'pointer' : 'default';
        });

        // --- Mouse down (clic) ---
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            //Obtiene posición del mouse al hacer clic.

            if (this.inStartScreen && this.showMenuHelp) {
                this.showMenuHelp = false; // cerrar panel de ayuda en menú
                return;
            }

            // Si estamos en la pantalla inicial
            if (this.inStartScreen) {
                for (const b of this.startButtons) {
                    if (b.isPointInside(x, y)) {
                        b.click();
                        return;
                    }
                }
                return;
            }



            // Cerrar ayuda si está abierta
            if (this.showHelp) {
                this.showHelp = false;
                return;
            }


            // Botones del modal
            //Detecta clics sobre los botones del modal y ejecuta su acción.
            if (this.showModal) {
                if (this.playAgainButton.isPointInside(x, y)) {
                    this.playAgainButton.click();
                    return;
                }
                if (this.closeModalButton.isPointInside(x, y)) {
                    this.closeModalButton.click();
                    return;
                }
                return;
            }

            // Botones principales
            for (let button of this.buttons) {
                if (button.isPointInside(x, y)) {
                    button.click();
                    return;
                }
            }

            // Botón de menú
            if (this.menuButton.isPointInside(x, y)) {
                this.menuButton.click();
                return;
            }

            // Seleccionar ficha (inicio de drag)
            /**
            Si el clic cae sobre una ficha del tablero:
            La selecciona (selectedPeg)
            Calcula los movimientos válidos (validMoves)
            Activa el arrastre (isDragging)
            Guarda la posición del mouse (dragPosition)
             */
            const pos = this.getBoardPosition(x, y);
            if (pos && this.board[pos.row][pos.col] > 0) {
                this.selectedPeg = pos;
                this.validMoves = this.getValidMoves(pos.row, pos.col);
                this.isDragging = true;
                this.dragPosition = { x, y };
            }
        });

        // --- Mouse up (soltar drag) ---
        //Termina el arrastre de una ficha.
        // Si se suelta sobre una posición válida, se hace el movimiento (makeMove).
        // Luego limpia las variables de arrastre.

        this.canvas.addEventListener('mouseup', (e) => {
            if (this.isDragging && this.selectedPeg) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const pos = this.getBoardPosition(x, y);

                if (pos) this.makeMove(this.selectedPeg, pos);

                this.selectedPeg = null;
                this.isDragging = false;
                this.validMoves = [];
            }
        });

        // --- Mouse leave (salida del canvas) ---
        //Evita que la ficha quede “pegada” si el mouse sale del canvas durante un arrastre.
        this.canvas.addEventListener('mouseleave', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.selectedPeg = null;
                this.validMoves = [];
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate()); //Llama a animate en el siguiente frame de animación.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.hintAnimation++;
        /*
        Incrementa un contador (hintAnimation) que se usa para animar flechas y pulsos de movimientos válidos (drawHintArrows() y drawValidMoves()).
        Como se incrementa en cada frame, la animación es suave y continua.*/

        if (this.inStartScreen) {
            this.drawStartScreen();
        } else {
            this.drawBoard();
        }
    }

    drawStartScreen() {
        this.drawBackground();

        // Título
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#FFD700';
        this.ctx.fillStyle = '#FFD90F';
        this.ctx.font = 'bold 60px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#ff6a0063';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText('PEG SOLITAIRE', this.canvas.width / 2, 200);
        this.ctx.fillText('PEG SOLITAIRE', this.canvas.width / 2, 200);

        this.ctx.font = 'italic 30px Arial';
        this.ctx.fillStyle = '#FFA500';
        this.ctx.fillText('Homer vs Bart', this.canvas.width / 2, 250);
        this.ctx.shadowBlur = 0;

        // Botones de inicio
        this.startButtons.forEach(b => b.draw(this.ctx));

        // Texto de créditos
        this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('© 2025 - Versión Espacial Los Simpson', this.canvas.width / 2, this.canvas.height - 30);
        if (this.showMenuHelp) {
            this.drawMenuHelpScreen();
        }
    }

    createStartButtons() {
        const btnWidth = 230;
        const btnHeight = 55;
        const btnY = 350;
        const centerX = this.canvas.width / 2 - btnWidth / 2;

        const startBtn = new Button(centerX, btnY, btnWidth, btnHeight, '🚀 Comenzar', () => {
            this.inStartScreen = false;
            this.initBoard();
            this.timer.start();
        });

        const helpBtn = new Button(centerX, btnY + 80, btnWidth, btnHeight, '📖 Cómo Jugar', () => {
            this.showMenuHelp = true; // en lugar de showHelp
        });

        this.startButtons = [startBtn, helpBtn];
    }
}

// Inicializar el juego
let game;
window.addEventListener('load', () => {
    game = new PegSolitaire('gameCanvas');
});