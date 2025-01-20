import { Character } from './character.js';

export class Sonic extends Character {
  constructor(x, y, game) {
    super(x, y, game);
    
    this.sprites = {
      idle: '/sonicidle.gif',
      walking: '/sonicwalking.gif',
      jumping: '/sonicjump.gif',
      hit: '/sonicgethit.gif',
      win: '/sonicwin.gif',
      fail: '/sonicfail.gif'
    };
    
    // Preload all images to prevent lag during first load
    this.imageCache = {};
    Object.entries(this.sprites).forEach(([key, src]) => {
      this.imageCache[key] = new Image();
      this.imageCache[key].src = src;
    });
    
    this.img = document.createElement('img');
    this.img.src = this.sprites.idle;
    this.element.appendChild(this.img);
    
    this.attackSpeed = 15;
    this.attackTarget = null;
    this.originalX = 0;
    this.isHit = false;
    this.hitAnimationDuration = 500;
    this.currentState = 'idle';
    this.attackDuration = 1000; // 1 second attack duration
    this.canAirDash = true;
    this.dashSpeed = 20;
    this.dashDuration = 300;
    this.jumpAttackActive = false;
    this.isBasicAttacking = false; // added this property to prevent conflicts
    this.isAttacking = false; // added this property to prevent conflicts
    this.attackHitbox = {
      width: 50,
      height: 50
    };
  }

  checkCollision(bounds1, bounds2) {
    return bounds1.left < bounds2.right &&
           bounds1.right > bounds2.left &&
           bounds1.top < bounds2.bottom &&
           bounds1.bottom > bounds2.top;
  }

  setState(state) {
    if (this.currentState !== state) {
      this.currentState = state;
      this.img.src = this.sprites[state];
    }
  }

  move(direction) {
    if (!this.isHit && !this.isAttacking) {
      super.move(direction);
      if (!this.isJumping) {
        this.setState(direction === 0 ? 'idle' : 'walking');
      }
    }
  }

  jump() {
    if (!this.isAttacking && !this.isHit) {
      super.jump();
      this.setState('jumping');
    }
  }

  attack(target) {
    if ((!this.isAttacking && !this.isHit && !this.isBasicAttacking) && (this.canAirDash || !this.isJumping)) {
      this.isAttacking = true;
      this.attackTarget = target;
      this.originalX = this.x;
      this.setState('jumping');
      
      const distance = Math.abs(this.x - target.x);
      const damage = Math.min(4, Math.max(3, distance / 100));
      
      this.dx = this.facing * (this.isJumping ? this.dashSpeed : this.attackSpeed);
      
      if (this.isJumping) {
        this.canAirDash = false;
      }

      setTimeout(() => {
        if (this.isAttacking) {
          this.isAttacking = false;
          this.attackTarget = null;
          this.dx = 0;
          this.setState(this.isJumping ? 'jumping' : 'idle');
        }
      }, this.dashDuration);
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
      }, this.hitAnimationDuration);
    }
  }

  update() {
    super.update();
    
    // Check for jump collision with other character
    if (this.isJumping && this.currentState === 'jumping' && !this.isAttacking) {
      const otherPlayer = this.game.players.find(p => p !== this);
      if (otherPlayer) {
        const myBounds = {
          left: this.x,
          right: this.x + 64,
          top: this.y,
          bottom: this.y + 64
        };

        const otherBounds = {
          left: otherPlayer.x,
          right: otherPlayer.x + 64,
          top: otherPlayer.y,
          bottom: otherPlayer.y + 64
        };

        if (this.checkCollision(myBounds, otherBounds)) {
          if (otherPlayer.constructor.name === 'Sonic' && 
              otherPlayer.isJumping && 
              otherPlayer.currentState === 'jumping') {
            // Both Sonics jumping - bounce off each other
            const dx = this.x < otherPlayer.x ? -10 : 10;
            this.dx = dx;
            otherPlayer.dx = -dx;
            this.dy = -10;
            otherPlayer.dy = -10;
          } else if (!this.jumpAttackActive) {
            // Regular jump attack
            this.jumpAttackActive = true;
            otherPlayer.takeDamage(3);
            setTimeout(() => {
              this.jumpAttackActive = false;
            }, 500);
          }
        }
      }
    }

    // Handle dash collision with proper vertical collision check
    if (this.isAttacking) {
      const otherPlayer = this.game.players.find(p => p !== this);
      
      if (otherPlayer && otherPlayer.constructor.name === 'Sonic' && otherPlayer.isAttacking) {
        // Check if dashing Sonics are about to collide
        const distance = Math.abs(this.x - otherPlayer.x);
        if (distance < 50) {
          // Bounce both Sonics back
          this.isAttacking = false;
          otherPlayer.isAttacking = false;
          this.dx = this.facing * -15;
          otherPlayer.dx = otherPlayer.facing * -15;
          setTimeout(() => {
            this.dx = 0;
            otherPlayer.dx = 0;
          }, 200);
        }
      }
    }

    if (this.isAttacking) {
      const target = this.attackTarget;
      if (target) {
        const myHitbox = {
          left: this.x + (this.facing > 0 ? 30 : -30),
          right: this.x + (this.facing > 0 ? 30 + this.attackHitbox.width : 30),
          top: this.y,
          bottom: this.y + this.attackHitbox.height
        };

        const targetHitbox = {
          left: target.x,
          right: target.x + 64,
          top: target.y,
          bottom: target.y + 64
        };

        // Check both horizontal and vertical collision
        if (this.checkCollision(myHitbox, targetHitbox)) {
          const distance = Math.abs(this.originalX - this.x);
          const damage = Math.min(4, Math.max(3, distance / 100));
          target.takeDamage(damage);
          this.isAttacking = false;
          this.attackTarget = null;
          this.dx = 0;
          this.setState('idle');
        }
      }
    }

    if (!this.isJumping) {
      this.canAirDash = true;
    }
    
    if (!this.isJumping && !this.isAttacking && !this.isHit && Math.abs(this.dx) < 0.1) {
      this.setState('idle');
    }
  }
}