import { Character } from './character.js';

export class Mario extends Character {
  constructor(x, y, game) {
    super(x, y, game);
    
    this.sprites = {
      idle: '/marioidle.gif',
      walking: '/mariowalk.gif',
      jumping: '/mariojump.gif',
      throwShell: '/mariothrowshell.gif',
      shell: '/marioshell.gif',
      win: '/mariowin.gif',
      fail: '/mariofail.gif',
      hit: '/mariogethit.gif'
    };
    
    // Preload all images
    this.imageCache = {};
    Object.entries(this.sprites).forEach(([key, src]) => {
      this.imageCache[key] = new Image();
      this.imageCache[key].src = src;
    });
    
    this.img = document.createElement('img');
    this.img.src = this.sprites.idle;
    this.element.appendChild(this.img);
    
    this.currentState = 'idle';
    this.attackDuration = 500;
    this.activeShells = [];

    this.shellCooldown = 0;
    this.shellCooldownTime = 5000; // 5 seconds
    
    // Add cooldown timer element
    this.cooldownTimer = document.createElement('div');
    this.cooldownTimer.style.cssText = `
      position: absolute;
      top: -40px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 2px 8px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      display: none;
    `;
    this.element.appendChild(this.cooldownTimer);
  }

  setState(state) {
    if (this.currentState !== state) {
      this.currentState = state;
      this.img.src = this.sprites[state];
    }
  }

  move(direction) {
    if (!this.isAttacking) {
      super.move(direction);
      if (!this.isJumping) {
        this.setState(direction === 0 ? 'idle' : 'walking');
      }
    }
  }

  jump() {
    if (!this.isAttacking) {
      super.jump();
      this.setState('jumping');
    }
  }

  createShell() {
    const shell = document.createElement('div');
    shell.className = 'shell';
    const shellImg = document.createElement('img');
    shellImg.src = this.sprites.shell;
    shell.appendChild(shellImg);
    this.game.gameArea.appendChild(shell);

    const facing = this.facing;
    return {
      element: shell,
      x: this.x + (facing > 0 ? 50 : -50),
      y: 0, 
      dx: facing * 10,
      dy: 0,
      bounceCount: 0,
      owner: this,
      lastHitTime: null
    };
  }

  attack(target) {
    const now = Date.now();
    if (!this.isAttacking && !this.isJumping && (!this.shellCooldown || now > this.shellCooldown) && !this.isBasicAttacking) {
      this.isAttacking = true;
      this.setState('throwShell');

      // Create and throw shell
      const shell = this.createShell();
      this.activeShells.push(shell);

      // Set cooldown
      this.shellCooldown = now + this.shellCooldownTime;
      this.updateCooldownTimer();

      setTimeout(() => {
        this.isAttacking = false;
        this.setState('idle');
      }, this.attackDuration);
    }
  }

  updateShells(target) {
    this.activeShells = this.activeShells.filter(shell => {
      // Move shell
      shell.x += shell.dx;
      shell.y += shell.dy;
      
      // Apply gravity
      shell.dy += 0.8;
      
      // Ground collision
      if (shell.y > 0) {
        shell.y = 0;
        shell.dy = 0;
      }
      
      // Check arena boundaries
      const arenaWidth = this.game.gameArea.clientWidth;
      if (shell.x <= 0 || shell.x >= arenaWidth - 32) {
        shell.dx *= -1; 
        shell.bounceCount++;
        
        // Remove shell after third bounce
        if (shell.bounceCount >= 3) {
          shell.element.remove();
          return false;
        }
      }

      // Check collision with target
      if (target !== shell.owner) { 
        const shellBounds = {
          left: shell.x,
          right: shell.x + 32,
          top: shell.y,
          bottom: shell.y + 32
        };

        const targetBounds = {
          left: target.x,
          right: target.x + 64,
          top: target.y,
          bottom: target.y + 64
        };

        // Add hit cooldown check
        const now = Date.now();
        if (this.checkCollision(shellBounds, targetBounds) && (!shell.lastHitTime || now - shell.lastHitTime > 200)) {
          target.takeDamage(5);
          shell.dx *= -1; // Bounce off target
          shell.lastHitTime = now; // Set the last hit time
        }
      }

      // Update shell position 
      shell.element.style.transform = `translateX(${shell.x}px) translateY(${shell.y}px)`;
      return true;
    });
  }

  checkCollision(bounds1, bounds2) {
    return bounds1.left < bounds2.right &&
           bounds1.right > bounds2.left &&
           bounds1.top < bounds2.bottom &&
           bounds1.bottom > bounds2.top;
  }

  updateCooldownTimer() {
    const updateTimer = () => {
      const now = Date.now();
      if (this.shellCooldown && now < this.shellCooldown) {
        const remaining = Math.ceil((this.shellCooldown - now) / 1000);
        this.cooldownTimer.textContent = `${remaining}s`;
        this.cooldownTimer.style.display = 'block';
        requestAnimationFrame(updateTimer);
      } else {
        this.cooldownTimer.style.display = 'none';
      }
    };
    updateTimer();
  }

  takeDamage(amount) {
    super.takeDamage(amount);
    if (!this.isHit) {
      this.isHit = true;
      this.setState('hit');
      this.dx = 0;
      
      setTimeout(() => {
        this.isHit = false;
        this.setState('idle');
      }, 500);
    }
  }

  update() {
    super.update();
    
    if (!this.isJumping && !this.isAttacking && Math.abs(this.dx) < 0.1) {
      this.setState('idle');
    }

    // Update all active shells against both players
    if (this.game.players) {
      this.game.players.forEach(player => {
        this.updateShells(player);
      });
    }
  }
}