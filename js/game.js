// =============================================================================
// game.js - Main Game Loop for Super Mario Bros HTML5 Canvas Game
// =============================================================================

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // Game Class
    // -------------------------------------------------------------------------
    function Game() {
        this.canvas = null;
        this.ctx = null;
        this.player = null;
        this.level = null;
        this.camera = null;
        this.timer = null;
        this.state = GameState.MENU;
        this.lastTime = 0;

        // Respawn handling
        this._respawnDelay = 0;
        this._respawnPending = false;

        // Key listener for menu transitions
        this._onKeyDown = null;

        // Character selection
        this.selectedCharacter = 0; // 0=mario, 1=ninja, 2=princess
        this.characters = ['mario', 'ninja', 'princess'];
        this.characterNames = ['MARIO', 'NINJA TURTLE', 'PRINCESS'];
        this.characterColors = ['#E52521', '#00A800', '#FF69B4'];
        this.characterDescriptions = ['Fireball Attack', 'Shuriken Attack', 'Magic Blast'];
    }

    // -------------------------------------------------------------------------
    // Initialization
    // -------------------------------------------------------------------------
    Game.prototype.init = function () {
        // Canvas setup
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Pre-render all sprites
        if (typeof SpriteRenderer !== 'undefined' && SpriteRenderer.init) {
            SpriteRenderer.init();
        }

        // Create level
        this.level = new Level();

        // Create player at level start position
        this.player = new Player();
        this.player.x = this.level.playerStart.x;
        this.player.y = this.level.playerStart.y;

        // Create camera with level pixel width
        var levelPixelWidth = this.level.grid[0].length * TILE_SIZE;
        this.camera = new Camera(levelPixelWidth);
        this.camera.width = CANVAS_WIDTH;

        // Create game timer
        this.timer = new GameTimer();

        // Set initial state
        this.state = GameState.MENU;

        // Menu key listener
        var self = this;
        this._onKeyDown = function (e) {
            if (self.state === GameState.MENU) {
                self._startGame();
            } else if (self.state === 'CHARACTER_SELECT') {
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    self.selectedCharacter = (self.selectedCharacter + 2) % 3; // wrap left
                } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    self.selectedCharacter = (self.selectedCharacter + 1) % 3; // wrap right
                } else if (e.key === 'Enter' || e.key === ' ') {
                    self.player.character = self.characters[self.selectedCharacter];
                    self.state = GameState.PLAYING;
                    self.timer.reset();
                    self.timer.start();
                }
            }
        };
        window.addEventListener('keydown', this._onKeyDown);

        // Start the game loop
        this.lastTime = performance.now();
        requestAnimationFrame(function (timestamp) {
            self._loop(timestamp);
        });
    };

    // -------------------------------------------------------------------------
    // Start game (transition from MENU to PLAYING)
    // -------------------------------------------------------------------------
    Game.prototype._startGame = function () {
        this.state = 'CHARACTER_SELECT';
    };

    // -------------------------------------------------------------------------
    // Main Loop
    // -------------------------------------------------------------------------
    Game.prototype._loop = function (timestamp) {
        var deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Cap delta to avoid spiral of death on tab switch
        if (deltaTime > 100) deltaTime = 100;

        this.update(deltaTime);
        this.render();

        var self = this;
        requestAnimationFrame(function (ts) {
            self._loop(ts);
        });
    };

    // -------------------------------------------------------------------------
    // Update
    // -------------------------------------------------------------------------
    Game.prototype.update = function (deltaTime) {
        // --- MENU state: waiting for key press (handled by event listener) ---
        if (this.state === GameState.MENU) {
            return;
        }

        // --- CHARACTER_SELECT: no updates ---
        if (this.state === 'CHARACTER_SELECT') {
            return;
        }

        // --- GAMEOVER / WIN: no updates ---
        if (this.state === GameState.GAMEOVER || this.state === GameState.WIN) {
            return;
        }

        // --- PLAYING ---
        if (this.state !== GameState.PLAYING) return;

        // Handle respawn delay
        if (this._respawnPending) {
            this._respawnDelay -= deltaTime;
            if (this._respawnDelay <= 0) {
                this._respawnPending = false;
                this.player.reset(this.level.playerStart.x, this.level.playerStart.y);
                this.camera.x = 0;
                this.timer.reset();
                this.timer.start();
            }
            return;
        }

        // Update player
        this.player.update(this.level);

        // Update level (enemies, items, bump animations)
        this.level.update(this.camera);

        // Update camera to follow player
        this.camera.update(this.player.x, this.player.y);

        // Update timer - if expired, player dies
        var timerExpired = this.timer.update(deltaTime);
        if (timerExpired) {
            this.player.die();
        }

        // --- Collision: Player vs Enemies ---
        this._checkEnemyCollisions();

        // --- Collision: Player vs Items ---
        this._checkItemCollisions();

        // --- Collision: Player vs Static Coins ---
        this._checkCoinCollisions();

        // --- Check flagpole (win condition) ---
        if (this.player.alive && this.player.x >= this.level.flagpolePos.x) {
            this.state = GameState.WIN;
            this.timer.stop();
            return;
        }

        // --- Check player death / respawn / game over ---
        if (!this.player.alive && !this.player._dying) {
            if (this.player.lives <= 0) {
                this.state = GameState.GAMEOVER;
                this.timer.stop();
            } else {
                // Respawn after a short delay
                this._respawnPending = true;
                this._respawnDelay = 1500; // 1.5 seconds
                this.timer.stop();
            }
        }

        // --- Update HUD ---
        updateHUD(this.player.score, this.player.coins, this.timer.time, this.player.lives);
    };

    // -------------------------------------------------------------------------
    // Enemy Collision Detection
    // -------------------------------------------------------------------------
    Game.prototype._checkEnemyCollisions = function () {
        if (!this.player.alive) return;

        var player = this.player;
        var entities = this.level.entities;

        for (var i = 0; i < entities.length; i++) {
            var enemy = entities[i];
            if (!enemy.alive || !enemy.active) continue;

            // AABB overlap check
            if (!Physics.checkAABB(player, enemy)) continue;

            // Determine if the player is stomping from above
            var playerBottom = player.y + player.height;
            var enemyTop = enemy.y;
            var stompThreshold = enemyTop + enemy.height * 0.35;

            if (player.vy > 0 && playerBottom <= stompThreshold + 4) {
                // Player stomps the enemy
                if (enemy.type === 'koopa' && enemy.isShell) {
                    // Kick a stationary shell, or stop a moving one
                    if (enemy.vx === 0) {
                        var kickDir = (player.x + player.width / 2 < enemy.x + enemy.width / 2) ? 1 : -1;
                        enemy.kickShell(kickDir);
                    } else {
                        enemy.stomp(); // stops the shell
                    }
                } else {
                    enemy.stomp();
                }

                // Player bounces up
                player.vy = -7;
                player.y = enemyTop - player.height;
                player.score += 100;
            } else {
                // Player takes damage from enemy
                // Exception: stationary koopa shell is safe to touch from the side to kick it
                if (enemy.type === 'koopa' && enemy.isShell && enemy.vx === 0) {
                    var kickDir2 = (player.x + player.width / 2 < enemy.x + enemy.width / 2) ? 1 : -1;
                    enemy.kickShell(kickDir2);
                } else {
                    player.takeDamage();
                }
            }
        }

        // Check projectiles vs enemies
        var projectiles = this.player.projectiles;
        for (var p = projectiles.length - 1; p >= 0; p--) {
            var proj = projectiles[p];
            if (!proj.alive) continue;

            for (var e = 0; e < entities.length; e++) {
                var enemy = entities[e];
                if (!enemy.alive || !enemy.active) continue;

                if (Physics.checkAABB(proj, enemy)) {
                    // Kill the enemy
                    enemy.stomp();
                    player.score += 100;

                    // Remove projectile (unless piercing)
                    if (!proj.piercing) {
                        proj.alive = false;
                        break;
                    }
                }
            }
        }
    };

    // -------------------------------------------------------------------------
    // Item Collision Detection
    // -------------------------------------------------------------------------
    Game.prototype._checkItemCollisions = function () {
        if (!this.player.alive) return;

        var player = this.player;
        var items = this.level.items;

        for (var i = items.length - 1; i >= 0; i--) {
            var item = items[i];
            if (!item.alive) continue;

            // Coin popup items auto-collect (they are visual-only animations)
            if (item.type === 'coin') {
                // Popup coins from question blocks grant a coin on spawn (handled here)
                // Only collect on first frame (when animTimer is near max)
                if (item.animTimer >= 28 && item.animTimer <= 30) {
                    player.collectPowerUp('coin');
                }
                continue;
            }

            // Spawning mushrooms are not yet collectible
            if (item.spawning) continue;

            // AABB collision for mushrooms / fireflowers / stars
            if (Physics.checkAABB(player, item)) {
                player.collectPowerUp(item.type);
                item.alive = false;
            }
        }
    };

    // -------------------------------------------------------------------------
    // Static Coin Collision Detection
    // -------------------------------------------------------------------------
    Game.prototype._checkCoinCollisions = function () {
        if (!this.player.alive) return;

        var player = this.player;
        var coins = this.level.coins;

        for (var i = 0; i < coins.length; i++) {
            var coin = coins[i];
            if (coin.collected) continue;

            if (Physics.checkAABB(player, coin)) {
                coin.collected = true;
                player.collectPowerUp('coin');
            }
        }
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    Game.prototype.render = function () {
        var ctx = this.ctx;
        var canvas = this.canvas;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background
        if (typeof SpriteRenderer !== 'undefined' && SpriteRenderer.drawBackground) {
            SpriteRenderer.drawBackground(ctx, this.camera.x, this.level.width);
        } else {
            // Fallback sky gradient
            ctx.fillStyle = '#6B8CFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw level (tiles, enemies, items) - level.draw handles camera offset internally
        this.level.draw(ctx, this.camera);

        // Draw player with camera transform
        this.camera.apply(ctx);
        this.player.draw(ctx);
        this.camera.restore(ctx);

        // --- Overlay screens ---
        if (this.state === GameState.MENU) {
            this._drawMenuOverlay(ctx, canvas);
        } else if (this.state === 'CHARACTER_SELECT') {
            this._drawCharacterSelect(ctx, canvas);
        } else if (this.state === GameState.GAMEOVER) {
            this._drawGameOverOverlay(ctx, canvas);
        } else if (this.state === GameState.WIN) {
            this._drawWinOverlay(ctx, canvas);
        }
    };

    // -------------------------------------------------------------------------
    // Character Select Screen
    // -------------------------------------------------------------------------
    Game.prototype._drawCharacterSelect = function(ctx, canvas) {
        // Dark background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 32px Arial, sans-serif';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('SELECT CHARACTER', canvas.width / 2, 80);
        ctx.fillText('SELECT CHARACTER', canvas.width / 2, 80);

        // Draw 3 character boxes
        var boxWidth = 180;
        var boxHeight = 280;
        var gap = 30;
        var startX = (canvas.width - (boxWidth * 3 + gap * 2)) / 2;
        var boxY = 130;

        for (var i = 0; i < 3; i++) {
            var bx = startX + i * (boxWidth + gap);
            var selected = (i === this.selectedCharacter);

            // Box background
            ctx.fillStyle = selected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(bx, boxY, boxWidth, boxHeight);

            // Border
            ctx.strokeStyle = selected ? this.characterColors[i] : '#555';
            ctx.lineWidth = selected ? 4 : 2;
            ctx.strokeRect(bx, boxY, boxWidth, boxHeight);

            // Selection glow
            if (selected) {
                ctx.shadowColor = this.characterColors[i];
                ctx.shadowBlur = 15;
                ctx.strokeRect(bx, boxY, boxWidth, boxHeight);
                ctx.shadowBlur = 0;
            }

            // Character preview - draw a big colored rectangle as placeholder
            // The SpriteRenderer will handle actual sprite if available
            var previewX = bx + boxWidth/2 - 24;
            var previewY = boxY + 30;

            if (typeof SpriteRenderer !== 'undefined' && SpriteRenderer.initialized) {
                var spriteSet;
                if (i === 0) spriteSet = SpriteRenderer.sprites.marioBig || SpriteRenderer.sprites.marioSmall;
                else if (i === 1) spriteSet = SpriteRenderer.sprites.ninjaBig || SpriteRenderer.sprites.ninjaSmall;
                else spriteSet = SpriteRenderer.sprites.princessBig || SpriteRenderer.sprites.princessSmall;

                if (spriteSet && spriteSet.standRight) {
                    var sprite = spriteSet.standRight;
                    // Draw character sprite scaled up 2x
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(sprite, previewX, previewY, sprite.width * 2, sprite.height * 2);
                    ctx.imageSmoothingEnabled = true;
                } else {
                    // Fallback colored rectangle
                    ctx.fillStyle = this.characterColors[i];
                    ctx.fillRect(previewX, previewY, 48, 80);
                }
            } else {
                ctx.fillStyle = this.characterColors[i];
                ctx.fillRect(previewX, previewY, 48, 80);
            }

            // Character name
            ctx.fillStyle = selected ? '#FFF' : '#888';
            ctx.font = 'bold 16px Arial, sans-serif';
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#000';
            ctx.strokeText(this.characterNames[i], bx + boxWidth/2, boxY + boxHeight - 65);
            ctx.fillText(this.characterNames[i], bx + boxWidth/2, boxY + boxHeight - 65);

            // Attack description
            ctx.fillStyle = selected ? this.characterColors[i] : '#666';
            ctx.font = '13px Arial, sans-serif';
            ctx.fillText(this.characterDescriptions[i], bx + boxWidth/2, boxY + boxHeight - 38);

            // Attack key hint
            if (selected) {
                ctx.fillStyle = '#AAA';
                ctx.font = '11px Arial, sans-serif';
                ctx.fillText('Attack: F / X', bx + boxWidth/2, boxY + boxHeight - 15);
            }
        }

        // Navigation hint
        ctx.fillStyle = '#AAA';
        ctx.font = '14px Arial, sans-serif';
        var blink = Math.floor(Date.now() / 500) % 2;
        if (blink) {
            ctx.fillText('< Arrow Keys to Select, Enter to Confirm >', canvas.width / 2, canvas.height - 40);
        }

        ctx.textAlign = 'left';
    };

    // -------------------------------------------------------------------------
    // Menu Overlay
    // -------------------------------------------------------------------------
    Game.prototype._drawMenuOverlay = function (ctx, canvas) {
        // Dim background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        ctx.fillStyle = '#E52521';
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText('SUPER MARIO', canvas.width / 2, canvas.height / 2 - 60);
        ctx.fillText('SUPER MARIO', canvas.width / 2, canvas.height / 2 - 60);

        // Subtitle
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText('HTML5 Canvas Edition', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText('HTML5 Canvas Edition', canvas.width / 2, canvas.height / 2 - 10);

        // Prompt (blinking effect)
        var blink = Math.floor(Date.now() / 500) % 2;
        if (blink) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Arial, sans-serif';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText('Press any key to start', canvas.width / 2, canvas.height / 2 + 60);
            ctx.fillText('Press any key to start', canvas.width / 2, canvas.height / 2 + 60);
        }

        // Controls hint
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '14px Arial, sans-serif';
        ctx.lineWidth = 0;
        ctx.fillText('Arrow Keys / WASD to move  |  Space / Up to jump', canvas.width / 2, canvas.height / 2 + 120);

        ctx.textAlign = 'left';
    };

    // -------------------------------------------------------------------------
    // Game Over Overlay
    // -------------------------------------------------------------------------
    Game.prototype._drawGameOverOverlay = function (ctx, canvas) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#E52521';
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px Arial, sans-serif';
        ctx.lineWidth = 2;
        ctx.strokeText('Final Score: ' + this.player.score, canvas.width / 2, canvas.height / 2 + 30);
        ctx.fillText('Final Score: ' + this.player.score, canvas.width / 2, canvas.height / 2 + 30);

        var blink = Math.floor(Date.now() / 500) % 2;
        if (blink) {
            ctx.fillStyle = '#AAAAAA';
            ctx.font = '18px Arial, sans-serif';
            ctx.fillText('Press any key to restart', canvas.width / 2, canvas.height / 2 + 80);
        }

        ctx.textAlign = 'left';
    };

    // -------------------------------------------------------------------------
    // Win Overlay
    // -------------------------------------------------------------------------
    Game.prototype._drawWinOverlay = function (ctx, canvas) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 50);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '28px Arial, sans-serif';
        ctx.lineWidth = 2;
        ctx.strokeText('Final Score: ' + this.player.score, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText('Final Score: ' + this.player.score, canvas.width / 2, canvas.height / 2 + 10);

        // Time bonus
        var timeBonus = this.timer.time * 50;
        ctx.fillStyle = '#54D854';
        ctx.font = '22px Arial, sans-serif';
        ctx.lineWidth = 1;
        ctx.strokeText('Time Bonus: ' + timeBonus, canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText('Time Bonus: ' + timeBonus, canvas.width / 2, canvas.height / 2 + 50);

        var blink = Math.floor(Date.now() / 500) % 2;
        if (blink) {
            ctx.fillStyle = '#AAAAAA';
            ctx.font = '18px Arial, sans-serif';
            ctx.fillText('Press any key to play again', canvas.width / 2, canvas.height / 2 + 100);
        }

        ctx.textAlign = 'left';
    };

    // -------------------------------------------------------------------------
    // Restart (from GAMEOVER or WIN)
    // -------------------------------------------------------------------------
    Game.prototype._restart = function () {
        // Destroy old player listeners
        if (this.player && this.player.destroy) {
            this.player.destroy();
        }

        // Re-create level
        this.level = new Level();

        // Re-create player
        this.player = new Player();
        this.player.x = this.level.playerStart.x;
        this.player.y = this.level.playerStart.y;
        this.player.character = this.characters[this.selectedCharacter];

        // Reset camera
        this.camera.x = 0;
        this.camera.y = 0;

        // Reset timer
        this.timer.reset();
        this.timer.start();

        // Reset respawn state
        this._respawnPending = false;
        this._respawnDelay = 0;

        // Set to playing
        this.state = GameState.PLAYING;
    };

    // -------------------------------------------------------------------------
    // Auto-start on page load
    // -------------------------------------------------------------------------
    window.onload = function () {
        var game = new Game();
        game.init();

        // Handle restart from GAMEOVER or WIN
        window.addEventListener('keydown', function (e) {
            if (game.state === GameState.GAMEOVER || game.state === GameState.WIN) {
                game._restart();
            }
        });
    };

    // Export
    window.Game = Game;
})();
