document.addEventListener('DOMContentLoaded', () => {
    // Game state
    let speed = 0;
    let carPosition = 0;
    let carVelocityX = 0;
    let isTurningLeft = false;
    let isTurningRight = false;
    let isW_Pressed = false;
    let w_pressTimeout = null;

    const road = document.getElementById('road-lines');
    const playerCar = document.getElementById('player-car');
    const treesContainer = document.getElementById('trees');
    const roadSurface = document.getElementById('road-surface');


    // Create trees
    for (let i = 0; i < 10; i++) {
        createTree();
    }

    function createTree() {
        const tree = document.createElement('div');
        tree.className = 'tree';
        tree.style.left = `${Math.random() * 100}vw`;
        tree.style.animationDuration = `${Math.random() * 5 + 5}s`; // Random duration
        treesContainer.appendChild(tree);

        // Reset tree position when it goes off-screen
        tree.addEventListener('animationiteration', () => {
            tree.style.left = `${Math.random() * 100}vw`;
            tree.style.animationDuration = `${Math.random() * 5 + 5}s`;
        });
    }

    // Game loop
    function gameLoop() {
        // Animate road lines
        let currentBgPos = parseInt(window.getComputedStyle(road).backgroundPositionY);
        road.style.backgroundPositionY = (currentBgPos + speed) + 'px';
        
        // Update car velocity based on turning
        if (isTurningLeft) {
            carVelocityX = Math.max(carVelocityX - 0.5, -8);
        } else if (isTurningRight) {
            carVelocityX = Math.min(carVelocityX + 0.5, 8);
        } else {
            // Apply friction
            carVelocityX *= 0.95;
        }

        // Update car position
        carPosition += carVelocityX;
        
        // Dynamic clamping based on road width
        const roadWidth = roadSurface.offsetWidth;
        const carWidth = playerCar.offsetWidth;
        const maxPosition = (roadWidth / 2) - (carWidth / 2);
        carPosition = Math.max(-maxPosition, Math.min(maxPosition, carPosition));

        // Move car left/right
        playerCar.style.left = `calc(50% + ${carPosition}px)`;
        
        // Adjust animation speed of trees based on car speed
        document.querySelectorAll('.tree').forEach(tree => {
            tree.style.animationPlayState = speed > 0 ? 'running' : 'paused';
        });

        requestAnimationFrame(gameLoop);
    }

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'w':
            case 'ArrowUp':
                if (!isW_Pressed) {
                    isW_Pressed = true;
                    w_pressTimeout = setTimeout(() => {
                        isW_Pressed = false; // Reset after some time if not double-tapped
                    }, 300);
                } else {
                    // Double tap W
                    clearTimeout(w_pressTimeout);
                    isW_Pressed = false;
                    speed = 20; // Lock speed
                }
                speed = Math.min(speed + 1, 20);
                break;
            case 's':
            case 'ArrowDown':
                speed = Math.max(speed - 1, 0);
                break;
            case 'a':
            case 'ArrowLeft':
                isTurningLeft = true;
                break;
            case 'd':
            case 'ArrowRight':
                isTurningRight = true;
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch(e.key) {
            case 'a':
            case 'ArrowLeft':
                isTurningLeft = false;
                break;
            case 'd':
            case 'ArrowRight':
                isTurningRight = false;
                break;
        }
    });

    // Load selected car
    const selectedCarType = localStorage.getItem('selectedCar') || 'normal';
    playerCar.classList.add(selectedCarType + '-car');

    // Start game loop
    gameLoop();
});
