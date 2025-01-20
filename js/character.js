export class Character {
  constructor(x, y, game) {
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.health = 100; // Ensure health starts at 100
    this.facing = 1;
    this.isJumping = false;
    this.isAttacking = false;
    this.game = game;
    this.isAI = false;
    
    this.element = document.createElement('div');
    this.element.className = 'character';
    
    // Add P1/P2 label above character
    const isPlayer1 = this === game.players[0];
    const indicator = document.createElement('div');
    indicator.className = 'player-indicator';
    indicator.textContent = isPlayer1 ? 'P1' : 'P2';
    this.element.appendChild(indicator);
    
    // Add P1/P2 label to health bar
    const healthText = document.getElementById(isPlayer1 ? 'player1HealthText' : 'player2HealthText');
    if (healthText) {
      const label = document.createElement('span');
      label.className = 'player-label';
      label.textContent = isPlayer1 ? 'P1 ' : 'P2 ';
      healthText.insertBefore(label, healthText.firstChild);
    }
    
    this.isBasicAttacking = false;
    this.basicAttackCooldown = 0;
    this.basicAttackCooldownTime = 500;
    this.basicAttackDuration = 500;

    this.updateHealthBar(); // Initialize health bar display
  }

  move(direction) {
    // Base speed is 5, Sonic gets 7
    const speed = this.constructor.name === 'Sonic' ? 7 : 5;
    this.dx = direction * speed;
    this.facing = direction || this.facing;
    if (direction !== 0) {
      this.element.classList.toggle('facing-left', direction < 0);
    }
  }

  jump() {
    if (!this.isJumping) {
      this.dy = -15;
      this.isJumping = true;
    }
  }

  attack(target) {
    if (!this.isAttacking) {
      this.isAttacking = true;
      setTimeout(() => {
        this.isAttacking = false;
      }, 500);

      if (Math.abs(this.x - target.x) < 50) {
        target.takeDamage(10);
      }
    }
  }

  basicAttack(target) {
    const now = Date.now();
    if (!this.isBasicAttacking && !this.isAttacking && (!this.basicAttackCooldown || now > this.basicAttackCooldown)) {
      this.isBasicAttacking = true;

      // Create and show hitbox
      const hitbox = this.createHitbox();
      this.element.appendChild(hitbox);

      // Check for hit
      if (target) {
        const hitboxBounds = {
          left: this.x + (this.facing > 0 ? 50 : -50),
          right: this.x + (this.facing > 0 ? 100 : 0),
          top: this.y,
          bottom: this.y + 50
        };

        const targetBounds = {
          left: target.x,
          right: target.x + 64,
          top: target.y,
          bottom: target.y + 64
        };

        if (this.checkCollision(hitboxBounds, targetBounds)) {
          target.takeDamage(5);
        }
      }

      // Set cooldown
      this.basicAttackCooldown = now + this.basicAttackCooldownTime;

      // Fade out and remove hitbox
      setTimeout(() => {
        hitbox.style.opacity = '0';
        setTimeout(() => {
          hitbox.remove();
        }, 300);
      }, 100);

      setTimeout(() => {
        this.isBasicAttacking = false;
      }, this.basicAttackDuration);
    }
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();
  }

  createHitbox() {
    const hitbox = document.createElement('div');
    hitbox.style.cssText = `
      position: absolute;
      width: 50px;
      height: 50px;
      background: rgba(255, 255, 255, 0.5);
      bottom: 0;
      transition: opacity 0.3s;
      pointer-events: none;
      z-index: 1;
    `;
    hitbox.style.left = `${this.facing > 0 ? 50 : -50}px`;
    return hitbox;
  }

  checkCollision(bounds1, bounds2) {
    return bounds1.left < bounds2.right &&
           bounds1.right > bounds2.left &&
           bounds1.top < bounds2.bottom &&
           bounds1.bottom > bounds2.top;
  }

  updateHealthBar() {
    const isPlayer1 = this === this.game.players[0];
    const healthBar = document.getElementById(isPlayer1 ? 'player1Health' : 'player2Health');
    const healthText = document.getElementById(isPlayer1 ? 'player1HealthText' : 'player2HealthText');
    
    if (healthBar) {
      healthBar.style.width = `${this.health}%`;
    }
    if (healthText) {
      healthText.innerHTML = `<span class="player-label">${isPlayer1 ? 'P1' : 'P2'}</span> ${Math.round(this.health)}`;
    }
  }

  addPlayerIndicator(number) {
    const indicator = document.createElement('div');
    indicator.className = 'player-indicator';
    indicator.textContent = number;
    this.element.appendChild(indicator);
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
    
    // Gravity
    if (this.y < 0) {
      this.dy += 0.8;
    } else {
      this.y = 0;
      this.dy = 0;
      this.isJumping = false;
    }

    // Arena boundaries
    const arenaWidth = this.game.gameArea.clientWidth;
    const characterWidth = 64; // Width of character sprite
    
    if (this.x < 0) {
      this.x = 0;
    } else if (this.x > arenaWidth - characterWidth) {
      this.x = arenaWidth - characterWidth;
    }
    
    this.element.style.transform = `translateX(${this.x}px) translateY(${this.y}px)`;
  }
}