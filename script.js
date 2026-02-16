document.addEventListener('DOMContentLoaded', () => {
  // GameConfig - Zentrale Spielkonfiguration
  const GameConfig = {
    GRID_SIZE: 20,
    TILE_SIZE: 20,
    CANVAS_WIDTH: 400,
    CANVAS_HEIGHT: 400,
    GAME_SPEED: 100,
    COLORS: {
      BACKGROUND: '#1a1a2e',
      GRID: '#16213e',
      SNAKE_HEAD: '#00ff41',
      SNAKE_BODY: '#00cc33',
      FOOD: '#ff0080',
      TEXT: '#ffffff'
    },
    DIRECTIONS: {
      UP: { x: 0, y: -1 },
      DOWN: { x: 0, y: 1 },
      LEFT: { x: -1, y: 0 },
      RIGHT: { x: 1, y: 0 }
    }
  };

  // Snake-Klasse - Verwaltet die Schlange
  class Snake {
    constructor() {
      this.segments = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
      ];
      this.direction = GameConfig.DIRECTIONS.RIGHT;
      this.nextDirection = GameConfig.DIRECTIONS.RIGHT;
      this.growing = false;
    }

    // Schlange wächst beim nächsten move()
    grow() {
      this.growing = true;
    }

    // Bewegt die Schlange in aktuelle Richtung
    move() {
      this.direction = this.nextDirection;
      const head = this.segments[0];
      const newHead = {
        x: head.x + this.direction.x,
        y: head.y + this.direction.y
      };

      this.segments.unshift(newHead);

      if (!this.growing) {
        this.segments.pop();
      } else {
        this.growing = false;
      }
    }

    // Prüft ob Schlange sich selbst berührt
    checkSelfCollision() {
      const head = this.segments[0];
      for (let i = 1; i < this.segments.length; i++) {
        if (head.x === this.segments[i].x && head.y === this.segments[i].y) {
          return true;
        }
      }
      return false;
    }

    // Setzt Richtung mit Validierung (keine 180° Drehung)
    setDirection(newDirection) {
      const isOpposite = 
        (newDirection.x === -this.direction.x && newDirection.x !== 0) ||
        (newDirection.y === -this.direction.y && newDirection.y !== 0);
      
      if (!isOpposite) {
        this.nextDirection = newDirection;
      }
    }

    // Gibt Kopfposition zurück
    getHead() {
      return this.segments[0];
    }

    // Reset für Neustart
    reset() {
      this.segments = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
      ];
      this.direction = GameConfig.DIRECTIONS.RIGHT;
      this.nextDirection = GameConfig.DIRECTIONS.RIGHT;
      this.growing = false;
    }
  }

  // Food-Klasse - Verwaltet Nahrung
  class Food {
    constructor() {
      this.position = { x: 15, y: 15 };
    }

    // Generiert zufällige Position ohne Kollision mit Schlange
    randomize(snakeSegments) {
      let validPosition = false;
      let newPosition;

      while (!validPosition) {
        newPosition = {
          x: Math.floor(Math.random() * GameConfig.GRID_SIZE),
          y: Math.floor(Math.random() * GameConfig.GRID_SIZE)
        };

        validPosition = !snakeSegments.some(segment => 
          segment.x === newPosition.x && segment.y === newPosition.y
        );
      }

      this.position = newPosition;
    }

    // Gibt Position zurück
    getPosition() {
      return this.position;
    }
  }

  // Game-Klasse - Hauptspiellogik
  class Game {
    constructor() {
      // Canvas-Setup mit Error-Handling
      this.canvas = document.getElementById('gameCanvas');
      if (!this.canvas) {
        console.error('Canvas element not found');
        return;
      }

      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) {
        console.error('Could not get canvas context');
        return;
      }

      // Screen-Elemente
      this.startScreen = document.getElementById('startScreen');
      this.gameScreen = document.getElementById('gameScreen');
      this.gameOverScreen = document.getElementById('gameOverScreen');
      this.scoreDisplay = document.getElementById('score');
      this.finalScoreDisplay = document.getElementById('finalScore');

      // Button-Elemente
      this.startButton = document.getElementById('startButton');
      this.restartButton = document.getElementById('restartButton');

      // Spielobjekte
      this.snake = new Snake();
      this.food = new Food();

      // Spielzustand
      this.score = 0;
      this.isRunning = false;
      this.isPaused = false;
      this.lastUpdateTime = 0;
      this.animationFrameId = null;

      this.init();
    }

    // Initialisierung
    init() {
      // Canvas-Größe setzen
      this.canvas.width = GameConfig.CANVAS_WIDTH;
      this.canvas.height = GameConfig.CANVAS_HEIGHT;

      // Event-Listener
      this.startButton.addEventListener('click', () => this.start());
      this.restartButton.addEventListener('click', () => this.restart());
      
      // Keyboard-Input
      document.addEventListener('keydown', (e) => this.handleKeyPress(e));

      // Initiale Food-Position
      this.food.randomize(this.snake.segments);

      // Start-Screen anzeigen
      this.showScreen('start');
    }

    // Startet das Spiel
    start() {
      this.isRunning = true;
      this.isPaused = false;
      this.lastUpdateTime = 0;
      this.showScreen('game');
      this.gameLoop(0);
    }

    // Pausiert das Spiel
    pause() {
      this.isPaused = !this.isPaused;
    }

    // Game Over
    gameOver() {
      this.isRunning = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.finalScoreDisplay.textContent = this.score;
      this.showScreen('gameover');
    }

    // Neustart
    restart() {
      this.snake.reset();
      this.food.randomize(this.snake.segments);
      this.score = 0;
      this.updateScore();
      this.start();
    }

    // Haupt-Game-Loop mit requestAnimationFrame
    gameLoop(timestamp) {
      if (!this.isRunning) return;

      this.animationFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));

      if (this.isPaused) return;

      // Zeitbasiertes Update für konstante Geschwindigkeit
      const deltaTime = timestamp - this.lastUpdateTime;
      
      if (deltaTime >= GameConfig.GAME_SPEED) {
        this.update();
        this.lastUpdateTime = timestamp;
      }

      this.render();
    }

    // Update-Logik
    update() {
      // Schlange bewegen
      this.snake.move();

      const head = this.snake.getHead();

      // Wand-Kollision prüfen
      if (this.checkWallCollision(head)) {
        this.gameOver();
        return;
      }

      // Selbst-Kollision prüfen
      if (this.snake.checkSelfCollision()) {
        this.gameOver();
        return;
      }

      // Food-Kollision prüfen
      if (this.checkFoodCollision(head)) {
        this.snake.grow();
        this.score += 10;
        this.updateScore();
        this.food.randomize(this.snake.segments);
      }
    }

    // Render-Funktion
    render() {
      // Canvas leeren
      this.ctx.fillStyle = GameConfig.COLORS.BACKGROUND;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Optional: Raster zeichnen
      this.drawGrid();

      // Food zeichnen
      this.drawFood();

      // Schlange zeichnen
      this.drawSnake();
    }

    // Zeichnet Raster
    drawGrid() {
      this.ctx.strokeStyle = GameConfig.COLORS.GRID;
      this.ctx.lineWidth = 0.5;

      for (let x = 0; x <= GameConfig.GRID_SIZE; x++) {
        this.ctx.beginPath();
        this.ctx.moveTo(x * GameConfig.TILE_SIZE, 0);
        this.ctx.lineTo(x * GameConfig.TILE_SIZE, this.canvas.height);
        this.ctx.stroke();
      }

      for (let y = 0; y <= GameConfig.GRID_SIZE; y++) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y * GameConfig.TILE_SIZE);
        this.ctx.lineTo(this.canvas.width, y * GameConfig.TILE_SIZE);
        this.ctx.stroke();
      }
    }

    // Zeichnet Schlange
    drawSnake() {
      this.snake.segments.forEach((segment, index) => {
        this.ctx.fillStyle = index === 0 ? 
          GameConfig.COLORS.SNAKE_HEAD : 
          GameConfig.COLORS.SNAKE_BODY;
        
        this.ctx.fillRect(
          segment.x * GameConfig.TILE_SIZE + 1,
          segment.y * GameConfig.TILE_SIZE + 1,
          GameConfig.TILE_SIZE - 2,
          GameConfig.TILE_SIZE - 2
        );

        // Kopf mit zusätzlichem Highlight
        if (index === 0) {
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(
            segment.x * GameConfig.TILE_SIZE + 1,
            segment.y * GameConfig.TILE_SIZE + 1,
            GameConfig.TILE_SIZE - 2,
            GameConfig.TILE_SIZE - 2
          );
        }
      });
    }

    // Zeichnet Food als Kreis
    drawFood() {
      const centerX = this.food.position.x * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2;
      const centerY = this.food.position.y * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2;
      const radius = GameConfig.TILE_SIZE / 2 - 2;

      this.ctx.fillStyle = GameConfig.COLORS.FOOD;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Zusätzlicher Glow-Effekt
      this.ctx.strokeStyle = '#ff66b2';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Prüft Wand-Kollision
    checkWallCollision(head) {
      return head.x < 0 || 
             head.x >= GameConfig.GRID_SIZE || 
             head.y < 0 || 
             head.y >= GameConfig.GRID_SIZE;
    }

    // Prüft Food-Kollision
    checkFoodCollision(head) {
      return head.x === this.food.position.x && 
             head.y === this.food.position.y;
    }

    // Keyboard-Input-Handler
    handleKeyPress(e) {
      // Input Lag minimieren durch preventDefault
      const key = e.key.toLowerCase();

      // Richtungstasten
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
        e.preventDefault();
      }

      if (!this.isRunning || this.isPaused) {
        if (key === ' ') {
          e.preventDefault();
        }
        return;
      }

      switch(key) {
        case 'arrowup':
        case 'w':
          this.snake.setDirection(GameConfig.DIRECTIONS.UP);
          break;
        case 'arrowdown':
        case 's':
          this.snake.setDirection(GameConfig.DIRECTIONS.DOWN);
          break;
        case 'arrowleft':
        case 'a':
          this.snake.setDirection(GameConfig.DIRECTIONS.LEFT);
          break;
        case 'arrowright':
        case 'd':
          this.snake.setDirection(GameConfig.DIRECTIONS.RIGHT);
          break;
        case ' ':
          e.preventDefault();
          this.pause();
          break;
      }
    }

    // Aktualisiert Score-Anzeige
    updateScore() {
      if (this.scoreDisplay) {
        this.scoreDisplay.textContent = this.score;
      }
    }

    // Screen-Management
    showScreen(screen) {
      this.startScreen.classList.add('hidden');
      this.gameScreen.classList.add('hidden');
      this.gameOverScreen.classList.add('hidden');

      switch(screen) {
        case 'start':
          this.startScreen.classList.remove('hidden');
          break;
        case 'game':
          this.gameScreen.classList.remove('hidden');
          this.updateScore();
          break;
        case 'gameover':
          this.gameOverScreen.classList.remove('hidden');
          break;
      }
    }
  }

  // Spiel-Instanz erstellen und starten
  try {
    const game = new Game();
  } catch (error) {
    console.error('Error initializing game:', error);
  }
});
