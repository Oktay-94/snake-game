// script.js - Racing Game Complete Implementation

const CONFIG = {
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 800,
  TARGET_FPS: 60,
  TOTAL_LAPS: 3,
  CAR_MAX_SPEED: 8,
  CAR_ACCELERATION: 0.3,
  CAR_FRICTION: 0.95,
  CAR_ROTATION_SPEED: 0.08,
  CAR_SIZE: { width: 30, height: 50 },
  COLLISION_BOUNCE: 0.1
};

const KEY_BINDINGS = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP',
  s: 'DOWN',
  a: 'LEFT',
  d: 'RIGHT'
};

const GameState = {
  currentState: 'loading',
  car: {
    x: 0,
    y: 0,
    rotation: 0,
    velocityX: 0,
    velocityY: 0,
    speed: 0
  },
  currentLap: 0,
  lapTimes: [],
  lapStartTime: null,
  raceStartTime: null,
  lastFrameTime: 0,
  keys: {
    UP: false,
    DOWN: false,
    LEFT: false,
    RIGHT: false
  },
  hasPassedStart: false,
  lastLapChangeTime: 0,

  setState(newState) {
    this.currentState = newState;
  },

  resetGame() {
    this.currentLap = 0;
    this.lapTimes = [];
    this.lapStartTime = null;
    this.raceStartTime = null;
    this.lastFrameTime = 0;
    this.hasPassedStart = false;
    this.lastLapChangeTime = 0;
    this.car = {
      x: 0,
      y: 0,
      rotation: 0,
      velocityX: 0,
      velocityY: 0,
      speed: 0
    };
    this.keys = {
      UP: false,
      DOWN: false,
      LEFT: false,
      RIGHT: false
    };
  },

  addLapTime(time) {
    this.lapTimes.push(time);
  }
};

const Track = {
  width: CONFIG.CANVAS_WIDTH,
  height: CONFIG.CANVAS_HEIGHT,
  boundaries: [
    { x: 0, y: 0, width: 1200, height: 50 },
    { x: 0, y: 0, width: 50, height: 800 },
    { x: 1150, y: 0, width: 50, height: 800 },
    { x: 0, y: 750, width: 1200, height: 50 },
    { x: 250, y: 200, width: 700, height: 400 }
  ],
  startLine: {
    x1: 100,
    y1: 100,
    x2: 200,
    y2: 100,
    beforeY: 150,
    afterY: 50
  },

  isPointInBoundary(x, y) {
    for (let boundary of this.boundaries) {
      if (
        x >= boundary.x &&
        x <= boundary.x + boundary.width &&
        y >= boundary.y &&
        y <= boundary.y + boundary.height
      ) {
        return true;
      }
    }
    return false;
  },

  checkStartLineCrossing(oldY, newY, carX) {
    if (carX >= this.startLine.x1 && carX <= this.startLine.x2) {
      const crossedFromBelow = oldY >= this.startLine.beforeY && newY <= this.startLine.y1;
      const crossedFromAbove = oldY <= this.startLine.afterY && newY >= this.startLine.y1;
      
      if (crossedFromBelow) return 'before-to-line';
      if (crossedFromAbove) return 'after-to-line';
    }
    return null;
  }
};

const Renderer = {
  canvas: null,
  ctx: null,

  init() {
    try {
      this.canvas = document.getElementById('game-canvas');
      if (!this.canvas) {
        throw new Error('Canvas element not found');
      }
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) {
        throw new Error('Canvas context not available');
      }
      this.canvas.width = CONFIG.CANVAS_WIDTH;
      this.canvas.height = CONFIG.CANVAS_HEIGHT;
    } catch (error) {
      console.error('Renderer initialization failed:', error);
      throw error;
    }
  },

  clear() {
    this.ctx.fillStyle = '#2d3250';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  },

  drawTrack() {
    this.ctx.fillStyle = '#2d3250';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#ff3366';
    for (let boundary of Track.boundaries) {
      this.ctx.fillRect(boundary.x, boundary.y, boundary.width, boundary.height);
    }

    const startX = Track.startLine.x1;
    const startY = Track.startLine.y1;
    const lineWidth = Track.startLine.x2 - Track.startLine.x1;
    const lineHeight = 10;
    const squareSize = 10;

    for (let x = 0; x < lineWidth; x += squareSize) {
      for (let y = 0; y < lineHeight; y += squareSize) {
        const isWhite = ((x / squareSize) + (y / squareSize)) % 2 === 0;
        this.ctx.fillStyle = isWhite ? '#ffffff' : '#ffff00';
        this.ctx.fillRect(startX + x, startY + y, squareSize, squareSize);
      }
    }
  },

  drawCar(car) {
    this.ctx.save();
    this.ctx.translate(car.x, car.y);
    this.ctx.rotate(car.rotation);
    this.ctx.fillStyle = '#00d4ff';
    this.ctx.fillRect(
      -CONFIG.CAR_SIZE.width / 2,
      -CONFIG.CAR_SIZE.height / 2,
      CONFIG.CAR_SIZE.width,
      CONFIG.CAR_SIZE.height
    );
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(
      -CONFIG.CAR_SIZE.width / 2 + 5,
      -CONFIG.CAR_SIZE.height / 2 + 5,
      CONFIG.CAR_SIZE.width - 10,
      10
    );
    this.ctx.restore();
  },

  render() {
    this.clear();
    this.drawTrack();
    this.drawCar(GameState.car);
  }
};

const Physics = {
  updateCarMovement(car, keys, deltaTime) {
    if (keys.UP && keys.DOWN) {
      car.speed -= CONFIG.CAR_ACCELERATION * deltaTime;
      car.speed = Math.max(car.speed, -CONFIG.CAR_MAX_SPEED / 2);
    } else if (keys.UP) {
      car.speed += CONFIG.CAR_ACCELERATION * deltaTime;
      car.speed = Math.min(car.speed, CONFIG.CAR_MAX_SPEED);
    } else if (keys.DOWN) {
      car.speed -= CONFIG.CAR_ACCELERATION * deltaTime;
      car.speed = Math.max(car.speed, -CONFIG.CAR_MAX_SPEED / 2);
    } else {
      car.speed *= CONFIG.CAR_FRICTION;
    }

    if (Math.abs(car.speed) > 0.1) {
      if (keys.LEFT && !keys.RIGHT) {
        car.rotation -= CONFIG.CAR_ROTATION_SPEED * (car.speed / CONFIG.CAR_MAX_SPEED) * deltaTime;
      } else if (keys.RIGHT && !keys.LEFT) {
        car.rotation += CONFIG.CAR_ROTATION_SPEED * (car.speed / CONFIG.CAR_MAX_SPEED) * deltaTime;
      }
    }

    car.velocityX = Math.sin(car.rotation) * car.speed;
    car.velocityY = -Math.cos(car.rotation) * car.speed;

    car.x += car.velocityX * deltaTime;
    car.y += car.velocityY * deltaTime;
  },

  checkCollisions(car, track) {
    const carPoints = [
      { x: car.x + Math.cos(car.rotation) * 15, y: car.y + Math.sin(car.rotation) * 15 },
      { x: car.x - Math.cos(car.rotation) * 15, y: car.y - Math.sin(car.rotation) * 15 },
      { x: car.x + Math.sin(car.rotation) * 15, y: car.y - Math.cos(car.rotation) * 15 },
      { x: car.x - Math.sin(car.rotation) * 15, y: car.y + Math.cos(car.rotation) * 15 }
    ];

    for (let point of carPoints) {
      if (track.isPointInBoundary(point.x, point.y)) {
        car.x -= car.velocityX * 0.5;
        car.y -= car.velocityY * 0.5;
        car.speed *= 0.1;
        car.velocityX *= -CONFIG.COLLISION_BOUNCE;
        car.velocityY *= -CONFIG.COLLISION_BOUNCE;
        return true;
      }
    }

    if (car.x < 0 || car.x > CONFIG.CANVAS_WIDTH || car.y < 0 || car.y > CONFIG.CANVAS_HEIGHT) {
      car.x -= car.velocityX * 0.5;
      car.y -= car.velocityY * 0.5;
      car.speed *= 0.1;
      car.velocityX *= -CONFIG.COLLISION_BOUNCE;
      car.velocityY *= -CONFIG.COLLISION_BOUNCE;
      return true;
    }

    return false;
  },

  checkLapCompletion(car, track, gameState) {
    const now = Date.now();
    const cooldown = 500;

    if (now - gameState.lastLapChangeTime < cooldown) {
      return;
    }

    const carInAfterZone = car.y <= track.startLine.afterY && 
                          car.x >= track.startLine.x1 && 
                          car.x <= track.startLine.x2;

    if (carInAfterZone && !gameState.hasPassedStart) {
      gameState.hasPassedStart = true;
    }

    const carInBeforeZone = car.y >= track.startLine.beforeY && 
                           car.x >= track.startLine.x1 && 
                           car.x <= track.startLine.x2;

    if (carInBeforeZone && gameState.hasPassedStart) {
      try {
        const lapTime = now - gameState.lapStartTime;
        gameState.addLapTime(lapTime);
        gameState.currentLap++;
        gameState.lastLapChangeTime = now;

        if (gameState.currentLap >= CONFIG.TOTAL_LAPS) {
          gameState.setState('finished');
        } else {
          gameState.lapStartTime = now;
          gameState.hasPassedStart = false;
        }
      } catch (error) {
        console.error('Error calculating lap time:', error);
      }
    }
  }
};

const InputManager = {
  init() {
    document.addEventListener('keydown', (e) => {
      if (KEY_BINDINGS[e.key]) {
        GameState.keys[KEY_BINDINGS[e.key]] = true;
        if (e.key.startsWith('Arrow')) {
          e.preventDefault();
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      if (KEY_BINDINGS[e.key]) {
        GameState.keys[KEY_BINDINGS[e.key]] = false;
        if (e.key.startsWith('Arrow')) {
          e.preventDefault();
        }
      }
    });
  }
};

const UIController = {
  showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
      screen.classList.add('hidden');
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
    }
  },

  updateLapDisplay(lap) {
    const lapElement = document.getElementById('current-lap');
    if (lapElement) {
      lapElement.textContent = lap;
    }
  },

  updateLapTime(time) {
    const lapTimeElement = document.getElementById('current-lap-time');
    if (lapTimeElement) {
      try {
        lapTimeElement.textContent = this.formatTime(time);
      } catch (error) {
        console.error('Error formatting lap time:', error);
        lapTimeElement.textContent = 'N/A';
      }
    }
  },

  updateTotalTime(time) {
    const totalTimeElement = document.getElementById('total-time');
    if (totalTimeElement) {
      try {
        totalTimeElement.textContent = this.formatTime(time);
      } catch (error) {
        console.error('Error formatting total time:', error);
        totalTimeElement.textContent = 'N/A';
      }
    }
  },

  updateLapTimesList(lapTimes) {
    const listElement = document.getElementById('lap-times-list');
    if (listElement) {
      listElement.innerHTML = '';
      lapTimes.forEach((time, index) => {
        const li = document.createElement('li');
        try {
          li.textContent = `Runde ${index + 1}: ${this.formatTime(time)}`;
        } catch (error) {
          console.error('Error formatting lap time in list:', error);
          li.textContent = `Runde ${index + 1}: N/A`;
        }
        listElement.appendChild(li);
      });
    }
  },

  showError(message) {
    this.showScreen('error-screen');
    const errorScreen = document.getElementById('error-screen');
    if (errorScreen) {
      const messageElement = errorScreen.querySelector('p');
      if (messageElement) {
        messageElement.textContent = message;
      }
    }
  },

  formatTime(ms) {
    if (isNaN(ms) || ms < 0) {
      return 'N/A';
    }
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  },

  init() {
    const startButton = document.getElementById('start-button');
    if (startButton) {
      startButton.addEventListener('click', () => Game.start());
    }

    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
      restartButton.addEventListener('click', () => Game.restart());
    }

    const retryButton = document.getElementById('retry-button');
    if (retryButton) {
      retryButton.addEventListener('click', () => location.reload());
    }
  }
};

const Game = {
  frameCount: 0,
  fpsStartTime: 0,

  init() {
    try {
      UIController.init();
      Renderer.init();
      InputManager.init();

      const canvas = document.getElementById('game-canvas');
      if (canvas) {
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      }

      if (!Track.boundaries || Track.boundaries.length === 0) {
        throw new Error('Track boundaries not defined');
      }

      setTimeout(() => {
        GameState.setState('ready');
        UIController.showScreen('start-screen');
      }, 1000);

    } catch (error) {
      console.error('Game initialization failed:', error);
      GameState.setState('error');
      UIController.showError('Strecke konnte nicht initialisiert werden');
    }
  },

  start() {
    try {
      GameState.resetGame();
      GameState.car.x = 150;
      GameState.car.y = 150;
      GameState.car.rotation = 0;
      GameState.setState('playing');
      UIController.showScreen('game-screen');
      GameState.raceStartTime = Date.now();
      GameState.lapStartTime = Date.now();
      this.frameCount = 0;
      this.fpsStartTime = Date.now();
      requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    } catch (error) {
      console.error('Error starting game:', error);
      UIController.showError('Spiel konnte nicht gestartet werden');
    }
  },

  gameLoop(timestamp) {
    if (GameState.lastFrameTime === 0) {
      GameState.lastFrameTime = timestamp;
    }

    let deltaTime = (timestamp - GameState.lastFrameTime) / 16.67;
    GameState.lastFrameTime = timestamp;

    if (deltaTime > 3) {
      console.warn('Frame drop detected: deltaTime =', deltaTime);
      deltaTime = 1;
    }

    try {
      Physics.updateCarMovement(GameState.car, GameState.keys, deltaTime);
      Physics.checkCollisions(GameState.car, Track);
      Physics.checkLapCompletion(GameState.car, Track, GameState);
      Renderer.render();

      UIController.updateLapDisplay(`${GameState.currentLap}/${CONFIG.TOTAL_LAPS}`);
      UIController.updateLapTime(Date.now() - GameState.lapStartTime);
      UIController.updateTotalTime(Date.now() - GameState.raceStartTime);

      this.frameCount++;
      const elapsed = Date.now() - this.fpsStartTime;
      if (elapsed > 1000) {
        const fps = (this.frameCount / elapsed) * 1000;
        if (fps < 30) {
          console.warn('Low FPS detected:', fps.toFixed(2));
        }
        this.frameCount = 0;
        this.fpsStartTime = Date.now();
      }

    } catch (error) {
      console.error('Error in game loop:', error);
    }

    if (GameState.currentState === 'playing') {
      requestAnimationFrame((ts) => this.gameLoop(ts));
    } else if (GameState.currentState === 'finished') {
      this.end();
    }
  },

  end() {
    try {
      const totalTime = Date.now() - GameState.raceStartTime;
      const avgFPS = this.frameCount > 0 ? (this.frameCount / (totalTime / 1000)).toFixed(2) : 'N/A';
      console.log('Race finished!');
      console.log('Total time:', UIController.formatTime(totalTime));
      console.log('Average FPS:', avgFPS);
      console.log('Lap times:', GameState.lapTimes);

      UIController.updateLapTimesList(GameState.lapTimes);
      UIController.showScreen('result-screen');
    } catch (error) {
      console.error('Error ending game:', error);
    }
  },

  restart() {
    this.start();
  }
};

window.addEventListener('DOMContentLoaded', () => {
  Game.init();
});