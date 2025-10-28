// Clase para manejar los tipos de planetas
class PlanetType {
    constructor(colors, glow, name, imagePath) {
        this.colors = colors;
        this.glow = glow;
        this.name = name;
        this.imagePath = imagePath;
        this.image = null;
        this.imageLoaded = false;
        
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
class Position {
    constructor(row, col) {
        this.row = row;
        this.col = col;
    }

    equals(other) {
        return this.row === other.row && this.col === other.col;
    }
}

// Clase para representar un movimiento válido
class Move {
    constructor(toRow, toCol, jumpRow, jumpCol) {
        this.to = new Position(toRow, toCol);
        this.jump = new Position(jumpRow, jumpCol);
    }
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

    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    draw(ctx) {
        // Sombra
        if (this.isHovered) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'rgba(102, 126, 234, 0.8)';
        } else {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(102, 126, 234, 0.4)';
        }

        // Fondo del botón
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Borde
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.shadowBlur = 0;

        // Texto
        ctx.fillStyle = 'white';
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
class GameTimer {
    constructor(initialTime, onTick, onExpire) {
        this.timeLeft = initialTime;
        this.initialTime = initialTime;
        this.onTick = onTick;
        this.onExpire = onExpire;
        this.interval = null;
    }

    start() {
        this.stop();
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.onTick(this.timeLeft);
            
            if (this.timeLeft <= 0) {
                this.stop();
                this.onExpire();
            }
        }, 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    reset() {
        this.stop();
        this.timeLeft = this.initialTime;
    }

    getFormattedTime() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Clase principal del juego
class PegSolitaire {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Constantes
        this.BOARD_SIZE = 7;
        this.CELL_SIZE = 70;
        this.PEG_RADIUS = 20;
        this.BOARD_OFFSET_X = 300;
        this.BOARD_OFFSET_Y = 180;
        this.GAME_TIME = 300; // 5 minutos
        
        // Tipos de planetas
        this.planetTypes = [
            new PlanetType(['#ff6b6b', '#ee5a6f'], '#ff6b6b', 'Planeta Rojo', 'planeta1.png'),
            new PlanetType(['#4ecdc4', '#44a8b3'], '#056dfeff', 'Planeta Azul', 'planeta2.png'),
            new PlanetType(['#ffe66d', '#ffd93d'], '#ffe66d', 'Planeta Dorado', 'planeta3.png'),
            new PlanetType(['#95e1d3', '#7dd5c0'], '#00ff15ff', 'Planeta Verde', 'planeta4.png')
        ];

        
        // Estado del juego
        this.board = [];
        this.selectedPeg = null;
        this.isDragging = false;
        this.dragPosition = { x: 0, y: 0 };
        this.validMoves = [];
        this.moveCount = 0;
        this.showHints = false;
        this.showHelp = false;
        this.showModal = false;
        this.modalTitle = '';
        this.modalMessage = '';
        this.hintAnimation = 0;
        this.stars = this.generateStars(150);
        
        // Botones
        this.buttons = [];
        this.createButtons();
        
        // Timer
        this.timer = new GameTimer(
            this.GAME_TIME,
            (timeLeft) => {},
            () => this.handleTimeExpired()
        );
        
        this.initBoard();
        this.setupEventListeners();
        this.animate();
    }

    createButtons() {
        const buttonWidth = 200;
        const buttonHeight = 45;
        const buttonX = 950;
        const startY = 250;
        const gap = 15;

        this.resetButton = new Button(buttonX, startY, buttonWidth, buttonHeight, '🔄 Reiniciar Juego', () => this.reset());
        this.helpButton = new Button(buttonX, startY + buttonHeight + gap, buttonWidth, buttonHeight, '❓ Cómo Jugar', () => this.toggleHelp());
        this.hintsButton = new Button(buttonX, startY + (buttonHeight + gap) * 2, buttonWidth, buttonHeight, '💡 Activar Ayudas', () => this.toggleHints());

        this.buttons = [this.resetButton, this.helpButton, this.hintsButton];

        // Botones del modal
        this.playAgainButton = new Button(this.canvas.width / 2 - 120, this.canvas.height / 2 + 80, 220, 50, 'Jugar de Nuevo', () => {
            this.closeModal();
            this.reset();
        });
        this.closeModalButton = new Button(this.canvas.width / 2 - 120, this.canvas.height / 2 + 145, 220, 50, 'Cerrar', () => this.closeModal());
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
                if ((row < 2 || row > 4) && (col < 2 || col > 4)) {
                    this.board[row][col] = -1;
                } else if (row === 3 && col === 3) {
                    this.board[row][col] = 0;
                } else {
                    this.board[row][col] = Math.floor(Math.random() * this.planetTypes.length) + 1;
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
        // Fondo espacial
        this.ctx.fillStyle = '#0a0e27';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Estrellas
        this.ctx.fillStyle = 'white';
        this.stars.forEach(star => {
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }

    drawTitle() {
        // Título
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🚀 PEG SOLITAIRE ESPACIAL 🌌', this.canvas.width / 2, 60);
        this.ctx.shadowBlur = 0;
    }

    drawStats() {
        const statsY = 120;
        const centerX = this.canvas.width / 2;
        
        // Panel de estadísticas
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        
        // Timer
        this.drawStatBox(centerX - 300, statsY, 180, 40, `⏱️ ${this.timer.getFormattedTime()}`);
        
        // Piezas restantes
        this.drawStatBox(centerX - 90, statsY, 180, 40, `🎯 Piezas: ${this.countPegs()}`);
        
        // Movimientos
        this.drawStatBox(centerX + 120, statsY, 180, 40, `💫 Movimientos: ${this.moveCount}`);
    }

    drawStatBox(x, y, width, height, text) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.strokeRect(x, y, width, height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width / 2, y + height / 2);
    }

    drawLegend() {
        const legendY = 450;
        const startX = 950;
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('🎨 LEYENDA', startX, legendY);
        
        this.planetTypes.forEach((type, index) => {
            const y = legendY + 40 + index * 35;
            
            // Fondo para cada item
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            this.ctx.fillRect(startX - 5, y - 18, 200, 32);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(startX - 5, y - 18, 200, 32);
            
            // Dibujar mini planeta
            const gradient = this.ctx.createRadialGradient(startX + 12, y, 0, startX + 12, y, 12);
            gradient.addColorStop(0, type.colors[0]);
            gradient.addColorStop(1, type.colors[1]);
            
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = type.glow;
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(startX + 12, y, 12, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            // Texto
            this.ctx.fillStyle = 'white';
            this.ctx.font = '15px Arial';
            this.ctx.fillText(type.name, startX + 35, y + 5);
        });
    }

    drawBoard() {
        this.drawBackground();
        this.drawTitle();
        this.drawStats();
        
        // Dibujar celdas del tablero
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === -1) continue;
                
                const x = this.BOARD_OFFSET_X + col * this.CELL_SIZE;
                const y = this.BOARD_OFFSET_Y + row * this.CELL_SIZE;
                
                // Dibujar celda
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
                this.ctx.lineWidth = 2;
                this.ctx.fillRect(x + 5, y + 5, this.CELL_SIZE - 10, this.CELL_SIZE - 10);
                this.ctx.strokeRect(x + 5, y + 5, this.CELL_SIZE - 10, this.CELL_SIZE - 10);
                
                const isBeingDragged = this.selectedPeg && 
                                      this.selectedPeg.row === row && 
                                      this.selectedPeg.col === col && 
                                      this.isDragging;
                
                if (this.board[row][col] > 0 && !isBeingDragged) {
                    const centerX = x + this.CELL_SIZE / 2;
                    const centerY = y + this.CELL_SIZE / 2;
                    this.drawPlanet(centerX, centerY, this.PEG_RADIUS, this.board[row][col] - 1, false);
                }
                
                if (this.board[row][col] === 0) {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.CELL_SIZE / 2, y + this.CELL_SIZE / 2, 12, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        
        if (this.selectedPeg) {
            this.drawValidMoves();
            
            if (this.showHints) {
                this.drawHintArrows();
            }
        }
        
        if (this.selectedPeg && this.isDragging) {
            const typeIndex = this.board[this.selectedPeg.row][this.selectedPeg.col] - 1;
            this.drawPlanet(this.dragPosition.x, this.dragPosition.y, this.PEG_RADIUS + 5, typeIndex, true);
        }

        // Dibujar botones
        this.buttons.forEach(button => button.draw(this.ctx));
        
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
        const panelY = 120;

        this.ctx.fillStyle = 'rgba(26, 26, 62, 0.95)';
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 3;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Título
        this.ctx.fillStyle = '#00ffff';
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
                this.ctx.fillStyle = '#9d7dff';
                this.ctx.font = 'bold 16px Arial';
            } else {
                this.ctx.fillStyle = 'white';
                this.ctx.font = '14px Arial';
            }
            this.ctx.fillText(line, leftMargin, textY + index * lineHeight);
        });

        // Botón cerrar
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Clic en cualquier lugar para cerrar', this.canvas.width / 2, panelY + panelHeight - 25);
    }

    drawModal() {
        // Fondo semi-transparente
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Panel del modal
        const modalWidth = 500;
        const modalHeight = 300;
        const modalX = (this.canvas.width - modalWidth) / 2;
        const modalY = (this.canvas.height - modalHeight) / 2;

        // Fondo del modal
        const gradient = this.ctx.createLinearGradient(modalX, modalY, modalX, modalY + modalHeight);
        gradient.addColorStop(0, '#1a1a3e');
        gradient.addColorStop(1, '#2d2d5f');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(modalX, modalY, modalWidth, modalHeight);

        // Borde brillante
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);

        this.ctx.shadowBlur = 30;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);
        this.ctx.shadowBlur = 0;

        // Título
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.modalTitle, this.canvas.width / 2, modalY + 80);

        // Mensaje
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(this.modalMessage, this.canvas.width / 2, modalY + 140);

        // Botones del modal
        this.playAgainButton.draw(this.ctx);
        this.closeModalButton.draw(this.ctx);
    }

    drawValidMoves() {
        this.validMoves.forEach(move => {
            const x = this.BOARD_OFFSET_X + move.to.col * this.CELL_SIZE + this.CELL_SIZE / 2;
            const y = this.BOARD_OFFSET_Y + move.to.row * this.CELL_SIZE + this.CELL_SIZE / 2;
            
            const pulse = Math.sin(this.hintAnimation * 0.05) * 5 + 5;
            
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
        
        this.validMoves.forEach(move => {
            const toX = this.BOARD_OFFSET_X + move.to.col * this.CELL_SIZE + this.CELL_SIZE / 2;
            const toY = this.BOARD_OFFSET_Y + move.to.row * this.CELL_SIZE + this.CELL_SIZE / 2;
            
            this.drawAnimatedArrow(fromX, fromY, toX, toY);
        });
    }

    drawAnimatedArrow(fromX, fromY, toX, toY) {
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const distance = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
        
        const animProgress = (Math.sin(this.hintAnimation * 0.08) + 1) / 2;
        const arrowLength = distance * (0.4 + animProgress * 0.3);
        
        const midX = fromX + Math.cos(angle) * arrowLength;
        const midY = fromY + Math.sin(angle) * arrowLength;
        
        const opacity = 0.6 + animProgress * 0.4;
        
        this.ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(fromX + Math.cos(angle) * 35, fromY + Math.sin(angle) * 35);
        this.ctx.lineTo(midX, midY);
        this.ctx.stroke();
        
        const headLength = 20;
        const headAngle = Math.PI / 5;
        
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
        this.ctx.shadowBlur = dragging ? 30 : 15;
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
                x - radius/2, y - radius/2, 0, 
                x - radius/2, y - radius/2, radius/1.5
            );
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = highlightGradient;
            this.ctx.beginPath();
            this.ctx.arc(x - radius/3, y - radius/3, radius/1.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        } else {
            // Si no hay imagen, usar gradiente de colores (fallback)
            const gradient = this.ctx.createRadialGradient(
                x - radius/3, y - radius/3, 0, 
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
                x - radius/2, y - radius/2, 0, 
                x - radius/2, y - radius/2, radius/2
            );
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = highlightGradient;
            this.ctx.beginPath();
            this.ctx.arc(x - radius/3, y - radius/3, radius/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Borde
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.shadowBlur = 0;
    }

    getBoardPosition(x, y) {
        const col = Math.floor((x - this.BOARD_OFFSET_X) / this.CELL_SIZE);
        const row = Math.floor((y - this.BOARD_OFFSET_Y) / this.CELL_SIZE);
        
        if (row >= 0 && row < this.BOARD_SIZE && col >= 0 && col < this.BOARD_SIZE) {
            return new Position(row, col);
        }
        return null;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < this.BOARD_SIZE && 
               col >= 0 && col < this.BOARD_SIZE && 
               this.board[row][col] !== -1;
    }

    getValidMoves(row, col) {
        const moves = [];
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
    }

    hasValidMoves() {
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

    makeMove(fromPos, toPos) {
        const validMove = this.validMoves.find(m => m.to.equals(toPos));
        
        if (validMove) {
            this.board[toPos.row][toPos.col] = this.board[fromPos.row][fromPos.col];
            this.board[fromPos.row][fromPos.col] = 0;
            this.board[validMove.jump.row][validMove.jump.col] = 0;
            this.moveCount++;
            
            setTimeout(() => this.checkGameOver(), 100);
            return true;
        }
        return false;
    }

    countPegs() {
        let count = 0;
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] > 0) count++;
            }
        }
        return count;
    }

    handleTimeExpired() {
        this.showGameOverModal('⏰ ¡Tiempo Agotado!', 'Se acabó el tiempo. ¡Intenta de nuevo!');
    }

    checkGameOver() {
        const pegsLeft = this.countPegs();
        
        if (pegsLeft === 1) {
            this.timer.stop();
            this.showGameOverModal('🎉 ¡VICTORIA!', '¡Felicitaciones! Solo queda un planeta.');
        } else if (!this.hasValidMoves()) {
            this.timer.stop();
            this.showGameOverModal('😔 Juego Terminado', `No hay movimientos. Piezas: ${pegsLeft}`);
        }
    }

    showGameOverModal(title, message) {
        this.modalTitle = title;
        this.modalMessage = message;
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    reset() {
        this.timer.stop();
        this.selectedPeg = null;
        this.isDragging = false;
        this.validMoves = [];
        this.showHelp = false;
        this.showModal = false;
        this.initBoard();
    }

    toggleHints() {
        this.showHints = !this.showHints;
        this.hintsButton.text = this.showHints ? '💡 Desactivar Ayudas' : '💡 Activar Ayudas';
    }

    toggleHelp() {
        this.showHelp = !this.showHelp;
    }

    setupEventListeners() {
        // Mouse move para hover de botones
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Verificar hover en botones principales
            this.buttons.forEach(button => {
                button.isHovered = button.isPointInside(x, y);
            });

            // Verificar hover en botones del modal
            if (this.showModal) {
                this.playAgainButton.isHovered = this.playAgainButton.isPointInside(x, y);
                this.closeModalButton.isHovered = this.closeModalButton.isPointInside(x, y);
            }

            // Drag and drop
            if (this.isDragging && this.selectedPeg) {
                this.dragPosition.x = x;
                this.dragPosition.y = y;
            }

            // Cambiar cursor
            const isOverButton = this.buttons.some(b => b.isHovered) || 
                               (this.showModal && (this.playAgainButton.isHovered || this.closeModalButton.isHovered));
            this.canvas.style.cursor = isOverButton ? 'pointer' : 'default';
        });

        // Mouse down
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Cerrar ayuda si está abierta
            if (this.showHelp) {
                this.showHelp = false;
                return;
            }

            // Verificar clic en botones del modal
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

            // Verificar clic en botones principales
            for (let button of this.buttons) {
                if (button.isPointInside(x, y)) {
                    button.click();
                    return;
                }
            }

            // Seleccionar pieza del tablero
            const pos = this.getBoardPosition(x, y);
            if (pos && this.board[pos.row][pos.col] > 0) {
                this.selectedPeg = pos;
                this.validMoves = this.getValidMoves(pos.row, pos.col);
                this.isDragging = true;
                this.dragPosition = { x, y };
            }
        });

        // Mouse up
        this.canvas.addEventListener('mouseup', (e) => {
            if (this.isDragging && this.selectedPeg) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const pos = this.getBoardPosition(x, y);
                
                if (pos) {
                    this.makeMove(this.selectedPeg, pos);
                }
                
                this.selectedPeg = null;
                this.isDragging = false;
                this.validMoves = [];
            }
        });

        // Mouse leave
        this.canvas.addEventListener('mouseleave', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.selectedPeg = null;
                this.validMoves = [];
            }
        });
    }

    animate() {
        this.hintAnimation++;
        this.drawBoard();
        requestAnimationFrame(() => this.animate());
    }
}

// Inicializar el juego
let game;
window.addEventListener('load', () => {
    game = new PegSolitaire('gameCanvas');
});