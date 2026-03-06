// =============================================================================
// engine.js - Core Game Engine for Super Mario Bros Fan Game
// =============================================================================

// ---------------------
// Constants & Config
// ---------------------
const TILE_SIZE = 32;
const GRAVITY = 0.5;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TERMINAL_VELOCITY = 10;

const GameState = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    GAMEOVER: 'GAMEOVER',
    WIN: 'WIN'
};

// ---------------------
// Camera System
// ---------------------
class Camera {
    constructor(levelWidth) {
        this.x = 0;
        this.y = 0;
        this.levelWidth = levelWidth || CANVAS_WIDTH;
    }

    update(playerX, playerY) {
        const targetX = playerX - CANVAS_WIDTH / 2;
        this.x += (targetX - this.x) * 0.1;
        if (this.x < 0) this.x = 0;
        const maxX = this.levelWidth - CANVAS_WIDTH;
        if (maxX > 0 && this.x > maxX) this.x = maxX;
        else if (maxX <= 0) this.x = 0;
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(-Math.round(this.x), -Math.round(this.y));
    }

    restore(ctx) {
        ctx.restore();
    }
}

// ---------------------
// Physics System
// ---------------------
const Physics = {

    applyGravity(entity) {
        entity.vy += GRAVITY;
        if (entity.vy > TERMINAL_VELOCITY) entity.vy = TERMINAL_VELOCITY;
    },

    checkTileCollision(entity, level) {
        const collision = { top: false, bottom: false, left: false, right: false };
        if (!level || !level.grid) return collision;

        const grid = level.grid;
        const rows = grid.length;
        const cols = rows > 0 ? grid[0].length : 0;

        // Horizontal movement & collision
        entity.x += entity.vx;
        let leftCol = Math.floor(entity.x / TILE_SIZE);
        let rightCol = Math.floor((entity.x + entity.width - 1) / TILE_SIZE);
        let topRow = Math.floor(entity.y / TILE_SIZE);
        let bottomRow = Math.floor((entity.y + entity.height - 1) / TILE_SIZE);

        for (let row = topRow; row <= bottomRow; row++) {
            for (let col = leftCol; col <= rightCol; col++) {
                if (row < 0 || row >= rows || col < 0 || col >= cols) continue;
                if (grid[row][col] > 0) {
                    if (entity.vx > 0) {
                        entity.x = col * TILE_SIZE - entity.width;
                        entity.vx = 0;
                        collision.right = true;
                    } else if (entity.vx < 0) {
                        entity.x = (col + 1) * TILE_SIZE;
                        entity.vx = 0;
                        collision.left = true;
                    }
                }
            }
        }

        // Vertical movement & collision
        entity.y += entity.vy;
        leftCol = Math.floor(entity.x / TILE_SIZE);
        rightCol = Math.floor((entity.x + entity.width - 1) / TILE_SIZE);
        topRow = Math.floor(entity.y / TILE_SIZE);
        bottomRow = Math.floor((entity.y + entity.height - 1) / TILE_SIZE);

        for (let row = topRow; row <= bottomRow; row++) {
            for (let col = leftCol; col <= rightCol; col++) {
                if (row < 0 || row >= rows || col < 0 || col >= cols) continue;
                if (grid[row][col] > 0) {
                    if (entity.vy > 0) {
                        entity.y = row * TILE_SIZE - entity.height;
                        entity.vy = 0;
                        collision.bottom = true;
                    } else if (entity.vy < 0) {
                        entity.y = (row + 1) * TILE_SIZE;
                        entity.vy = 0;
                        collision.top = true;
                        collision.tileX = col;
                        collision.tileY = row;
                    }
                }
            }
        }

        return collision;
    },

    checkAABB(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }
};

// ---------------------
// Game Timer
// ---------------------
class GameTimer {
    constructor() {
        this.time = 300;
        this.accumulator = 0;
        this.running = false;
    }

    reset() {
        this.time = 300;
        this.accumulator = 0;
        this.running = false;
    }

    start() { this.running = true; }
    stop() { this.running = false; }

    update(deltaTime) {
        if (!this.running) return false;
        this.accumulator += deltaTime;
        while (this.accumulator >= 1000) {
            this.accumulator -= 1000;
            this.time--;
            if (this.time <= 0) {
                this.time = 0;
                this.running = false;
                return true;
            }
        }
        return false;
    }
}

// ---------------------
// HUD Update
// ---------------------
function updateHUD(score, coins, time, lives) {
    const scoreEl = document.getElementById('hud-score');
    const coinsEl = document.getElementById('hud-coins');
    const timeEl = document.getElementById('hud-time');
    const livesEl = document.getElementById('hud-lives');

    if (scoreEl) scoreEl.textContent = String(score).padStart(6, '0');
    if (coinsEl) coinsEl.textContent = String(coins).padStart(2, '0');
    if (timeEl) timeEl.textContent = String(time).padStart(3, '0');
    if (livesEl) livesEl.textContent = String(lives);
}

// ---------------------
// Export as globals
// ---------------------
window.Camera = Camera;
window.Physics = Physics;
window.GameTimer = GameTimer;
window.TILE_SIZE = TILE_SIZE;
window.GRAVITY = GRAVITY;
window.CANVAS_WIDTH = CANVAS_WIDTH;
window.CANVAS_HEIGHT = CANVAS_HEIGHT;
window.TERMINAL_VELOCITY = TERMINAL_VELOCITY;
window.GameState = GameState;
window.updateHUD = updateHUD;
