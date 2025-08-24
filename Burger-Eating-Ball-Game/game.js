document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const gameBoard = document.getElementById('game-board'), player = document.getElementById('player'),
          levelDisplay = document.getElementById('level-display'), highScoreDisplay = document.getElementById('high-score-display'),
          livesDisplay = document.getElementById('lives-display'), gameOverScreen = document.getElementById('game-over-screen'),
          restartButton = document.getElementById('restart-button'), shieldTimerDisplay = document.getElementById('shield-timer-display'),
          tipBar = document.getElementById('tip-bar');

    // --- Game Constants & State ---
    const boardWidth = 800, boardHeight = 600, playerSize = 25, playerSpeed = 6, maxLives = 5;
    let currentLevel = 1, playerLives = 3, highScore = localStorage.getItem('burgerHighScore') || 1;
    let playerPos = { x: 10, y: 10 }, dynamicObstacles = [];
    let gameLoopInterval = null, isInvincible = false, isShielded = false, shieldTimer = 0, shieldInterval = null, tipTimeout = null;
    const keysPressed = { w: false, a: false, s: false, d: false };

    const tips = [
        "Remember: Only plain burgers 🍔 are required to finish the level.",
        "A well-timed Shield Burger can get you through a tight spot!",
        "Don't be afraid to leave a healer burger if you're at full health.",
        "The greatest glory is not in never falling, but in rising every time you fall.",
        "Plan your path! Sometimes the longest route is the safest.",
        "Stay focused. The burger is your destiny!",
        "Watch the patterns of the moving blocks before you make your move.",
        "It's not whether you get knocked down; it's whether you get up.",
        "Use the shield to grab a burger that looks impossible to reach!",
        "Aim for victory, but enjoy the chase!"
    ];

    // --- Event Listeners ---
    window.addEventListener('keydown', (e) => { if (keysPressed.hasOwnProperty(e.key.toLowerCase())) keysPressed[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', (e) => { if (keysPressed.hasOwnProperty(e.key.toLowerCase())) keysPressed[e.key.toLowerCase()] = false; });
    restartButton.addEventListener('click', restartGame);

    // --- Core Game Flow ---
    function startGame() {
        deactivateShield();
        resetPlayer();
        generateLevel(currentLevel);
        updateUI();
        showTip(); // Show a new tip at the start of the level
        clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameLoop, 1000 / 60);
    }

    function gameLoop() {
        updatePlayerPosition();
        updateDynamicObstacles();
    }

    // --- Level Generation (Broken into smaller, cleaner functions) ---
    function generateLevel(levelNumber) {
        gameBoard.innerHTML = '';
        gameBoard.appendChild(player);
        gameBoard.appendChild(gameOverScreen);
        gameBoard.appendChild(tipBar); // Re-add tip bar
        dynamicObstacles = [];

        const foodData = generateFoodData(levelNumber);
        const wallData = generateWallData(levelNumber, foodData, playerPos);

        validateAndDraw(foodData, wallData);
        generateDynamicObstacles(levelNumber);
    }

    function generateFoodData(levelNumber) {
        const foodItems = [];
        if (levelNumber >= 2) foodItems.push({ type: 'shield' });
        const remainingBurgers = levelNumber - foodItems.length;
        for (let i = 0; i < remainingBurgers; i++) {
            foodItems.push({ type: Math.random() < 0.25 ? 'healer' : 'normal' });
        }
        foodItems.forEach(food => {
            food.x = Math.floor(Math.random() * (boardWidth - 200)) + 100;
            food.y = Math.floor(Math.random() * (boardHeight - 200)) + 100;
        });
        return foodItems;
    }

    function generateWallData(levelNumber, foodData, startPos) {
        const walls = [];
        let lastPos = { x: startPos.x, y: startPos.y };
        const wallPlacementFuzz = Math.min(50 + levelNumber * 2.5, 200);
        const wallSizeVariance = levelNumber * 1.5;
        const blocksPerPath = 1 + Math.floor(levelNumber / 8);

        foodData.forEach(food => {
            for (let i = 0; i < blocksPerPath; i++) {
                const wall = {};
                const pathProgress = (i + 1) / (blocksPerPath + 1);
                const pathX = lastPos.x + (food.x - lastPos.x) * pathProgress;
                const pathY = lastPos.y + (food.y - lastPos.y) * pathProgress;
                const isVerticalWall = Math.abs(food.x - lastPos.x) > Math.abs(food.y - lastPos.y);
                if (isVerticalWall) {
                    wall.w = 20; wall.h = 80 + Math.random() * wallSizeVariance;
                    wall.x = pathX; wall.y = pathY - wall.h / 2 + (Math.random() - 0.5) * wallPlacementFuzz;
                } else {
                    wall.w = 80 + Math.random() * wallSizeVariance; wall.h = 20;
                    wall.x = pathX - wall.w / 2 + (Math.random() - 0.5) * wallPlacementFuzz;
                    wall.y = pathY;
                }
                wall.x = Math.max(0, Math.min(boardWidth - wall.w, wall.x));
                wall.y = Math.max(0, Math.min(boardHeight - wall.h, wall.y));
                if (Math.hypot(wall.x - lastPos.x, wall.y - lastPos.y) < 50 || Math.hypot(wall.x - food.x, wall.y - food.y) < 50) continue;
                walls.push(wall);
            }
            lastPos = { x: food.x, y: food.y };
        });
        return walls;
    }

    function validateAndDraw(foodData, wallData) {
        foodData.forEach(food => {
            let isOverlappingWall, attempts = 0;
            do {
                isOverlappingWall = false;
                const foodRect = { left: food.x, top: food.y, right: food.x + 35, bottom: food.y + 35 };
                for (const wall of wallData) {
                    const wallRect = { left: wall.x, top: wall.y, right: wall.x + wall.w, bottom: wall.y + wall.h };
                    if (isOverlapping(foodRect, wallRect)) {
                        isOverlappingWall = true;
                        food.x = Math.floor(Math.random() * (boardWidth - 150)) + 75;
                        food.y = Math.floor(Math.random() * (boardHeight - 150)) + 75;
                        break;
                    }
                }
                attempts++;
            } while (isOverlappingWall && attempts < 100);
        });
        wallData.forEach(wall => createDiv(['obstacle'], wall));
        foodData.forEach(food => {
            const foodEl = createDiv(['food'], food);
            foodEl.dataset.type = food.type;
            if (food.type === 'shield') foodEl.innerHTML = '🍔🛡️';
            else if (food.type === 'healer') foodEl.innerHTML = '🍔⭐';
            else foodEl.innerHTML = '🍔';
        });
    }

    function generateDynamicObstacles(levelNumber) {
        if (levelNumber >= 10) { const count = Math.floor((levelNumber - 9) / 3); for (let i = 0; i < count; i++) { const data = { x: 50, y: 50 + Math.random() * (boardHeight - 100), w: 60, h: 30 }; dynamicObstacles.push({ el: createDiv(['hazard', 'mover'], data), dx: 2 + levelNumber / 10, dy: 0, type: 'mover' }); } }
        if (levelNumber >= 15) { const count = Math.floor((levelNumber - 14) / 3); for (let i = 0; i < count; i++) { const data = { x: 50 + Math.random() * (boardWidth - 100), y: 50, w: 30, h: 60 }; dynamicObstacles.push({ el: createDiv(['hazard', 'mover'], data), dx: 0, dy: 2 + levelNumber / 10, type: 'mover' }); } }
        if (levelNumber >= 20) { const count = Math.floor((levelNumber - 19) / 4); for (let i = 0; i < count; i++) { const size = 50 + Math.random() * 20; const data = { x: 100 + Math.random() * (boardWidth - 200), y: 100 + Math.random() * (boardHeight - 200), w: size, h: size }; dynamicObstacles.push({ el: createDiv(['hazard', 'spinner'], data), type: 'spinner' }); } }
    }

    // --- Tip Bar Logic (FIXED) ---
    function showTip() {
        clearTimeout(tipTimeout);
        tipBar.classList.remove('show'); // Reset animation state
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        tipBar.textContent = randomTip;

        // This tiny delay ensures the browser registers the 'hidden' state before animating to 'show'
        setTimeout(() => {
            tipBar.classList.add('show');
        }, 100);

        tipTimeout = setTimeout(() => {
            tipBar.classList.remove('show');
        }, 4000); // Tip stays for 4 seconds
    }

    // --- Player & Game State Functions ---
    function updatePlayerPosition() { let dx = 0, dy = 0; if (keysPressed.w) dy -= 1; if (keysPressed.s) dy += 1; if (keysPressed.a) dx -= 1; if (keysPressed.d) dx += 1; if (dx === 0 && dy === 0) return; if (dx !== 0 && dy !== 0) { dx *= playerSpeed / 1.414; dy *= playerSpeed / 1.414; } else { dx *= playerSpeed; dy *= playerSpeed; } playerPos.x += dx; playerPos.y += dy; playerPos.x = Math.max(0, Math.min(boardWidth - playerSize, playerPos.x)); playerPos.y = Math.max(0, Math.min(boardHeight - playerSize, playerPos.y)); player.style.left = playerPos.x + 'px'; player.style.top = playerPos.y + 'px'; checkCollisions(); }
    function updateDynamicObstacles() { dynamicObstacles.forEach(obs => { if (obs.type === 'mover') { let newX = obs.el.offsetLeft + obs.dx; let newY = obs.el.offsetTop + obs.dy; if (newX <= 0 || newX + obs.el.offsetWidth >= boardWidth) obs.dx *= -1; if (newY <= 0 || newY + obs.el.offsetHeight >= boardHeight) obs.dy *= -1; obs.el.style.left = newX + 'px'; obs.el.style.top = newY + 'px'; } }); }
    function checkCollisions() { const playerRect = player.getBoundingClientRect(); for (const food of document.querySelectorAll('.food')) { if (isOverlapping(playerRect, food.getBoundingClientRect())) { const foodType = food.dataset.type; if (foodType === 'shield') activateShield(); if (foodType === 'healer') { if (playerLives < maxLives) playerLives++; updateUI(); } food.remove(); checkWinCondition(); return; } } if (isInvincible || isShielded) return; for (const obstacle of document.querySelectorAll('.obstacle, .hazard')) { if (isOverlapping(playerRect, obstacle.getBoundingClientRect())) { loseLife(); return; } } }
    function checkWinCondition() { const requiredBurgers = document.querySelectorAll('.food[data-type="normal"]'); if (requiredBurgers.length === 0) { currentLevel++; if (currentLevel > highScore) { highScore = currentLevel; localStorage.setItem('burgerHighScore', highScore); } startGame(); } }
    function activateShield() { if (isShielded) { shieldTimer = 5; return; } isShielded = true; shieldTimer = 5; player.classList.add('shielded'); shieldTimerDisplay.style.display = 'inline'; shieldInterval = setInterval(() => { shieldTimer--; shieldTimerDisplay.textContent = `Shield: ${shieldTimer}s`; if (shieldTimer <= 0) deactivateShield(); }, 1000); }
    function deactivateShield() { clearInterval(shieldInterval); isShielded = false; shieldTimer = 0; player.classList.remove('shielded'); shieldTimerDisplay.style.display = 'none'; }
    function loseLife() { if (isInvincible || isShielded) return; playerLives--; updateUI(); isInvincible = true; player.classList.add('invincible'); setTimeout(() => { isInvincible = false; player.classList.remove('invincible'); }, 1000); if (playerLives <= 0) { clearInterval(gameLoopInterval); gameOverScreen.style.display = 'flex'; } else { resetPlayer(); } }
    function restartGame() { deactivateShield(); gameOverScreen.style.display = 'none'; currentLevel = 1; playerLives = 3; startGame(); }
    function isOverlapping(rect1, rect2) { return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom); }
    function resetPlayer() { playerPos = { x: 10, y: 10 }; player.style.left = playerPos.x + 'px'; player.style.top = playerPos.y + 'px'; }
    function updateUI() { levelDisplay.textContent = `Level ${currentLevel}`; highScoreDisplay.textContent = `Best: Level ${highScore}`; livesDisplay.textContent = `Lives: ${"❤️".repeat(playerLives)}`; }
    function createDiv(classes, data) { const el = document.createElement('div'); classes.forEach(c => el.classList.add(c)); el.style.left = data.x + 'px'; el.style.top = data.y + 'px'; if (data.w) el.style.width = data.w + 'px'; if (data.h) el.style.height = data.h + 'px'; gameBoard.appendChild(el); return el; }

    // --- Start the game ---
    startGame();
});