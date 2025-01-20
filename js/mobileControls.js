export class MobileControls {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.joystickActive = false;
    this.moveDirection = 0;
    
    this.setupControls();
  }

  setupControls() {
    const checkbox = document.getElementById('mobileControls');
    const controls = document.querySelector('.mobile-controls');
    const joystickArea = document.getElementById('joystickArea');
    const joystick = document.getElementById('joystick');
    const jumpButton = document.getElementById('jumpButton');
    const punchButton = document.getElementById('punchButton');
    const specialButton = document.getElementById('specialButton');

    checkbox.addEventListener('change', (e) => {
      this.active = e.target.checked;
      controls.style.display = this.active ? 'block' : 'none';
    });

    // Joystick controls
    const handleJoystickMove = (e) => {
      if (!this.joystickActive) return;
      
      const rect = joystickArea.getBoundingClientRect();
      const centerX = rect.width / 2;
      
      let clientX;
      if (e.touches) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }
      
      const x = clientX - rect.left;
      const offset = Math.min(Math.max(x - centerX, -centerX), centerX);
      
      joystick.style.transform = `translate(${offset}px, -50%)`;
      
      // Calculate move direction (-1, 0, or 1)
      if (Math.abs(offset) < 10) {
        this.moveDirection = 0;
      } else {
        this.moveDirection = offset > 0 ? 1 : -1;
      }
    };

    const handleJoystickEnd = () => {
      this.joystickActive = false;
      this.moveDirection = 0;
      joystick.style.transform = 'translate(-50%, -50%)';
    };

    // Joystick touch/mouse events
    joystickArea.addEventListener('mousedown', (e) => {
      this.joystickActive = true;
      handleJoystickMove(e);
    });
    joystickArea.addEventListener('touchstart', (e) => {
      this.joystickActive = true;
      handleJoystickMove(e);
    });

    document.addEventListener('mousemove', (e) => {
      if (this.joystickActive) handleJoystickMove(e);
    });
    document.addEventListener('touchmove', (e) => {
      if (this.joystickActive) handleJoystickMove(e);
    });

    document.addEventListener('mouseup', handleJoystickEnd);
    document.addEventListener('touchend', handleJoystickEnd);

    // Action buttons
    ['mousedown', 'touchstart'].forEach(event => {
      jumpButton.addEventListener(event, () => {
        if (this.active && this.game.players[0]) {
          this.game.players[0].jump();
        }
      });

      punchButton.addEventListener(event, () => {
        if (this.active && this.game.players[0] && this.game.players[1]) {
          this.game.players[0].basicAttack(this.game.players[1]);
        }
      });

      specialButton.addEventListener(event, () => {
        if (this.active && this.game.players[0] && this.game.players[1]) {
          this.game.players[0].attack(this.game.players[1]);
        }
      });
    });
  }

  update() {
    if (this.active && this.game.players[0]) {
      this.game.players[0].move(this.moveDirection);
    }
  }
}