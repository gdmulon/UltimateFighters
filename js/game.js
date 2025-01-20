import { Character } from './character.js';
import { Sonic } from './sonic.js';
import { Mario } from './mario.js';
import { Nerd } from './nerd.js';
import { MobileControls } from './mobileControls.js';

export class Game {
  constructor() {
    this.difficulty = 'normal';
    this.init();
    this.animationFrameId = null; 
    this.setupBackgroundMusic();
    this.setupCharacterSelectMusic();
    this.mobileControls = new MobileControls(this);
  }

  setupCharacterSelectMusic() {
    this.characterSelectMusic = document.getElementById('characterSelectMusic');
    this.characterSelectMusic.volume = 0.5; // Lowered volume for better balance
    // Attempt to play and handle any autoplay restrictions
    this.characterSelectMusic.play().catch(e => {
      console.log("Audio playback prevented, waiting for user interaction");
      // Add click handler to start music on first interaction
      document.addEventListener('click', () => {
        this.characterSelectMusic.play().catch(e => console.log("Audio still prevented:", e));
      }, { once: true });
    });
  }

  setupBackgroundMusic() {
    this.backgroundMusic = document.getElementById('gameplayMusic');
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.5; // Lowered volume for better balance
  }

  init() {
    this.characterSelect = document.getElementById('characterSelect');
    this.game = document.getElementById('game');
    this.gameArea = document.getElementById('gameArea');
    this.players = [];
    this.gameOver = false;
    
    this.setupDifficultyButtons();
    this.setupInstructionsButton();
    
    const characterCards = document.querySelectorAll('.character-card');
    characterCards.forEach(card => {
      card.addEventListener('click', () => {
        const aiType = document.getElementById('aiType').value;
        const selectedCharacter = card.dataset.character;
        this.characterSelect.style.display = 'none';
        this.game.style.display = 'block';
        this.startGame(aiType, selectedCharacter);
      });
    });
  }

  setupDifficultyButtons() {
    const buttons = document.querySelectorAll('.difficulty-buttons button');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('selected'));
        button.classList.add('selected');
        this.difficulty = button.dataset.difficulty;
      });
    });
  }

  setupInstructionsButton() {
    const instructionsButton = document.getElementById('instructionsButton');
    instructionsButton.addEventListener('click', () => {
      const overlay = document.createElement('div');
      overlay.className = 'popup-overlay';
      document.body.appendChild(overlay);

      const popup = document.createElement('div');
      popup.className = 'instructions-popup';
      popup.innerHTML = `
        <button class="close-button">&times;</button>
        <h2>Game Controls</h2>
        
        <div class="controls-section">
          <h3>Keyboard Controls</h3>
          <ul>
            <li><span class="key">W</span> Jump</li>
            <li><span class="key">A</span> Move Left</li>
            <li><span class="key">D</span> Move Right</li>
            <li><span class="key">Space</span> Basic Attack (All characters can punch)</li>
            <li><span class="key">S</span> Special Ability (Not available for Nerd)</li>
          </ul>
        </div>
        
        <div class="controls-section">
          <h3>Mobile Controls</h3>
          <ul>
            <li>Use the <strong>joystick</strong> on the left side to move</li>
            <li>Press <strong>JUMP</strong> button to jump</li>
            <li>Press <strong>PUNCH</strong> button for basic attack (Available for all characters)</li>
            <li>Press <strong>SPECIAL</strong> button to use special ability (Not available for Nerd)</li>
            <li>Enable mobile controls using the checkbox at the top right</li>
          </ul>
        </div>
        
        <div class="controls-section">
          <h3>Character Abilities</h3>
          <ul>
            <li><strong>Sonic:</strong> Fast dash attack that can be used in air (Special)</li>
            <li><strong>Mario:</strong> Throws bouncing shells (Special)</li>
            <li><strong>Nerd:</strong> Only has basic punch attack - no special abilities</li>
          </ul>
        </div>
      `;
      document.body.appendChild(popup);

      const closeButton = popup.querySelector('.close-button');
      const closePopup = () => {
        document.body.removeChild(popup);
        document.body.removeChild(overlay);
      };
      
      closeButton.addEventListener('click', closePopup);
      overlay.addEventListener('click', closePopup);
    });
  }

  startGame(aiType, playerCharacter) {
    this.characterSelectMusic.pause();
    this.characterSelectMusic.currentTime = 0;
    
    this.backgroundMusic.currentTime = 0;
    this.backgroundMusic.play().catch(e => console.log("Game audio playback failed:", e));
    
    this.setupPlayers(aiType, playerCharacter);
    this.setupControls();
    this.gameLoop();
  }

  createAICharacter(aiType) {
    const playerCharacter = this.players[0] ? this.players[0].constructor.name.toLowerCase() : null;
    
    if (aiType === 'random') {
      let possibleCharacters = ['sonic', 'mario', 'nerd'];
      // Remove the player's character from possible choices if it exists
      if (playerCharacter) {
        possibleCharacters = possibleCharacters.filter(char => char !== playerCharacter);
      }
      // Randomly select from remaining characters
      const randomChar = possibleCharacters[Math.floor(Math.random() * possibleCharacters.length)];
      switch (randomChar) {
        case 'sonic':
          return new Sonic(700, 0, this);
        case 'mario':
          return new Mario(700, 0, this);
        case 'nerd':
          return new Nerd(700, 0, this);
      }
    } else {
      switch (aiType) {
        case 'sonic':
          return new Sonic(700, 0, this);
        case 'mario':
          return new Mario(700, 0, this);
        case 'nerd':
          return new Nerd(700, 0, this);
      }
    }
    
    // Default to Mario if something goes wrong
    return new Mario(700, 0, this);
  }

  setupPlayers(aiType, playerCharacter) {
    // Clear existing players and reset health bars
    this.players = [];
    document.getElementById('player1Health').style.width = '100%';
    document.getElementById('player2Health').style.width = '100%';
    document.getElementById('player1HealthText').innerHTML = '<span class="player-label">P1</span> 100';
    document.getElementById('player2HealthText').innerHTML = '<span class="player-label">P2</span> 100';
    
    // Create player character
    let PlayerClass;
    switch (playerCharacter) {
      case 'sonic':
        PlayerClass = Sonic;
        break;
      case 'mario':
        PlayerClass = Mario;
        break;
      case 'nerd':
        PlayerClass = Nerd;
        break;
      default:
        PlayerClass = Mario;
    }
    const player = new PlayerClass(100, 0, this);
    this.players.push(player);
    
    // Create AI character
    const aiCharacter = this.createAICharacter(aiType);
    if (aiCharacter) {
      aiCharacter.isAI = true;
      this.players.push(aiCharacter);
    }
    
    // Add player indicators
    this.players[0].addPlayerIndicator('P1');
    if (this.players[1]) {
      this.players[1].addPlayerIndicator('P2');
    }
    
    // Add characters to game area
    this.players.forEach(player => {
      this.gameArea.appendChild(player.element);
    });
  }

  setupControls() {
    const keys = {};
    
    window.addEventListener('keydown', (e) => {
      keys[e.key] = true;
      this.handleInput(keys);
    });

    window.addEventListener('keyup', (e) => {
      keys[e.key] = false;
      this.handleInput(keys);
    });
  }

  handleInput(keys) {
    // Add safety check to ensure player exists
    if (!this.players || !this.players[0]) return;
    
    const player = this.players[0];
    const otherPlayer = this.players[1];
    
    if (this.gameOver) return; // Don't process input if game is over
    
    if (keys['a'] || keys['A']) {
      player.move(-1);
    } else if (keys['d'] || keys['D']) {
      player.move(1);
    } else {
      player.move(0);
    }

    if (keys['w'] || keys['W']) {
      player.jump();
    }

    // Basic attack with space
    if (keys[' '] && otherPlayer) {
      player.basicAttack(otherPlayer);
    }

    // Special abilities with S instead of E
    if ((keys['s'] || keys['S']) && otherPlayer) {
      player.attack(otherPlayer);
    }
  }

  getDifficultySettings() {
    const settings = {
      easy: {
        reactionTime: 0.01,
        attackFrequency: 0.01,
        smartness: 0.3
      },
      normal: {
        reactionTime: 0.02,
        attackFrequency: 0.02,
        smartness: 0.5
      },
      hard: {
        reactionTime: 0.03,
        attackFrequency: 0.03,
        smartness: 0.7
      },
      insane: {
        reactionTime: 0.04,
        attackFrequency: 0.04,
        smartness: 0.9
      }
    };
    return settings[this.difficulty];
  }

  updateAI() {
    if (!this.players || this.players.length < 2) return;
    
    const ai = this.players[1];
    const player = this.players[0];
    
    if (!ai || !player || !ai.isAI) return;

    const settings = this.getDifficultySettings();
    const distance = Math.abs(ai.x - player.x);

    // Only run away in Easy mode
    const shouldRunAway = this.difficulty === 'easy' && distance < 150;
    
    // Check if player is dashing
    const isPlayerDashing = player.constructor.name === 'Sonic' && player.isAttacking;
    const isPlayerInAir = player.isJumping;

    // Check if AI is stuck in corner
    const arenaWidth = this.gameArea.clientWidth;
    const isNearLeftWall = ai.x < 50;
    const isNearRightWall = ai.x > arenaWidth - 114; // 64 (character width) + 50
    const isStuck = (isNearLeftWall || isNearRightWall) && !ai.isJumping;

    if (isStuck) {
      // Jump and move away from the wall
      ai.jump();
      if (isNearLeftWall) {
        ai.move(1); // Move right
      } else {
        ai.move(-1); // Move left
      }
    } else if (ai.constructor.name === 'Sonic') {
      // Sonic AI behavior
      if (distance > 200) {
        // Close the distance aggressively
        ai.move(player.x > ai.x ? 1 : -1);
      } else if (distance < 200) {
        // Smart positioning
        if (isPlayerDashing && !isPlayerInAir && Math.random() < settings.smartness) {
          // Jump over dashing player
          ai.jump();
          if (Math.random() < settings.smartness) {
            setTimeout(() => ai.attack(player), 200);
          }
        } else if (Math.random() < settings.attackFrequency) {
          // Regular attack
          ai.attack(player);
        }
      }

      // Random jumps and attacks for unpredictability
      if (Math.random() < settings.reactionTime) {
        if (!isPlayerDashing || !isPlayerInAir) {
          ai.jump();
          if (Math.random() < settings.smartness * 0.7) {
            setTimeout(() => ai.attack(player), 100);
          }
        }
      }
    } else if (ai.constructor.name === 'Mario') {
      const optimalShellDistance = 250; // Best distance for shell throwing
      
      if (distance > optimalShellDistance + 50) {
        // Get closer to optimal range
        ai.move(player.x > ai.x ? 1 : -1);
      } else if (distance < optimalShellDistance - 50) {
        // Back up to optimal range
        ai.move(player.x > ai.x ? -1 : 1);
      } else {
        // At optimal range, focus on attacking
        if (Math.random() < settings.attackFrequency * 1.5) {
          const now = Date.now();
          if (!ai.shellCooldown || now > ai.shellCooldown) {
            ai.attack(player);
          }
        }
      }

      // Smart defensive moves
      if (isPlayerDashing && !isPlayerInAir && distance < 150) {
        if (Math.random() < settings.smartness) {
          ai.jump(); // Jump over incoming dash
          // Counter-attack with shell while in air
          if (Math.random() < settings.smartness * 0.8) {
            setTimeout(() => ai.attack(player), 200);
          }
        }
      }
    } else if (ai.constructor.name === 'Nerd') {
      // Nerd AI behavior
      const optimalPunchDistance = 100;

      if (distance > optimalPunchDistance + 50) {
        // Get closer to optimal range
        ai.move(player.x > ai.x ? 1 : -1);
      } else if (distance <= optimalPunchDistance) {
        // At optimal range, focus on attacking
        if (Math.random() < settings.attackFrequency * 1.5) {
          ai.attack(player);
        }
      }

      // Smart defensive moves
      if (isPlayerDashing && !isPlayerInAir && distance < 150) {
        if (Math.random() < settings.smartness) {
          ai.jump(); // Jump over incoming dash
        }
      }
    }
  }

  checkWinCondition() {
    const player1 = this.players[0];
    const player2 = this.players[1];

    if (player1.health <= 0 || player2.health <= 0) {
      this.gameOver = true;
      const winner = player1.health <= 0 ? player2 : player1;
      const loser = player1.health <= 0 ? player1 : player2;
      const winnerNumber = winner === player1 ? '1' : '2';
      
      winner.setState('win');
      loser.setState('fail');
      
      const winScreen = document.createElement('div');
      winScreen.className = 'win-screen';
      winScreen.innerHTML = `
        <div class="win-characters">
          <div class="character-display ${loser === player1 ? 'loser' : 'winner'}">
            <div class="player-number">P1</div>
            <img src="${loser === player1 ? this.players[0].sprites.fail : this.players[0].sprites.win}" alt="Player 1">
          </div>
          <div class="character-display ${winner === player2 ? 'winner' : 'loser'}">
            <div class="player-number">P2</div>
            <img src="${winner === player2 ? this.players[1].sprites.win : this.players[1].sprites.fail}" alt="Player 2">
          </div>
        </div>
        <h1>Player ${winnerNumber} Wins!</h1>
        <button id="playAgain">Play Again</button>
      `;
      document.body.appendChild(winScreen);

      document.getElementById('playAgain').addEventListener('click', () => {
        document.body.removeChild(winScreen);
        this.resetGame();
      });
    }
  }

  resetGame() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId); 
      this.animationFrameId = null;
    }
    
    this.backgroundMusic.pause();
    this.backgroundMusic.currentTime = 0;
    
    this.characterSelectMusic.currentTime = 0;
    this.characterSelectMusic.play().catch(e => console.log("Character select audio playback failed:", e));
    
    this.gameOver = false;
    this.gameArea.innerHTML = '';
    this.characterSelect.style.display = 'flex';
    this.game.style.display = 'none';
    this.players = [];
  }

  gameLoop() {
    if (!this.gameOver) {
      const timestamp = performance.now();
      if (this.players && this.players.length === 2) {
        this.updateAI();
        this.players.forEach(player => player.update());
        this.mobileControls.update();
        this.checkWinCondition();
      }
      this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});