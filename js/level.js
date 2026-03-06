// ============================================================
// level.js - Level Design & Objects for Super Mario Bros 1-1
// ============================================================

// Tile type constants
const TILES = {
    EMPTY: 0,
    GROUND: 1,
    BRICK: 2,
    QUESTION: 3,
    HARD: 4,
    PIPE_TOP_LEFT: 5,
    PIPE_TOP_RIGHT: 6,
    PIPE_BODY_LEFT: 7,
    PIPE_BODY_RIGHT: 8,
    FLAGPOLE: 9
};

// ============================================================
// Enemy class
// ============================================================
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type || 'goomba';
        this.vx = -1.5;
        this.vy = 0;
        this.alive = true;
        this.active = false;
        this.removeTimer = -1;

        if (this.type === 'goomba') {
            this.width = 28;
            this.height = 28;
        } else if (this.type === 'koopa') {
            this.width = 28;
            this.height = 38;
            this.isShell = false;
        }

        this.grounded = false;
        this.direction = -1; // -1 = left, 1 = right
    }

    stomp() {
        if (this.type === 'goomba') {
            this.alive = false;
            this.removeTimer = 30; // frames until removed
        } else if (this.type === 'koopa') {
            if (!this.isShell) {
                // Become a shell
                this.isShell = true;
                this.height = 28;
                this.vx = 0;
            } else {
                // Shell is kicked
                if (this.vx === 0) {
                    // Kick the shell in the direction the player is facing
                    this.vx = 8; // default right, caller should set direction
                } else {
                    // Stop the shell
                    this.vx = 0;
                }
            }
        }
    }

    kickShell(direction) {
        if (this.type === 'koopa' && this.isShell) {
            this.vx = direction * 8;
        }
    }

    update(level) {
        if (!this.alive) {
            if (this.removeTimer > 0) {
                this.removeTimer--;
            }
            return;
        }

        // Apply gravity
        this.vy += 0.5;
        if (this.vy > 10) this.vy = 10;

        // Move horizontally
        this.x += this.vx;

        // Check horizontal tile collisions
        this._checkHorizontalCollisions(level);

        // Move vertically
        this.y += this.vy;

        // Check vertical tile collisions
        this._checkVerticalCollisions(level);
    }

    _checkHorizontalCollisions(level) {
        const tileSize = 32;
        const left = Math.floor(this.x / tileSize);
        const right = Math.floor((this.x + this.width - 1) / tileSize);
        const top = Math.floor(this.y / tileSize);
        const bottom = Math.floor((this.y + this.height - 1) / tileSize);

        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                const tile = level.getTile(tx, ty);
                if (tile !== TILES.EMPTY && tile !== TILES.FLAGPOLE) {
                    // Collision - reverse direction
                    if (this.vx > 0) {
                        this.x = tx * tileSize - this.width;
                        this.vx = -Math.abs(this.vx);
                        this.direction = -1;
                    } else if (this.vx < 0) {
                        this.x = (tx + 1) * tileSize;
                        this.vx = Math.abs(this.vx);
                        this.direction = 1;
                    }
                    return;
                }
            }
        }
    }

    _checkVerticalCollisions(level) {
        const tileSize = 32;
        const left = Math.floor(this.x / tileSize);
        const right = Math.floor((this.x + this.width - 1) / tileSize);
        const top = Math.floor(this.y / tileSize);
        const bottom = Math.floor((this.y + this.height - 1) / tileSize);

        this.grounded = false;

        for (let tx = left; tx <= right; tx++) {
            for (let ty = top; ty <= bottom; ty++) {
                const tile = level.getTile(tx, ty);
                if (tile !== TILES.EMPTY && tile !== TILES.FLAGPOLE) {
                    if (this.vy > 0) {
                        // Landing on top
                        this.y = ty * tileSize - this.height;
                        this.vy = 0;
                        this.grounded = true;
                    } else if (this.vy < 0) {
                        // Hit ceiling
                        this.y = (ty + 1) * tileSize;
                        this.vy = 0;
                    }
                    return;
                }
            }
        }

        // Check if over a pit (fell off screen)
        if (this.y > level.grid.length * 32 + 64) {
            this.alive = false;
            this.removeTimer = 0;
        }
    }

    draw(ctx, camera) {
        if (this.removeTimer === 0) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - (camera.y || 0);

        // Skip drawing if off-screen
        if (screenX + this.width < 0 || screenX > (camera.width || 800)) return;

        if (typeof SpriteRenderer !== 'undefined' && SpriteRenderer.drawEnemy) {
            SpriteRenderer.drawEnemy(ctx, this, screenX, screenY);
        } else {
            // Fallback rendering
            if (this.type === 'goomba') {
                if (!this.alive) {
                    // Squished goomba
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(screenX, screenY + this.height - 8, this.width, 8);
                } else {
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(screenX, screenY, this.width, this.height);
                    // Eyes
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(screenX + 5, screenY + 6, 6, 6);
                    ctx.fillRect(screenX + 17, screenY + 6, 6, 6);
                    ctx.fillStyle = '#000';
                    ctx.fillRect(screenX + 7, screenY + 8, 3, 3);
                    ctx.fillRect(screenX + 19, screenY + 8, 3, 3);
                    // Feet
                    ctx.fillStyle = '#654321';
                    ctx.fillRect(screenX + 2, screenY + 22, 10, 6);
                    ctx.fillRect(screenX + 16, screenY + 22, 10, 6);
                }
            } else if (this.type === 'koopa') {
                if (this.isShell) {
                    ctx.fillStyle = '#228B22';
                    ctx.beginPath();
                    ctx.ellipse(screenX + this.width / 2, screenY + this.height / 2,
                        this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#90EE90';
                    ctx.beginPath();
                    ctx.ellipse(screenX + this.width / 2, screenY + this.height / 2,
                        this.width / 3, this.height / 3, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Body
                    ctx.fillStyle = '#228B22';
                    ctx.fillRect(screenX + 4, screenY, 20, 24);
                    // Shell
                    ctx.fillStyle = '#006400';
                    ctx.fillRect(screenX + 2, screenY + 6, 24, 16);
                    // Head
                    ctx.fillStyle = '#90EE90';
                    ctx.fillRect(screenX + 6, screenY - 2, 12, 12);
                    // Eye
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(screenX + 8, screenY + 1, 5, 5);
                    ctx.fillStyle = '#000';
                    ctx.fillRect(screenX + 9, screenY + 2, 3, 3);
                    // Feet
                    ctx.fillStyle = '#FFA500';
                    ctx.fillRect(screenX + 4, screenY + 30, 8, 8);
                    ctx.fillRect(screenX + 16, screenY + 30, 8, 8);
                }
            }
        }
    }
}

// ============================================================
// Item class
// ============================================================
class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'mushroom', 'coin'
        this.alive = true;
        this.vy = 0;
        this.vx = 0;
        this.grounded = false;

        if (this.type === 'mushroom') {
            this.width = 28;
            this.height = 28;
            this.vx = 2;
            this.spawning = true;
            this.spawnY = y;
            this.targetY = y - 32;
        } else if (this.type === 'coin') {
            this.width = 16;
            this.height = 24;
            this.vy = -8;
            this.animTimer = 30;
            this.spawnX = x;
            this.spawnY = y;
        }
    }

    update(level) {
        if (!this.alive) return;

        if (this.type === 'coin') {
            // Coin popup animation
            this.y += this.vy;
            this.vy += 0.5;
            this.animTimer--;
            if (this.animTimer <= 0) {
                this.alive = false;
            }
            return;
        }

        if (this.type === 'mushroom') {
            // Spawn animation - rise from block
            if (this.spawning) {
                this.y -= 1.5;
                if (this.y <= this.targetY) {
                    this.y = this.targetY;
                    this.spawning = false;
                }
                return;
            }

            // Apply gravity
            this.vy += 0.5;
            if (this.vy > 10) this.vy = 10;

            // Move horizontally
            this.x += this.vx;
            this._checkHorizontalCollisions(level);

            // Move vertically
            this.y += this.vy;
            this._checkVerticalCollisions(level);
        }
    }

    _checkHorizontalCollisions(level) {
        const tileSize = 32;
        const left = Math.floor(this.x / tileSize);
        const right = Math.floor((this.x + this.width - 1) / tileSize);
        const top = Math.floor(this.y / tileSize);
        const bottom = Math.floor((this.y + this.height - 1) / tileSize);

        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                const tile = level.getTile(tx, ty);
                if (tile !== TILES.EMPTY && tile !== TILES.FLAGPOLE) {
                    if (this.vx > 0) {
                        this.x = tx * tileSize - this.width;
                        this.vx = -this.vx;
                    } else if (this.vx < 0) {
                        this.x = (tx + 1) * tileSize;
                        this.vx = -this.vx;
                    }
                    return;
                }
            }
        }
    }

    _checkVerticalCollisions(level) {
        const tileSize = 32;
        const left = Math.floor(this.x / tileSize);
        const right = Math.floor((this.x + this.width - 1) / tileSize);
        const top = Math.floor(this.y / tileSize);
        const bottom = Math.floor((this.y + this.height - 1) / tileSize);

        this.grounded = false;

        for (let tx = left; tx <= right; tx++) {
            for (let ty = top; ty <= bottom; ty++) {
                const tile = level.getTile(tx, ty);
                if (tile !== TILES.EMPTY && tile !== TILES.FLAGPOLE) {
                    if (this.vy > 0) {
                        this.y = ty * tileSize - this.height;
                        this.vy = 0;
                        this.grounded = true;
                    } else if (this.vy < 0) {
                        this.y = (ty + 1) * tileSize;
                        this.vy = 0;
                    }
                    return;
                }
            }
        }

        // Fell off screen
        if (this.y > 480 + 64) {
            this.alive = false;
        }
    }

    draw(ctx, camera) {
        if (!this.alive) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - (camera.y || 0);

        if (screenX + this.width < 0 || screenX > (camera.width || 800)) return;

        if (typeof SpriteRenderer !== 'undefined' && SpriteRenderer.drawItem) {
            SpriteRenderer.drawItem(ctx, this, screenX, screenY);
        } else {
            // Fallback rendering
            if (this.type === 'mushroom') {
                // Red mushroom cap
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.ellipse(screenX + this.width / 2, screenY + 8, 14, 10, 0, Math.PI, 0);
                ctx.fill();
                // White dots
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.arc(screenX + 8, screenY + 3, 3, 0, Math.PI * 2);
                ctx.arc(screenX + 20, screenY + 3, 3, 0, Math.PI * 2);
                ctx.fill();
                // Stem
                ctx.fillStyle = '#F5DEB3';
                ctx.fillRect(screenX + 6, screenY + 8, 16, 20);
                // Eyes
                ctx.fillStyle = '#000';
                ctx.fillRect(screenX + 9, screenY + 14, 3, 4);
                ctx.fillRect(screenX + 17, screenY + 14, 3, 4);
            } else if (this.type === 'coin') {
                // Spinning coin
                ctx.fillStyle = '#FFD700';
                const wobble = Math.abs(Math.sin(this.animTimer * 0.3)) * 8;
                ctx.fillRect(screenX + 4 + (8 - wobble) / 2, screenY, wobble, this.height);
                ctx.fillStyle = '#DAA520';
                ctx.fillRect(screenX + 4 + (8 - wobble) / 2 + 1, screenY + 4, Math.max(0, wobble - 2), this.height - 8);
            }
        }
    }
}

// ============================================================
// Level class
// ============================================================
class Level {
    constructor() {
        this.tileSize = 32;
        this.widthInTiles = 210;
        this.heightInTiles = 15;
        this.width = this.widthInTiles * this.tileSize;   // 6720px
        this.height = this.heightInTiles * this.tileSize;  // 480px

        this.grid = [];
        this.entities = [];
        this.blocks = {};        // key: "tx,ty" -> { type: 'coin'|'mushroom', used: false }
        this.coins = [];
        this.items = [];         // active items (mushrooms, popup coins)
        this.playerStart = { x: 3 * 32, y: 13 * 32 - 32 };
        this.flagpolePos = { x: 195 * 32, y: 3 * 32 };

        // Block bump animation tracking
        this.bumpingBlocks = {}; // key: "tx,ty" -> { timer, originalY }

        this._buildGrid();
        this._placeSpecialBlocks();
        this._placeEnemies();
        this._placeCoins();
    }

    // --------------------------------------------------------
    // Grid construction
    // --------------------------------------------------------
    _buildGrid() {
        // Initialize empty grid
        for (let y = 0; y < this.heightInTiles; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.widthInTiles; x++) {
                this.grid[y][x] = TILES.EMPTY;
            }
        }

        // Ground: rows 13 and 14 (bottom two rows)
        // Ground covers most of the level with some gaps
        const groundGaps = [
            [42, 44],    // First pit
            [56, 58],    // Second pit (small)
            [86, 89],    // Third pit
            [122, 125],  // Fourth pit
        ];

        for (let x = 0; x < this.widthInTiles; x++) {
            let isGap = false;
            for (const [start, end] of groundGaps) {
                if (x >= start && x <= end) {
                    isGap = true;
                    break;
                }
            }
            if (!isGap) {
                this.grid[13][x] = TILES.GROUND;
                this.grid[14][x] = TILES.GROUND;
            }
        }

        // --- Question blocks & brick arrangements ---

        // First question block (single, has coin) - tile 16, row 10
        this.grid[10][16] = TILES.QUESTION;

        // Hidden area - question block with mushroom at tile 17
        this.grid[10][17] = TILES.QUESTION;

        // Brick-question-brick row around tiles 20-24, row 10
        this.grid[10][20] = TILES.BRICK;
        this.grid[10][21] = TILES.BRICK;
        this.grid[10][22] = TILES.QUESTION;
        this.grid[10][23] = TILES.BRICK;
        this.grid[10][24] = TILES.BRICK;

        // Upper question block (row 6) above the middle of that row
        this.grid[6][22] = TILES.QUESTION;

        // --- Pipes ---

        // Pipe 1 at tile 28 (2 wide, 2 tall)
        this._placePipe(28, 11, 2); // x=28, top at row 11, 2 tiles tall

        // Pipe 2 at tile 38 (2 wide, 3 tall)
        this._placePipe(38, 10, 3);

        // Pipe 3 at tile 46 (after first gap, 2 wide, 3 tall)
        this._placePipe(46, 10, 3);

        // Pipe 4 at tile 56 - but 56-58 is a gap, so place at 52
        this._placePipe(52, 10, 3);

        // --- More brick and question block sections ---

        // Section around tile 64 - floating bricks
        this.grid[10][64] = TILES.BRICK;
        this.grid[10][65] = TILES.QUESTION;
        this.grid[10][66] = TILES.BRICK;
        this.grid[10][67] = TILES.QUESTION;
        this.grid[10][68] = TILES.BRICK;

        // Elevated platform section around tile 74, row 8
        this.grid[8][74] = TILES.BRICK;
        this.grid[8][75] = TILES.BRICK;
        this.grid[8][76] = TILES.QUESTION;
        this.grid[8][77] = TILES.BRICK;
        this.grid[8][78] = TILES.BRICK;

        // Section around tile 80 - row 10
        this.grid[10][80] = TILES.BRICK;
        this.grid[10][81] = TILES.BRICK;
        this.grid[10][82] = TILES.BRICK;

        // Question blocks around tile 93, row 10
        this.grid[10][93] = TILES.QUESTION;
        this.grid[10][96] = TILES.QUESTION;
        this.grid[6][95] = TILES.QUESTION;

        // Brick rows around tile 100
        for (let x = 100; x <= 107; x++) {
            this.grid[10][x] = TILES.BRICK;
        }

        // Floating bricks at tile 110, row 8
        this.grid[8][110] = TILES.BRICK;
        this.grid[8][111] = TILES.QUESTION;
        this.grid[8][112] = TILES.BRICK;

        // More bricks around tile 118
        this.grid[10][118] = TILES.BRICK;
        this.grid[10][119] = TILES.QUESTION;
        this.grid[10][120] = TILES.BRICK;

        // Pipe after fourth gap at tile 128
        this._placePipe(128, 11, 2);

        // Platform section around 134
        this.grid[10][134] = TILES.BRICK;
        this.grid[10][135] = TILES.BRICK;
        this.grid[10][136] = TILES.QUESTION;
        this.grid[10][137] = TILES.BRICK;

        // Another pipe at 142
        this._placePipe(142, 10, 3);

        // Hard block platforms around 150
        for (let x = 150; x <= 153; x++) {
            this.grid[11][x] = TILES.HARD;
        }
        for (let x = 151; x <= 153; x++) {
            this.grid[10][x] = TILES.HARD;
        }

        // Brick rows at 160
        this.grid[10][160] = TILES.BRICK;
        this.grid[10][161] = TILES.QUESTION;
        this.grid[10][162] = TILES.BRICK;
        this.grid[10][163] = TILES.BRICK;

        // --- Classic staircase section (tiles 170-185) ---

        // Ascending staircase (left side)
        // Step 1: 1 block high
        this._placeStairColumn(170, 1);
        // Step 2: 2 blocks high
        this._placeStairColumn(171, 2);
        // Step 3: 3 blocks high
        this._placeStairColumn(172, 3);
        // Step 4: 4 blocks high (peak)
        this._placeStairColumn(173, 4);

        // Gap at 174

        // Descending/ascending pair (valley and hill)
        // Second staircase going up
        this._placeStairColumn(176, 4);
        this._placeStairColumn(177, 3);
        this._placeStairColumn(178, 2);
        this._placeStairColumn(179, 1);

        // Third staircase (the big one before the flag)
        this._placeStairColumn(181, 1);
        this._placeStairColumn(182, 2);
        this._placeStairColumn(183, 3);
        this._placeStairColumn(184, 4);
        this._placeStairColumn(185, 5);
        this._placeStairColumn(186, 6);
        this._placeStairColumn(187, 7);
        this._placeStairColumn(188, 8);

        // --- Flagpole at tile 195 ---
        // Flagpole: a column of flagpole tiles from row 3 to row 12
        for (let y = 3; y <= 12; y++) {
            this.grid[y][195] = TILES.FLAGPOLE;
        }
        // Hard block base for flagpole
        this.grid[12][195] = TILES.HARD;
    }

    _placePipe(x, topRow, height) {
        // Place pipe top
        this.grid[topRow][x] = TILES.PIPE_TOP_LEFT;
        this.grid[topRow][x + 1] = TILES.PIPE_TOP_RIGHT;

        // Place pipe body
        for (let row = topRow + 1; row < topRow + height; row++) {
            if (row < this.heightInTiles) {
                this.grid[row][x] = TILES.PIPE_BODY_LEFT;
                this.grid[row][x + 1] = TILES.PIPE_BODY_RIGHT;
            }
        }
    }

    _placeStairColumn(x, height) {
        for (let i = 0; i < height; i++) {
            const row = 12 - i;
            if (row >= 0 && row < this.heightInTiles) {
                this.grid[row][x] = TILES.HARD;
            }
        }
    }

    // --------------------------------------------------------
    // Special blocks (question block contents)
    // --------------------------------------------------------
    _placeSpecialBlocks() {
        // Format: "tx,ty" -> { type, used }
        // First question blocks - coin and mushroom
        this.blocks['16,10'] = { type: 'coin', used: false };
        this.blocks['17,10'] = { type: 'mushroom', used: false };

        // Brick-question row
        this.blocks['22,10'] = { type: 'coin', used: false };

        // Upper question block - coin
        this.blocks['22,6'] = { type: 'coin', used: false };

        // Section at tile 64-68
        this.blocks['65,10'] = { type: 'coin', used: false };
        this.blocks['67,10'] = { type: 'mushroom', used: false };

        // Elevated section at 74-78
        this.blocks['76,8'] = { type: 'coin', used: false };

        // Question blocks around tile 93-96
        this.blocks['93,10'] = { type: 'coin', used: false };
        this.blocks['96,10'] = { type: 'mushroom', used: false };
        this.blocks['95,6'] = { type: 'coin', used: false };

        // Section at 110-112
        this.blocks['111,8'] = { type: 'coin', used: false };

        // Section at 118-120
        this.blocks['119,10'] = { type: 'coin', used: false };

        // Section at 134-137
        this.blocks['136,10'] = { type: 'coin', used: false };

        // Section at 160-163
        this.blocks['161,10'] = { type: 'mushroom', used: false };
    }

    // --------------------------------------------------------
    // Enemy placement
    // --------------------------------------------------------
    _placeEnemies() {
        this.entities = [
            // Early goombas
            new Enemy(22 * 32, 12 * 32 - 28, 'goomba'),   // near first brick row
            new Enemy(34 * 32, 12 * 32 - 28, 'goomba'),   // between pipes

            // Koopa near pipe 2
            new Enemy(40 * 32, 12 * 32 - 38, 'koopa'),

            // Goomba pair after first pit
            new Enemy(50 * 32, 12 * 32 - 28, 'goomba'),
            new Enemy(52 * 32, 12 * 32 - 28, 'goomba'),

            // Goomba in middle section
            new Enemy(70 * 32, 12 * 32 - 28, 'goomba'),

            // Koopa around tile 82
            new Enemy(82 * 32, 12 * 32 - 38, 'koopa'),

            // Goombas around tile 95-98
            new Enemy(95 * 32, 12 * 32 - 28, 'goomba'),
            new Enemy(98 * 32, 12 * 32 - 28, 'goomba'),

            // Goomba pair at 115
            new Enemy(115 * 32, 12 * 32 - 28, 'goomba'),
            new Enemy(117 * 32, 12 * 32 - 28, 'goomba'),

            // Goomba before staircase
            new Enemy(165 * 32, 12 * 32 - 28, 'goomba'),
        ];
    }

    // --------------------------------------------------------
    // Coin placement (static coins in the level)
    // --------------------------------------------------------
    _placeCoins() {
        // A few static coins floating in the level
        this.coins = [
            { x: 102 * 32 + 8, y: 8 * 32, width: 16, height: 24, collected: false },
            { x: 103 * 32 + 8, y: 8 * 32, width: 16, height: 24, collected: false },
            { x: 104 * 32 + 8, y: 8 * 32, width: 16, height: 24, collected: false },
            { x: 105 * 32 + 8, y: 8 * 32, width: 16, height: 24, collected: false },
        ];
    }

    // --------------------------------------------------------
    // Tile queries
    // --------------------------------------------------------
    getTile(tx, ty) {
        if (tx < 0 || tx >= this.widthInTiles || ty < 0 || ty >= this.heightInTiles) {
            return TILES.EMPTY;
        }
        return this.grid[ty][tx];
    }

    setTile(tx, ty, tile) {
        if (tx >= 0 && tx < this.widthInTiles && ty >= 0 && ty < this.heightInTiles) {
            this.grid[ty][tx] = tile;
        }
    }

    getPixelTile(px, py) {
        const tx = Math.floor(px / this.tileSize);
        const ty = Math.floor(py / this.tileSize);
        return this.getTile(tx, ty);
    }

    isSolid(tx, ty) {
        const tile = this.getTile(tx, ty);
        return tile !== TILES.EMPTY && tile !== TILES.FLAGPOLE;
    }

    // --------------------------------------------------------
    // Block interaction
    // --------------------------------------------------------
    hitBlock(tileX, tileY, playerState) {
        const tile = this.getTile(tileX, tileY);
        const key = tileX + ',' + tileY;

        if (tile === TILES.QUESTION) {
            const blockData = this.blocks[key];
            if (blockData && !blockData.used) {
                blockData.used = true;
                // Change to used block (visually a hard block / dark question block)
                this.grid[tileY][tileX] = TILES.HARD;

                // Spawn item
                if (blockData.type === 'coin') {
                    // Popup coin animation
                    const coinItem = new Item(
                        tileX * this.tileSize + 8,
                        tileY * this.tileSize,
                        'coin'
                    );
                    this.items.push(coinItem);
                    return { type: 'coin' };
                } else if (blockData.type === 'mushroom') {
                    const mushroom = new Item(
                        tileX * this.tileSize + 2,
                        tileY * this.tileSize,
                        'mushroom'
                    );
                    this.items.push(mushroom);
                    return { type: 'mushroom' };
                }
            }
            // Start bump animation
            this._startBump(tileX, tileY);
            return null;
        }

        if (tile === TILES.BRICK) {
            this._startBump(tileX, tileY);

            if (playerState === 'big') {
                // Break the brick
                this.grid[tileY][tileX] = TILES.EMPTY;
                return { type: 'break' };
            } else {
                // Just bump
                return { type: 'bump' };
            }
        }

        return null;
    }

    _startBump(tileX, tileY) {
        const key = tileX + ',' + tileY;
        this.bumpingBlocks[key] = { timer: 10, tileX: tileX, tileY: tileY };
    }

    // --------------------------------------------------------
    // Update
    // --------------------------------------------------------
    update(camera) {
        const cameraLeft = camera.x;
        const cameraRight = camera.x + (camera.width || 800);
        const activationRange = (camera.width || 800) * 2;

        // Update enemies near the camera
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const enemy = this.entities[i];

            // Activate enemies when they come within range
            if (!enemy.active && enemy.x < cameraRight + activationRange && enemy.x > cameraLeft - 64) {
                enemy.active = true;
            }

            if (enemy.active) {
                enemy.update(this);

                // Remove dead enemies after timer
                if (!enemy.alive && enemy.removeTimer <= 0) {
                    this.entities.splice(i, 1);
                }
            }
        }

        // Update active items
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.update(this);
            if (!item.alive) {
                this.items.splice(i, 1);
            }
        }

        // Update bump animations
        for (const key in this.bumpingBlocks) {
            const bump = this.bumpingBlocks[key];
            bump.timer--;
            if (bump.timer <= 0) {
                delete this.bumpingBlocks[key];
            }
        }
    }

    // --------------------------------------------------------
    // Draw
    // --------------------------------------------------------
    draw(ctx, camera) {
        const startCol = Math.max(0, Math.floor(camera.x / this.tileSize) - 1);
        const endCol = Math.min(this.widthInTiles - 1, Math.ceil((camera.x + (camera.width || 800)) / this.tileSize) + 1);
        const startRow = 0;
        const endRow = this.heightInTiles - 1;

        // Draw tiles
        for (let y = startRow; y <= endRow; y++) {
            for (let x = startCol; x <= endCol; x++) {
                const tile = this.grid[y][x];
                if (tile === TILES.EMPTY) continue;

                let screenX = x * this.tileSize - camera.x;
                let screenY = y * this.tileSize - (camera.y || 0);

                // Apply bump offset
                const key = x + ',' + y;
                if (this.bumpingBlocks[key]) {
                    const bump = this.bumpingBlocks[key];
                    const bumpOffset = bump.timer > 5 ? -(10 - bump.timer) * 2 : -(bump.timer) * 2;
                    screenY += bumpOffset;
                }

                if (typeof SpriteRenderer !== 'undefined' && SpriteRenderer.drawTile) {
                    SpriteRenderer.drawTile(ctx, tile, screenX, screenY, this.tileSize);
                } else {
                    this._drawTileFallback(ctx, tile, screenX, screenY);
                }
            }
        }

        // Draw static coins
        for (const coin of this.coins) {
            if (coin.collected) continue;
            const screenX = coin.x - camera.x;
            const screenY = coin.y - (camera.y || 0);
            if (screenX + coin.width < 0 || screenX > (camera.width || 800)) continue;

            if (typeof SpriteRenderer !== 'undefined' && SpriteRenderer.drawCoin) {
                SpriteRenderer.drawCoin(ctx, screenX, screenY, coin.width, coin.height);
            } else {
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(screenX, screenY, coin.width, coin.height);
                ctx.fillStyle = '#DAA520';
                ctx.fillRect(screenX + 2, screenY + 4, coin.width - 4, coin.height - 8);
            }
        }

        // Draw active items
        for (const item of this.items) {
            item.draw(ctx, camera);
        }

        // Draw enemies
        for (const enemy of this.entities) {
            if (enemy.active) {
                enemy.draw(ctx, camera);
            }
        }
    }

    _drawTileFallback(ctx, tile, x, y) {
        const s = this.tileSize;

        switch (tile) {
            case TILES.GROUND:
                // Brown ground with texture
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(x, y, s, s);
                ctx.fillStyle = '#A0522D';
                ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
                // Brick pattern
                ctx.strokeStyle = '#6B3410';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, s, s);
                ctx.beginPath();
                ctx.moveTo(x, y + s / 2);
                ctx.lineTo(x + s, y + s / 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + s / 2, y);
                ctx.lineTo(x + s / 2, y + s / 2);
                ctx.stroke();
                break;

            case TILES.BRICK:
                // Breakable brick
                ctx.fillStyle = '#C84C09';
                ctx.fillRect(x, y, s, s);
                ctx.strokeStyle = '#8B3006';
                ctx.lineWidth = 1;
                // Brick lines
                ctx.strokeRect(x, y, s, s);
                ctx.beginPath();
                ctx.moveTo(x, y + s / 3);
                ctx.lineTo(x + s, y + s / 3);
                ctx.moveTo(x, y + (2 * s) / 3);
                ctx.lineTo(x + s, y + (2 * s) / 3);
                ctx.moveTo(x + s / 2, y);
                ctx.lineTo(x + s / 2, y + s / 3);
                ctx.moveTo(x + s / 4, y + s / 3);
                ctx.lineTo(x + s / 4, y + (2 * s) / 3);
                ctx.moveTo(x + (3 * s) / 4, y + s / 3);
                ctx.lineTo(x + (3 * s) / 4, y + (2 * s) / 3);
                ctx.moveTo(x + s / 2, y + (2 * s) / 3);
                ctx.lineTo(x + s / 2, y + s);
                ctx.stroke();
                break;

            case TILES.QUESTION:
                // Question block
                ctx.fillStyle = '#FFB800';
                ctx.fillRect(x, y, s, s);
                ctx.strokeStyle = '#C68E00';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
                // Question mark
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('?', x + s / 2, y + s / 2);
                ctx.textAlign = 'left';
                break;

            case TILES.HARD:
                // Hard/used block - dark steel
                ctx.fillStyle = '#6B6B6B';
                ctx.fillRect(x, y, s, s);
                ctx.fillStyle = '#888';
                ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, s, s);
                break;

            case TILES.PIPE_TOP_LEFT:
                ctx.fillStyle = '#00AA00';
                ctx.fillRect(x, y, s, s);
                ctx.fillStyle = '#00DD00';
                ctx.fillRect(x, y, s - 4, s);
                ctx.fillStyle = '#008800';
                ctx.fillRect(x, y, 4, s);
                // Lip overhang
                ctx.fillStyle = '#00CC00';
                ctx.fillRect(x - 4, y, s + 4, 8);
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(x - 4, y, s, 4);
                break;

            case TILES.PIPE_TOP_RIGHT:
                ctx.fillStyle = '#00AA00';
                ctx.fillRect(x, y, s, s);
                ctx.fillStyle = '#00DD00';
                ctx.fillRect(x + 4, y, s - 4, s);
                ctx.fillStyle = '#008800';
                ctx.fillRect(x + s - 4, y, 4, s);
                // Lip overhang
                ctx.fillStyle = '#00CC00';
                ctx.fillRect(x, y, s + 4, 8);
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(x + 4, y, s, 4);
                break;

            case TILES.PIPE_BODY_LEFT:
                ctx.fillStyle = '#00AA00';
                ctx.fillRect(x, y, s, s);
                ctx.fillStyle = '#00CC00';
                ctx.fillRect(x + 4, y, s - 8, s);
                ctx.fillStyle = '#008800';
                ctx.fillRect(x, y, 4, s);
                break;

            case TILES.PIPE_BODY_RIGHT:
                ctx.fillStyle = '#00AA00';
                ctx.fillRect(x, y, s, s);
                ctx.fillStyle = '#00CC00';
                ctx.fillRect(x + 4, y, s - 8, s);
                ctx.fillStyle = '#008800';
                ctx.fillRect(x + s - 4, y, 4, s);
                break;

            case TILES.FLAGPOLE:
                // Flagpole shaft
                ctx.fillStyle = '#888';
                ctx.fillRect(x + 13, y, 6, s);
                ctx.fillStyle = '#AAA';
                ctx.fillRect(x + 14, y, 4, s);
                // Ball on top (only on first flagpole tile)
                if (y <= 3 * this.tileSize) {
                    ctx.fillStyle = '#00FF00';
                    ctx.beginPath();
                    ctx.arc(x + 16, y + 4, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
    }
}

// ============================================================
// Export as globals
// ============================================================
if (typeof window !== 'undefined') {
    window.Level = Level;
    window.Enemy = Enemy;
    window.Item = Item;
    window.TILES = TILES;
}
