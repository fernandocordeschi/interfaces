const game = {
            currentLevel: 1,
            maxLevel: 3,
            timerSeconds: 0,
            timerInterval: null,
            currentImage: null,
            pieces: [],
            helpUsed: false,
            penaltySeconds: 0,
            
            imageBank: [
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
                'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
                'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
                'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800',
                'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
                'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800',
                'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
                'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800'
            ],

            filters: [
                'grayscale(100%)',
                'brightness(30%)',
                'invert(100%)'
            ],

            startGame() {
                this.currentLevel = 1;
                this.loadLevel();
            },

            loadLevel() {
                this.showScreen('game');
                this.timerSeconds = 0;
                this.penaltySeconds = 0;
                this.helpUsed = false;
                document.getElementById('penalty').style.display = 'none';
                
                // Seleccionar imagen aleatoria
                this.currentImage = this.imageBank[Math.floor(Math.random() * this.imageBank.length)];
                
                // Mostrar preview
                const preview = document.getElementById('previewImage');
                preview.src = this.currentImage;
                preview.style.filter = this.filters[this.currentLevel - 1];
                
                // Actualizar nivel
                document.getElementById('currentLevel').textContent = this.currentLevel;
                
                // Crear piezas
                this.createPieces();
                
                // Iniciar timer
                this.startTimer();
            },

            createPieces() {
                const board = document.getElementById('gameBoard');
                board.innerHTML = '';
                this.pieces = [];

                const positions = [
                    { x: 0, y: 0 },      // Top-left
                    { x: 50, y: 0 },     // Top-right
                    { x: 0, y: 50 },     // Bottom-left
                    { x: 50, y: 50 }     // Bottom-right
                ];

                for (let i = 0; i < 4; i++) {
                    const piece = document.createElement('div');
                    piece.className = 'piece';
                    piece.dataset.index = i;
                    
                    // Rotación aleatoria inicial
                    const randomRotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
                    
                    const img = document.createElement('img');
                    img.src = this.currentImage;
                    img.style.objectPosition = `-${positions[i].x}% -${positions[i].y}%`;
                    img.style.width = '200%';
                    img.style.height = '200%';
                    img.style.transform = `rotate(${randomRotation}deg)`;
                    img.style.filter = this.filters[this.currentLevel - 1];
                    
                    piece.appendChild(img);
                    board.appendChild(piece);
                    
                    // Event listeners
                    piece.addEventListener('click', (e) => this.rotatePiece(i, 'left'));
                    piece.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        this.rotatePiece(i, 'right');
                    });
                    
                    this.pieces.push({
                        element: piece,
                        img: img,
                        currentRotation: randomRotation,
                        correctRotation: 0,
                        locked: false
                    });
                }
            },

            rotatePiece(index, direction) {
                const piece = this.pieces[index];
                
                if (piece.locked) return;
                
                if (direction === 'left') {
                    piece.currentRotation = (piece.currentRotation - 90 + 360) % 360;
                } else {
                    piece.currentRotation = (piece.currentRotation + 90) % 360;
                }
                
                piece.img.style.transform = `rotate(${piece.currentRotation}deg)`;
                
                // Verificar si está correcto
                if (piece.currentRotation === piece.correctRotation) {
                    piece.element.classList.add('correct');
                } else {
                    piece.element.classList.remove('correct');
                }
                
                // Verificar si ganó
                setTimeout(() => this.checkWin(), 600);
            },

            checkWin() {
                const allCorrect = this.pieces.every(p => p.currentRotation === p.correctRotation);
                
                if (allCorrect) {
                    this.stopTimer();
                    this.winLevel();
                }
            },

            winLevel() {
                // Quitar filtros
                this.pieces.forEach(p => {
                    p.img.style.filter = 'none';
                });

                setTimeout(() => {
                    this.showScreen('win');
                    document.getElementById('winLevel').textContent = this.currentLevel;
                    document.getElementById('winTime').textContent = this.formatTime(this.timerSeconds);
                    document.getElementById('winImage').src = this.currentImage;
                    document.getElementById('winImage').style.filter = 'none';
                }, 1000);
            },

            nextLevel() {
                if (this.currentLevel < this.maxLevel) {
                    this.currentLevel++;
                    this.loadLevel();
                } else {
                    alert('🎊 ¡Felicitaciones! Has completado todos los niveles');
                    this.backToMenu();
                }
            },

            useHelp() {
                if (this.helpUsed) {
                    alert('Ya has usado la ayuda en este nivel');
                    return;
                }

                // Buscar una pieza incorrecta
                const incorrectPiece = this.pieces.find(p => !p.locked && p.currentRotation !== p.correctRotation);
                
                if (!incorrectPiece) {
                    alert('¡Todas las piezas ya están correctas!');
                    return;
                }

                // Bloquear pieza y rotarla correctamente
                incorrectPiece.currentRotation = incorrectPiece.correctRotation;
                incorrectPiece.img.style.transform = `rotate(${incorrectPiece.correctRotation}deg)`;
                incorrectPiece.element.classList.add('locked', 'correct');
                incorrectPiece.locked = true;

                // Agregar penalización
                this.penaltySeconds = 5;
                this.timerSeconds += 5;
                this.helpUsed = true;
                
                document.getElementById('penalty').textContent = '(+5 seg)';
                document.getElementById('penalty').style.display = 'inline';

                alert('💡 Una pieza ha sido resuelta (+5 segundos de penalización)');
            },

            startTimer() {
                this.stopTimer();
                this.timerInterval = setInterval(() => {
                    this.timerSeconds++;
                    document.getElementById('timerDisplay').textContent = this.formatTime(this.timerSeconds);
                }, 1000);
            },

            stopTimer() {
                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                }
            },

            formatTime(seconds) {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            },

            showScreen(screen) {
                document.querySelectorAll('.menu-screen, .game-screen, .win-screen').forEach(s => {
                    s.classList.remove('active');
                });
                document.querySelector(`.${screen}-screen`).classList.add('active');
            },

            backToMenu() {
                this.stopTimer();
                this.showScreen('menu');
            },

            showInstructions() {
                alert('📖 INSTRUCCIONES DETALLADAS\n\n' +
                      '🎯 OBJETIVO:\n' +
                      'Rotar todas las piezas de la imagen hasta que estén en la posición correcta.\n\n' +
                      '🖱️ CONTROLES:\n' +
                      '• Click Izquierdo: Rotar pieza 90° a la izquierda\n' +
                      '• Click Derecho: Rotar pieza 90° a la derecha\n\n' +
                      '🎨 FILTROS:\n' +
                      'Cada nivel tiene un filtro diferente:\n' +
                      '• Nivel 1: Escala de grises\n' +
                      '• Nivel 2: Brillo reducido (30%)\n' +
                      '• Nivel 3: Colores invertidos\n\n' +
                      '💡 AYUDITA:\n' +
                      'Si necesitas ayuda, puedes usar el botón "Ayudita" para resolver automáticamente una pieza. Esto agregará 5 segundos a tu tiempo.\n\n' +
                      '⏱️ TIEMPO:\n' +
                      'Tu tiempo se registra para cada nivel. ¡Intenta completar cada nivel lo más rápido posible!\n\n' +
                      '¡Buena suerte! 🍀');
            }
        };