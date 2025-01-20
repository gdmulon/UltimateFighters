import { Character } from './character.js';

export class Nerd extends Character {
  constructor(x, y, game) {
    super(x, y, game);
    
    this.sprites = {
      idle: '/nerdidle.gif',
      walking: '/nerdwalk.gif',
      attack: '/nerd attack.gif',
      hit: '/nerdgethit.gif',
      win: '/nerdwin.gif',
      fail: '/nerdlose.gif'
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
    this.attackCooldown = 0;
    this.attackCooldownTime = 1000;
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
    }
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

  attack(target) {
    this.basicAttack(target); // Nerd uses the basic attack for both space and E
  }

  basicAttack(target) {
    const now = Date.now();
    if (!this.isAttacking && !this.isJumping && (!this.attackCooldown || now > this.attackCooldown)) {
      this.isAttacking = true;
      this.setState('attack');

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
      this.attackCooldown = now + this.attackCooldownTime;

      // Fade out and remove hitbox
      setTimeout(() => {
        hitbox.style.opacity = '0';
        setTimeout(() => {
          hitbox.remove();
        }, 300);
      }, 100);

      setTimeout(() => {
        this.isAttacking = false;
        this.setState('idle');
      }, this.attackDuration);
    }
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
  }

  checkCollision(bounds1, bounds2) {
    return bounds1.left < bounds2.right &&
           bounds1.right > bounds2.left &&
           bounds1.top < bounds2.bottom &&
           bounds1.bottom > bounds2.top;
  }
}