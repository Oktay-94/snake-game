'use strict';

(function() {
  // KONSTANTEN
  const GRID_SIZE = 20;
  const CELL_SIZE = 20;
  const CANVAS_SIZE = 400;
  const INITIAL_SPEED = 150;
  const SPEED_INCREMENT = 0.9;
  const MIN_SPEED = 50;
  const POINTS_PER_FOOD = 10;
  const SPEED_INCREASE_INTERVAL = 5;
  const INITIAL_SNAKE_LENGTH = 3;
  
  const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
  };
  
  const COLORS = {
    primary: '#2ecc71',
    secondary: '#34495e',
    background: '#1a1a2e',
    surface: '#16213e',
    snake_head: '#27ae60',
    snake_body: '#2ecc71',
    food: '#e74c3c',
    grid: '#0f3460',
    text_primary: '#ecf0f1',
    text_secondary: '#95a5a6',
    overlay: 'rgba(0, 0, 0, 0.7)',
    error: '#c0392b'
  };

  // STATE
  let gameState = {
    currentScreen: 'start',
    score: 0,
    highscore: 0,
    foodCount: 0
  };

  let snake = {
    segments: [],
    direction: DIRECTIONS.RIGHT,
    nextDirection: null
  };

  let food = {
    x: 0,
    y: 0
  };

  let gameLoop = {
    intervalId: null,
    currentSpeed: INITIAL_SPEED
  };

  let shouldGrow = false;
  let ctx = null;

  // DOM ELEMENTS
  let elements = {};

  // INITIALISIERUNG
  document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    initializeCanvas();
    loadHighscore();
    registerEventListeners();
    showScreen('start');
  });

  function initializeElements() {
    const ids = [
      'start-screen', 'game-screen', 'game-over-screen', 'pause-overlay',
      'canvas-game', 'score-display', 'highscore-display', 'current-score-display',
      'final-score-display', 'start-highscore-display', 'start-btn', 'restart-btn'
    ];
    
    ids.forEach(id => {
      elements[id] = document.getElementById(id);
      if (!elements[id]) {
        console.error('Element not found:', id);
      }
    });
  }

  function initializeCanvas() {
    if (!elements['canvas-game']) return;
    ctx = elements['canvas-game'].getContext('2d');
  }

  function loadHighscore() {
    try {
      const saved = localStorage.getItem('snakeHighscore');
      gameState.highscore = saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      console.error('localStorage error:', e);
      gameState.highscore = 0;
    }
  }

  function registerEventListeners() {
    if (elements['start-btn']) {
      elements['start-btn'].addEventListener('click', startGame);
    }
    if (elements['restart-btn']) {
      elements['restart-btn'].addEventListener('click', resetAndStartGame);
    }
    document.addEventListener('keydown', handleKeyPress);
  }

  function showScreen(screenName) {
    const screens = ['start-screen', 'game-screen', 'game-over-screen'];
    screens.forEach(screen => {
      if (elements[screen]) {
        elements[screen].classList.add('hidden');
      }
    });

    gameState.currentScreen = screenName;

    if (screenName === 'start' && elements['start-screen']) {
      elements['start-screen'].classList.remove('hidden');
      updateStartHighscore();
    } else if (screenName === 'playing' && elements['game-screen']) {
      elements['game-screen'].classList.remove('hidden');
    } else if (screenName === 'gameOver' && elements['game-over-screen']) {
      elements['game-over-screen'].classList.remove('hidden');
    }
  }

  function updateStartHighscore() {
    if (elements['start-highscore-display']) {
      elements['start-highscore-display'].textContent = 'Highscore: ' + gameState.highscore;
    }
  }

  function startGame() {
    if (elements['start-btn']) {
      elements['start-btn'].disabled = true;
    }

    gameState.score = 0;
    gameState.foodCount = 0;
    gameLoop.currentSpeed = INITIAL_SPEED;
    shouldGrow = false;

    initializeSnake();
    spawnFood();
    showScreen('playing');
    updateScore();
    startGameLoop();

    if (elements['start-btn']) {
      elements['start-btn'].disabled = false;
    }
  }

  function initializeSnake() {
    const startX = Math.floor(Math.random() * (GRID_SIZE - 8)) + 4;
    const startY = Math.floor(Math.random() * (GRID_SIZE - 8)) + 4;
    
    snake.segments = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      snake.segments.push({ x: startX - i, y: startY });
    }
    
    snake.direction = DIRECTIONS.RIGHT;
    snake.nextDirection = null;
  }

  function spawnFood() {
    let attempts = 0;
    let validPosition = false;
    
    while (!validPosition && attempts < 1000) {
      food.x = Math.floor(Math.random() * GRID_SIZE);
      food.y = Math.floor(Math.random() * GRID_SIZE);
      
      validPosition = !snake.segments.some(segment => 
        segment.x === food.x && segment.y === food.y
      );
      
      attempts++;
    }
    
    if (attempts >= 1000) {
      gameOver();
    }
  }

  function startGameLoop() {
    if (gameLoop.intervalId) {
      clearInterval(gameLoop.intervalId);
    }
    
    gameLoop.intervalId = setInterval(function() {
      if (snake.nextDirection) {
        snake.direction = snake.nextDirection;
        snake.nextDirection = null;
      }
      
      moveSnake();
      checkCollisions();
      checkFoodCollision();
      render();
    }, gameLoop.currentSpeed);
  }

  function moveSnake() {
    const head = snake.segments[0];
    const newHead = {
      x: head.x + snake.direction.x,
      y: head.y + snake.direction.y
    };
    
    snake.segments.unshift(newHead);
    
    if (!shouldGrow) {
      snake.segments.pop();
    } else {
      shouldGrow = false;
    }
  }

  function checkCollisions() {
    const head = snake.segments[0];
    
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      gameOver();
      return;
    }
    
    for (let i = 1; i < snake.segments.length; i++) {
      if (head.x === snake.segments[i].x && head.y === snake.segments[i].y) {
        gameOver();
        return;
      }
    }
  }

  function checkFoodCollision() {
    const head = snake.segments[0];
    
    if (head.x === food.x && head.y === food.y) {
      gameState.score += POINTS_PER_FOOD;
      gameState.foodCount++;
      shouldGrow = true;
      
      spawnFood();
      updateScore();
      
      if (gameState.foodCount % SPEED_INCREASE_INTERVAL === 0) {
        gameLoop.currentSpeed = Math.max(MIN_SPEED, gameLoop.currentSpeed * SPEED_INCREMENT);
        startGameLoop();
      }
    }
  }

  function render() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    drawGrid();
    drawFood();
    drawSnake();
  }

  function drawGrid() {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }
  }

  function drawFood() {
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  function drawSnake() {
    snake.segments.forEach(function(segment, index) {
      if (index === 0) {
        ctx.fillStyle = COLORS.snake_head;
      } else {
        ctx.fillStyle = COLORS.snake_body;
      }
      
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });
  }

  function handleKeyPress(event) {
    const key = event.key;
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'p', 'P'].includes(key)) {
      event.preventDefault();
    }
    
    switch (key) {
      case 'ArrowUp':
        setDirection(DIRECTIONS.UP);
        break;
      case 'ArrowDown':
        setDirection(DIRECTIONS.DOWN);
        break;
      case 'ArrowLeft':
        setDirection(DIRECTIONS.LEFT);
        break;
      case 'ArrowRight':
        setDirection(DIRECTIONS.RIGHT);
        break;
      case 'p':
      case 'P':
        togglePause();
        break;
    }
  }

  function setDirection(newDir) {
    if (snake.direction.x === -newDir.x && snake.direction.y === -newDir.y) {
      return;
    }
    
    snake.nextDirection = newDir;
  }

  function togglePause() {
    if (gameState.currentScreen !== 'playing') return;
    
    if (gameLoop.intervalId) {
      clearInterval(gameLoop.intervalId);
      gameLoop.intervalId = null;
      
      if (elements['pause-overlay']) {
        elements['pause-overlay'].classList.remove('hidden');
      }
      if (elements['canvas-game']) {
        elements['canvas-game'].classList.add('paused');
      }
    } else {
      if (elements['pause-overlay']) {
        elements['pause-overlay'].classList.add('hidden');
      }
      if (elements['canvas-game']) {
        elements['canvas-game'].classList.remove('paused');
      }
      
      snake.nextDirection = null;
      startGameLoop();
    }
  }

  function gameOver() {
    if (gameLoop.intervalId) {
      clearInterval(gameLoop.intervalId);
      gameLoop.intervalId = null;
    }
    
    if (gameState.score > gameState.highscore) {
      gameState.highscore = gameState.score;
      try {
        localStorage.setItem('snakeHighscore', gameState.highscore);
      } catch (e) {
        console.error('localStorage error:', e);
      }
    }
    
    if (elements['final-score-display']) {
      elements['final-score-display'].innerHTML = 'Dein Score: ' + gameState.score;
    }
    if (elements['current-score-display']) {
      elements['current-score-display'].innerHTML = 'Highscore: ' + gameState.highscore;
    }
    
    showScreen('gameOver');
  }

  function updateScore() {
    if (elements['score-display']) {
      elements['score-display'].textContent = 'Score: ' + gameState.score;
    }
    if (elements['highscore-display']) {
      elements['highscore-display'].textContent = 'Highscore: ' + gameState.highscore;
    }
  }

  function resetAndStartGame() {
    if (elements['restart-btn']) {
      elements['restart-btn'].disabled = true;
    }
    
    if (elements['game-over-screen']) {
      elements['game-over-screen'].classList.add('hidden');
    }
    
    startGame();
    
    if (elements['restart-btn']) {
      elements['restart-btn'].disabled = false;
    }
  }
})();
