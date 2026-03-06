/**
 * Player class - Mario player character
 * Handles input, movement, physics, power-ups, and rendering.
 */
(function () {
  'use strict';

  // --------------- Constants ---------------
  var TILE = 32;
  var SMALL_HEIGHT = 32;
  var BIG_HEIGHT = 56;
  var MOVE_SPEED = 3.5;
  var JUMP_FORCE = -14;
  var FRICTION = 0.85;
  var ACCELERATION = 0.5;
  var INVINCIBLE_HIT_DURATION = 120;   // ~2 seconds at 60 fps
  var INVINCIBLE_STAR_DURATION = 600;  // ~10 seconds at 60 fps
  var ANIM_SPEED = 6; // frames between animation ticks

  // --------------- Input tracking ---------------
  var keys = {
    left: false,
    right: false,
    jump: false,
    attack: false
  };

  function onKeyDown(e) {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        keys.left = true;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        keys.right = true;
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
      case ' ':
        keys.jump = true;
        break;
      case 'f':
      case 'F':
      case 'x':
      case 'X':
        keys.attack = true;
        break;
    }
  }

  function onKeyUp(e) {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        keys.left = false;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        keys.right = false;
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
      case ' ':
        keys.jump = false;
        break;
      case 'f':
      case 'F':
      case 'x':
      case 'X':
        keys.attack = false;
        break;
    }
  }

  // --------------- Player constructor ---------------
  function Player() {
    this.x = 3 * TILE;
    this.y = 0; // will be set to ground level externally or via reset
    this.width = 24;
    this.height = SMALL_HEIGHT;

    this.vx = 0;
    this.vy = 0;

    this.speed = MOVE_SPEED;
    this.jumpForce = JUMP_FORCE;

    this.state = 'small'; // 'small' | 'big' | 'fire'
    this.alive = true;
    this.grounded = false;
    this.facing = 'right';

    this.animFrame = 0;
    this.animTimer = 0;

    this.invincible = false;
    this.invincibleTimer = 0;

    this.score = 0;
    this.coins = 0;
    this.lives = 3;

    // Character selection and attack
    this.character = 'mario'; // 'mario', 'ninja', 'princess'
    this.attackCooldown = 0;
    this.attackCooldownMax = 30; // frames between attacks (0.5 sec)
    this.projectiles = []; // active projectiles array

    // Death animation state
    this._dying = false;
    this._deathTimer = 0;

    // Keys reference (shared across instances)
    this.keys = keys;

    // Register listeners
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }

  // --------------- Update ---------------
  Player.prototype.update = function (level) {
    // --- Death animation ---
    if (this._dying) {
      this._deathTimer++;
      if (this._deathTimer < 20) {
        // brief rise
        this.vy = -5;
      } else {
        this.vy += 0.5; // gravity during death fall
      }
      this.y += this.vy;
      // Once fallen well off-screen, finish dying
      if (this.y > (level && level.height ? level.height : 1000) + 100) {
        this._dying = false;
      }
      return;
    }

    if (!this.alive) return;

    // --- Horizontal movement ---
    if (keys.left) {
      this.vx -= ACCELERATION;
      if (this.vx < -this.speed) this.vx = -this.speed;
      this.facing = 'left';
    } else if (keys.right) {
      this.vx += ACCELERATION;
      if (this.vx > this.speed) this.vx = this.speed;
      this.facing = 'right';
    } else {
      // Decelerate
      this.vx *= FRICTION;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    // --- Jump ---
    if (keys.jump && this.grounded) {
      this.jump();
    }

    // Variable-height jump: release jump key early to cut upward velocity
    if (!keys.jump && this.vy < 0) {
      this.vy *= 0.65;
    }

    // --- Physics ---
    if (typeof Physics !== 'undefined') {
      Physics.applyGravity(this);
    }

    // --- Tile collisions (also moves entity) ---
    if (typeof Physics !== 'undefined' && level) {
      var collision = Physics.checkTileCollision(this, level);

      if (collision.bottom) {
        this.grounded = true;
      } else {
        this.grounded = false;
      }

      // When hitting a tile from below, trigger block hit
      if (collision.top && collision.tileX !== undefined) {
        if (level.hitBlock) {
          level.hitBlock(collision.tileX, collision.tileY, this.state);
        }
      }
    } else {
      // No physics - manual movement
      this.x += this.vx;
      this.y += this.vy;
    }

    // --- Pit detection ---
    var levelPixelHeight = level && level.height ? level.height : 15 * TILE;
    if (this.y > levelPixelHeight) {
      this.die();
      return;
    }

    // --- Prevent going off left edge ---
    if (this.x < 0) {
      this.x = 0;
      this.vx = 0;
    }

    // --- Animation ---
    this.animTimer++;
    if (this.animTimer >= ANIM_SPEED) {
      this.animTimer = 0;
      if (Math.abs(this.vx) > 0.3) {
        this.animFrame = (this.animFrame + 1) % 3;
      } else {
        this.animFrame = 0;
      }
    }

    // --- Invincibility timer ---
    if (this.invincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.invincibleTimer = 0;
      }
    }

    // --- Attack ---
    if (keys.attack && this.attackCooldown <= 0) {
      this.attack();
    }
    if (this.attackCooldown > 0) this.attackCooldown--;

    // --- Update projectiles ---
    this.updateProjectiles(level);
  };

  // --------------- Jump ---------------
  Player.prototype.jump = function () {
    if (this.grounded) {
      this.vy = this.jumpForce;
      this.grounded = false;
    }
  };

  // --------------- Attack ---------------
  Player.prototype.attack = function () {
    if (this.attackCooldown > 0) return;
    this.attackCooldown = this.attackCooldownMax;

    var dir = this.facing === 'right' ? 1 : -1;
    var projX = this.x + (dir > 0 ? this.width : -12);
    var projY = this.y + this.height / 2 - 6;

    var projectile = {
      x: projX,
      y: projY,
      vx: 0,
      vy: 0,
      width: 12,
      height: 12,
      type: '',
      alive: true,
      animFrame: 0,
      timer: 0,
      maxLife: 180 // 3 seconds max
    };

    if (this.character === 'mario') {
      projectile.type = 'fireball';
      projectile.vx = dir * 6;
      projectile.vy = -2; // slight arc, bounces
      projectile.width = 12;
      projectile.height = 12;
      projectile.bounces = true;
    } else if (this.character === 'ninja') {
      projectile.type = 'shuriken';
      projectile.vx = dir * 8; // faster
      projectile.vy = 0; // straight line
      projectile.width = 14;
      projectile.height = 14;
    } else if (this.character === 'princess') {
      projectile.type = 'magic';
      projectile.vx = dir * 5;
      projectile.vy = 0;
      projectile.width = 20;
      projectile.height = 20;
      projectile.piercing = true; // goes through enemies
    }

    this.projectiles.push(projectile);
  };

  // --------------- Update Projectiles ---------------
  Player.prototype.updateProjectiles = function (level) {
    for (var i = this.projectiles.length - 1; i >= 0; i--) {
      var p = this.projectiles[i];
      p.timer++;
      p.animFrame++;

      if (p.timer > p.maxLife) { p.alive = false; }

      p.x += p.vx;
      p.y += p.vy;

      // Fireball bouncing
      if (p.bounces) {
        p.vy += 0.3; // gravity on fireball
        // Check ground collision
        var tileBelow = level.getPixelTile(p.x + p.width / 2, p.y + p.height);
        if (tileBelow > 0 && tileBelow !== 9) {
          p.vy = -4; // bounce up
          p.y = Math.floor((p.y + p.height) / 32) * 32 - p.height;
        }
      }

      // Check wall collision (remove projectile)
      var tileAhead = level.getPixelTile(p.x + (p.vx > 0 ? p.width : 0), p.y + p.height / 2);
      if (tileAhead > 0 && tileAhead !== 9) {
        if (!p.piercing) p.alive = false;
      }

      // Off screen removal
      if (p.x < -50 || p.x > level.width + 50 || p.y > level.height + 50) {
        p.alive = false;
      }

      if (!p.alive) {
        this.projectiles.splice(i, 1);
      }
    }
  };

  // --------------- Take Damage ---------------
  Player.prototype.takeDamage = function () {
    if (this.invincible) return;

    if (this.state === 'big' || this.state === 'fire') {
      // Downgrade to small
      var oldHeight = this.height;
      this.state = 'small';
      this.height = SMALL_HEIGHT;
      // Adjust y so feet stay at the same position
      this.y += (oldHeight - SMALL_HEIGHT);
      this.invincible = true;
      this.invincibleTimer = INVINCIBLE_HIT_DURATION;
    } else {
      // Small Mario dies
      this.die();
    }
  };

  // --------------- Collect Power-Up ---------------
  Player.prototype.collectPowerUp = function (type) {
    switch (type) {
      case 'mushroom':
        if (this.state === 'small') {
          this.state = 'big';
          // Adjust y so feet stay planted
          this.y -= (BIG_HEIGHT - SMALL_HEIGHT);
          this.height = BIG_HEIGHT;
        }
        this.score += 1000;
        break;

      case 'fireflower':
        if (this.state === 'small') {
          this.y -= (BIG_HEIGHT - SMALL_HEIGHT);
          this.height = BIG_HEIGHT;
        }
        this.state = 'fire';
        this.score += 1000;
        break;

      case 'star':
        this.invincible = true;
        this.invincibleTimer = INVINCIBLE_STAR_DURATION;
        this.score += 1000;
        break;

      case 'coin':
        this.coins++;
        this.score += 200;
        // Every 100 coins grants an extra life
        if (this.coins >= 100) {
          this.coins -= 100;
          this.lives++;
        }
        break;

      case '1up':
        this.lives++;
        break;
    }
  };

  // --------------- Die ---------------
  Player.prototype.die = function () {
    if (!this.alive) return;
    this.lives--;
    this.alive = false;
    this.vx = 0;
    this.vy = 0;
    this._dying = true;
    this._deathTimer = 0;
    // Game-over is handled externally by checking lives <= 0
  };

  // --------------- Draw ---------------
  Player.prototype.draw = function (ctx) {
    if (!this.alive && !this._dying) return;

    // Blink effect when invincible (skip drawing every other frame)
    if (this.invincible && !this._dying) {
      if (Math.floor(this.invincibleTimer / 3) % 2 === 0) {
        return; // skip this frame for blink
      }
    }

    if (typeof SpriteRenderer !== 'undefined' && SpriteRenderer.drawPlayer) {
      SpriteRenderer.drawPlayer(ctx, this);
    } else {
      // Fallback: draw a simple colored rectangle
      ctx.save();
      if (this.state === 'fire') {
        ctx.fillStyle = '#FF4500';
      } else if (this.state === 'big') {
        ctx.fillStyle = '#FF0000';
      } else {
        ctx.fillStyle = '#E52521';
      }

      if (this._dying) {
        ctx.fillStyle = '#E52521';
      }

      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Simple face indicator
      ctx.fillStyle = '#FFD700';
      var eyeX = this.facing === 'right' ? this.x + 16 : this.x + 4;
      ctx.fillRect(eyeX, this.y + 6, 4, 4);

      ctx.restore();
    }

    // Draw projectiles
    for (var i = 0; i < this.projectiles.length; i++) {
      var p = this.projectiles[i];
      if (typeof SpriteRenderer !== 'undefined' && SpriteRenderer.drawProjectile) {
        SpriteRenderer.drawProjectile(ctx, p);
      } else {
        // Fallback
        ctx.fillStyle = this.character === 'mario' ? '#FF4500' :
                         this.character === 'ninja' ? '#C0C0C0' : '#FF69B4';
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // --------------- Reset ---------------
  Player.prototype.reset = function (x, y) {
    this.x = x !== undefined ? x : 3 * TILE;
    this.y = y !== undefined ? y : 0;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.alive = true;
    this._dying = false;
    this._deathTimer = 0;
    this.facing = 'right';
    this.animFrame = 0;
    this.animTimer = 0;
    this.state = 'small';
    this.height = SMALL_HEIGHT;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.projectiles = [];
    this.attackCooldown = 0;
  };

  // --------------- Cleanup ---------------
  Player.prototype.destroy = function () {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  };

  // --------------- Export as global ---------------
  window.Player = Player;
})();
