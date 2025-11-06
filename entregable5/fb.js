// Variables del juego
        const gameContainer = document.getElementById('gameContainer');
        const bird = document.getElementById('bird');
        const scoreElement = document.getElementById('score');
        const coinsElement = document.getElementById('coins');
        const gameOverScreen = document.getElementById('gameOver');
        const instructions = document.getElementById('instructions');
        const shieldIndicator = document.getElementById('shield-indicator');

        let gameStarted = false;
        let gameActive = false;
        let birdY = 250;
        let birdVelocity = 0;
        let gravity = 0.5;
        let jumpForce = -10;
        let score = 0;
        let coins = 0;
        let hasShield = false;
        let shieldTimer = null;

        let pipes = [];
        let coinObjects = [];
        let powerups = [];
        let clouds = [];

        let pipeInterval;
        let coinInterval;
        let powerupInterval;
        let cloudInterval;
        let gameLoop;

        

        // Crear nubes animadas
        function createCloud() {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            cloud.style.left = '1200px';
            cloud.style.top = Math.random() * 200 + 'px';
            gameContainer.appendChild(cloud);
            clouds.push(cloud);
        }

        // Crear tubería
        function createPipe() {
            const gap = 180;
            const minHeight = 100;
            const maxHeight = 350;
            const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

            const pipeTop = document.createElement('div');
            pipeTop.className = 'pipe';
            pipeTop.style.left = '1200px';
            pipeTop.innerHTML = `
                <div class="pipe-cap"></div>
                <div class="pipe-top" style="height: ${topHeight}px;"></div>
            `;
            pipeTop.style.top = '0';

            const pipeBottom = document.createElement('div');
            pipeBottom.className = 'pipe';
            pipeBottom.style.left = '1200px';
            pipeBottom.innerHTML = `
                <div class="pipe-bottom" style="height: ${600 - topHeight - gap}px;"></div>
                <div class="pipe-cap"></div>
            `;
            pipeBottom.style.bottom = '0';

            gameContainer.appendChild(pipeTop);
            gameContainer.appendChild(pipeBottom);

            pipes.push({
                top: pipeTop,
                bottom: pipeBottom,
                x: 1200,
                scored: false,
                topHeight: topHeight,
                gap: gap
            });
        }

        // Crear moneda
        function createCoin() {
            const coin = document.createElement('div');
            coin.className = 'coin';
            coin.style.left = '1200px';
            coin.style.top = Math.random() * 400 + 100 + 'px';
            gameContainer.appendChild(coin);
            coinObjects.push({ element: coin, x: 1200 });
        }

        // Crear power-up de escudo
        function createPowerup() {
            const powerup = document.createElement('div');
            powerup.className = 'powerup';
            powerup.innerHTML = '<div class="shield-icon"></div>';
            powerup.style.left = '1200px';
            powerup.style.top = Math.random() * 400 + 100 + 'px';
            gameContainer.appendChild(powerup);
            powerups.push({ element: powerup, x: 1200 });
        }

        // Saltar
        function jump() {
            if (!gameActive) return;
            birdVelocity = jumpForce;
            bird.classList.add('bird-boost');
            setTimeout(() => bird.classList.remove('bird-boost'), 300);
        }

        // Activar escudo
        function activateShield() {
            hasShield = true;
            shieldIndicator.style.display = 'block';
            if (shieldTimer) clearTimeout(shieldTimer);
            shieldTimer = setTimeout(() => {
                hasShield = false;
                shieldIndicator.style.display = 'none';
            }, 5000);
        }

        // Detectar colisión
        function checkCollision(pipe) {
            const birdRect = bird.getBoundingClientRect();
            const containerRect = gameContainer.getBoundingClientRect();
            
            const birdLeft = birdRect.left - containerRect.left;
            const birdRight = birdLeft + birdRect.width;
            const birdTop = birdRect.top - containerRect.top;
            const birdBottom = birdTop + birdRect.height;

            const pipeLeft = pipe.x;
            const pipeRight = pipe.x + 80;

            if (birdRight > pipeLeft && birdLeft < pipeRight) {
                if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + pipe.gap) {
                    return true;
                }
            }
            return false;
        }

        // Game Over
        function endGame() {
            gameActive = false;
            gameContainer.classList.add('paused');
            
            bird.classList.add('bird-explode');
            
            clearInterval(pipeInterval);
            clearInterval(coinInterval);
            clearInterval(powerupInterval);
            clearInterval(cloudInterval);
            cancelAnimationFrame(gameLoop);

            setTimeout(() => {
                document.getElementById('finalScore').textContent = score;
                document.getElementById('finalCoins').textContent = coins;
                gameOverScreen.style.display = 'block';
            }, 500);
        }

        // Update del juego
        function update() {
            if (!gameActive) return;

            // Física del pájaro
            birdVelocity += gravity;
            birdY += birdVelocity;
            bird.style.top = birdY + 'px';

            // Rotación del pájaro según velocidad
            const rotation = Math.min(Math.max(birdVelocity * 3, -30), 90);
            bird.style.transform = `rotate(${rotation}deg)`;

            // Colisión con bordes
            if (birdY < 0 || birdY > 550) {
                endGame();
                return;
            }

            // Actualizar tuberías
            for (let i = pipes.length - 1; i >= 0; i--) {
                const pipe = pipes[i];
                pipe.x -= 3;
                pipe.top.style.left = pipe.x + 'px';
                pipe.bottom.style.left = pipe.x + 'px';

                // Colisión con tuberías
                if (checkCollision(pipe)) {
                    if (hasShield) {
                        // El escudo protege de la colisión
                        hasShield = false;
                        shieldIndicator.style.display = 'none';
                        // Remover la tubería
                        pipe.top.remove();
                        pipe.bottom.remove();
                        pipes.splice(i, 1);
                        score += 5; // Bonus por destruir tubería
                    } else {
                        endGame();
                        return;
                    }
                }

                // Puntuación al pasar tubería
                if (!pipe.scored && pipe.x < 150) {
                    pipe.scored = true;
                    score++;
                    scoreElement.textContent = score;
                }

                // Remover tuberías fuera de pantalla
                if (pipe.x < -100) {
                    pipe.top.remove();
                    pipe.bottom.remove();
                    pipes.splice(i, 1);
                }
            }

            // Actualizar monedas
            for (let i = coinObjects.length - 1; i >= 0; i--) {
                const coin = coinObjects[i];
                coin.x -= 4;
                coin.element.style.left = coin.x + 'px';

                // Colisión con monedas
                const coinRect = coin.element.getBoundingClientRect();
                const birdRect = bird.getBoundingClientRect();
                if (
                    birdRect.left < coinRect.right &&
                    birdRect.right > coinRect.left &&
                    birdRect.top < coinRect.bottom &&
                    birdRect.bottom > coinRect.top
                ) {
                    coins++;
                    score += 2;
                    coinsElement.textContent = coins;
                    scoreElement.textContent = score;
                    coin.element.remove();
                    coinObjects.splice(i, 1);
                }

                if (coin.x < -50) {
                    coin.element.remove();
                    coinObjects.splice(i, 1);
                }
            }

            // Actualizar power-ups
            for (let i = powerups.length - 1; i >= 0; i--) {
                const powerup = powerups[i];
                powerup.x -= 4;
                powerup.element.style.left = powerup.x + 'px';

                // Colisión con power-ups
                const powerupRect = powerup.element.getBoundingClientRect();
                const birdRect = bird.getBoundingClientRect();
                if (
                    birdRect.left < powerupRect.right &&
                    birdRect.right > powerupRect.left &&
                    birdRect.top < powerupRect.bottom &&
                    birdRect.bottom > powerupRect.top
                ) {
                    activateShield();
                    powerup.element.remove();
                    powerups.splice(i, 1);
                }

                if (powerup.x < -50) {
                    powerup.element.remove();
                    powerups.splice(i, 1);
                }
            }

            // Actualizar nubes
            for (let i = clouds.length - 1; i >= 0; i--) {
                const cloud = clouds[i];
                const currentLeft = parseInt(cloud.style.left);
                const newLeft = currentLeft - 2;
                cloud.style.left = newLeft + 'px';

                if (newLeft < -150) {
                    cloud.remove();
                    clouds.splice(i, 1);
                }
            }

            gameLoop = requestAnimationFrame(update);
        }

        // Iniciar juego
        function startGame() {
            gameStarted = true;
            gameActive = true;
            instructions.style.display = 'none';
            gameContainer.classList.remove('paused');

            birdY = 250;
            birdVelocity = 0;
            score = 0;
            coins = 0;
            hasShield = false;
            scoreElement.textContent = score;
            coinsElement.textContent = coins;
            shieldIndicator.style.display = 'none';

            // Limpiar elementos anteriores
            pipes.forEach(pipe => {
                pipe.top.remove();
                pipe.bottom.remove();
            });
            coinObjects.forEach(coin => coin.element.remove());
            powerups.forEach(powerup => powerup.element.remove());
            clouds.forEach(cloud => cloud.remove());

            pipes = [];
            coinObjects = [];
            powerups = [];
            clouds = [];

            bird.classList.remove('bird-explode');
            bird.style.transform = 'rotate(0deg)';

            // Crear elementos periódicamente
            pipeInterval = setInterval(createPipe, 2600);
            coinInterval = setInterval(createCoin, 3000);
            powerupInterval = setInterval(createPowerup, 8000);
            cloudInterval = setInterval(createCloud, 5000);

            // Crear algunos elementos iniciales
            setTimeout(createPipe, 1500);
            setTimeout(createCoin, 2500);
            setTimeout(createCloud, 1000);

            update();
        }

        // Reiniciar juego
        function restartGame() {
            gameOverScreen.style.display = 'none';
            startGame();
        }

        // Event listeners
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                jump();
            }
        });

        gameContainer.addEventListener('click', jump);

        document.getElementById('startBtn').addEventListener('click', startGame);
        document.getElementById('restartBtn').addEventListener('click', restartGame);