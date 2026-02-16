// ============================================================================
// RACING GAME - script.js
// Vollständige Spiellogik in modularer Architektur
// ============================================================================

// === 1. GLOBALE KONSTANTEN & KONFIGURATION ===

const CONFIG = {
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 800,
  FPS: 60,
  PLAYER_ACCELERATION: 0.5,
  PLAYER_MAX_SPEED: 8,
  PLAYER_FRICTION: 0.96,
  PLAYER_ROTATION_SPEED: 0.08,
  TRACK_WIDTH: 400,
  COLLISION_PENALTY: 0.5,
  GAME_DURATION: 180000,
  POINTS_PER_FRAME: 1
};

const DOM_IDS = {
  appContainer: 'app-container',
  gameCanvas: 'game-canvas',
  loadingScreen: 'loading-screen',
  startScreen: 'start-screen',
  gameHud: 'game-hud',
  pauseOverlay: 'pause-overlay',
  gameoverOverlay: 'gameover-overlay',
  errorOverlay: 'error-overlay',
  startBtn: 'start-btn',
  restartBtn: 'restart-btn',
  continueBtn: 'continue-btn',
  timeDisplay: 'time-display',
  scoreDisplay: 'score-display',
  finalTimeDisplay: 'final-time-display',
  finalScoreDisplay: 'final-score-display',
  errorMessageText: 'error-message-text'
};

// === 2. STATE MANAGEMENT ===

const gameState = {
  current: 'loading',
  isPlaying: false,
  isPaused: false,
  startTime: null,
  elapsedTime: 0,
  score: 0,
  collisionCount: 0,
  offTrackTime: 0
};

/**
 * Setzt den aktuellen Spielzustand
 * @param {string} newState - Neuer State
 */
function setState(newState) {
  gameState.current = newState;
}

/**
 * Setzt den Spielzustand zurück
 */
function resetGameState() {
  gameState.current = 'playing';
  gameState.isPlaying = false;
  gameState.isPaused = false;
  gameState.startTime = null;
  gameState.elapsedTime = 0;
  gameState.score = 0;
  gameState.collisionCount = 0;
  gameState.offTrackTime = 0;
}

// === 3. CANVAS & KONTEXT ===

let canvas = null;
let ctx = null;

// === 4. INPUT HANDLING ===

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  p: false
};

/**
 * Behandelt Keydown-Events
 * @param {KeyboardEvent} e - Event-Objekt
 */
function handleKeyDown(e) {
  if (e.key in keys) {
    keys[e.key] = true;
    e.preventDefault();
  }
  if (e.key === 'p' && gameState.isPlaying) {
    handlePause();
    e.preventDefault();
  }
}

/**
 * Behandelt Keyup-Events
 * @param {KeyboardEvent} e - Event-Objekt
 */
function handleKeyUp(e) {
  if (e.key in keys) {
    keys[e.key] = false;
    e.preventDefault();
  }
}

/**
 * Toggle Pause-Zustand
 */
function handlePause() {
  togglePause();
}

// === 5. PLAYER VEHICLE ===

const player = {
  x: CONFIG.CANVAS_WIDTH / 2,
  y: CONFIG.CANVAS_HEIGHT - 100,
  vx: 0,
  vy: 0,
  angle: -Math.PI / 2,
  width: 30,
  height: 50,
  isOffTrack: false
};

/**
 * Aktualisiert Spielerposition und -geschwindigkeit
 */
function updatePlayer() {
  // Beschleunigung
  if (keys.ArrowUp) {
    player.vx += Math.cos(player.angle) * CONFIG.PLAYER_ACCELERATION;
    player.vy += Math.sin(player.angle) * CONFIG.PLAYER_ACCELERATION;
  }

  // Bremsen
  if (keys.ArrowDown) {
    player.vx *= 0.9;
    player.vy *= 0.9;
  }

  // Rotation
  if (keys.ArrowLeft) {
    player.angle -= CONFIG.PLAYER_ROTATION_SPEED;
  }
  if (keys.ArrowRight) {
    player.angle += CONFIG.PLAYER_ROTATION_SPEED;
  }

  // Reibung anwenden
  player.vx *= CONFIG.PLAYER_FRICTION;
  player.vy *= CONFIG.PLAYER_FRICTION;

  // Geschwindigkeit limitieren
  const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
  if (speed > CONFIG.PLAYER_MAX_SPEED) {
    player.vx = (player.vx / speed) * CONFIG.PLAYER_MAX_SPEED;
    player.vy = (player.vy / speed) * CONFIG.PLAYER_MAX_SPEED;
  }

  // Position aktualisieren
  player.x += player.vx;
  player.y += player.vy;

  // Boundary Check
  if (player.x < 0) player.x = 0;
  if (player.x > CONFIG.CANVAS_WIDTH) player.x = CONFIG.CANVAS_WIDTH;
  if (player.y < 0) player.y = 0;
  if (player.y > CONFIG.CANVAS_HEIGHT) player.y = CONFIG.CANVAS_HEIGHT;
}

/**
 * Zeichnet das Spielerfahrzeug
 * @param {CanvasRenderingContext2D} ctx - Canvas-Kontext
 */
function drawPlayer(ctx) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  // Farbe abhängig von Track-Status
  ctx.fillStyle = player.isOffTrack ? '#ff4757' : '#00d4ff';
  
  // Fahrzeug als Dreieck
  ctx.beginPath();
  ctx.moveTo(0, -player.height / 2);
  ctx.lineTo(-player.width / 2, player.height / 2);
  ctx.lineTo(player.width / 2, player.height / 2);
  ctx.closePath();
  ctx.fill();

  // Umriss
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

// === 6. TRACK & ENVIRONMENT ===

const track = {
  centerX: CONFIG.CANVAS_WIDTH / 2,
  lanes: []
};

/**
 * Zeichnet die Rennstrecke
 * @param {CanvasRenderingContext2D} ctx - Canvas-Kontext
 */
function drawTrack(ctx) {
  // Hintergrund (Gras)
  ctx.fillStyle = '#2d5016';
  ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  // Fahrbare Strecke
  const trackLeft = track.centerX - CONFIG.TRACK_WIDTH / 2;
  ctx.fillStyle = '#3a3a52';
  ctx.fillRect(trackLeft, 0, CONFIG.TRACK_WIDTH, CONFIG.CANVAS_HEIGHT);

  // Mittellinien (gestrichelt)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.setLineDash([20, 15]);
  ctx.beginPath();
  ctx.moveTo(track.centerX, 0);
  ctx.lineTo(track.centerX, CONFIG.CANVAS_HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);

  // Streckenbegrenzungen (rot)
  ctx.strokeStyle = '#ff4757';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(trackLeft, 0);
  ctx.lineTo(trackLeft, CONFIG.CANVAS_HEIGHT);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(trackLeft + CONFIG.TRACK_WIDTH, 0);
  ctx.lineTo(trackLeft + CONFIG.TRACK_WIDTH, CONFIG.CANVAS_HEIGHT);
  ctx.stroke();
}

/**
 * Prüft ob Koordinaten auf der Strecke sind
 * @param {number} x - X-Koordinate
 * @param {number} y - Y-Koordinate
 * @returns {boolean}
 */
function isOnTrack(x, y) {
  const distanceFromCenter = Math.abs(x - track.centerX);
  return distanceFromCenter <= CONFIG.TRACK_WIDTH / 2;
}

// === 7. COLLISION DETECTION ===

/**
 * Prüft Kollisionen und Off-Track Status
 */
function checkCollision() {
  // Vier Ecken des Fahrzeugs berechnen
  const corners = [
    { x: -player.width / 2, y: -player.height / 2 },
    { x: player.width / 2, y: -player.height / 2 },
    { x: -player.width / 2, y: player.height / 2 },
    { x: player.width / 2, y: player.height / 2 }
  ];

  let offTrackCorners = 0;

  corners.forEach(corner => {
    const cos = Math.cos(player.angle);
    const sin = Math.sin(player.angle);
    const rotatedX = corner.x * cos - corner.y * sin;
    const rotatedY = corner.x * sin + corner.y * cos;
    const worldX = player.x + rotatedX;
    const worldY = player.y + rotatedY;

    if (!isOnTrack(worldX, worldY)) {
      offTrackCorners++;
    }
  });

  // Mindestens eine Ecke außerhalb
  if (offTrackCorners > 0) {
    player.isOffTrack = true;
    gameState.offTrackTime += 1000 / CONFIG.FPS;
    
    // Geschwindigkeit reduzieren
    player.vx *= CONFIG.COLLISION_PENALTY;
    player.vy *= CONFIG.COLLISION_PENALTY;
    
    gameState.collisionCount++;
  } else {
    player.isOffTrack = false;
    gameState.offTrackTime = 0;
  }

  // Game Over bei zu vielen Kollisionen oder zu langer Off-Track Zeit
  if (gameState.offTrackTime > 2000 && offTrackCorners >= 3) {
    triggerGameOver();
  }
  if (gameState.collisionCount > 10) {
    triggerGameOver();
  }
}

// === 8. SCORING & TIME ===

/**
 * Aktualisiert den Score
 */
function updateScore() {
  if (!player.isOffTrack) {
    gameState.score += CONFIG.POINTS_PER_FRAME;
  }
}

/**
 * Aktualisiert die verstrichene Zeit
 */
function updateTime() {
  if (gameState.startTime) {
    gameState.elapsedTime = Date.now() - gameState.startTime;
  }
}

/**
 * Prüft ob Spielzeit abgelaufen ist
 */
function checkGameDuration() {
  if (gameState.elapsedTime >= CONFIG.GAME_DURATION) {
    triggerGameOver();
  }
}

/**
 * Formatiert Millisekunden zu MM:SS
 * @param {number} ms - Millisekunden
 * @returns {string}
 */
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// === 9. GAME LOOP ===

/**
 * Hauptspiel-Loop
 */
function gameLoop() {
  if (!gameState.isPlaying || gameState.isPaused) {
    return;
  }

  try {
    // Clear Canvas
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Zeichnen & Aktualisieren
    drawTrack(ctx);
    updatePlayer();
    drawPlayer(ctx);
    checkCollision();
    updateScore();
    updateTime();
    updateHUD();
    checkGameDuration();

    // Nächster Frame
    requestAnimationFrame(gameLoop);
  } catch (error) {
    console.error('Game Loop Error:', error);
    showError('Ein Fehler ist aufgetreten');
  }
}

/**
 * Startet das Spiel
 */
function startGame() {
  try {
    resetGameState();
    
    // Player zurücksetzen
    player.x = CONFIG.CANVAS_WIDTH / 2;
    player.y = CONFIG.CANVAS_HEIGHT - 100;
    player.vx = 0;
    player.vy = 0;
    player.angle = -Math.PI / 2;
    player.isOffTrack = false;

    setState('playing');
    gameState.isPlaying = true;
    gameState.startTime = Date.now();

    // UI aktualisieren
    showScreen(DOM_IDS.gameHud);
    document.getElementById(DOM_IDS.startScreen).classList.add('hidden');
    document.getElementById(DOM_IDS.gameoverOverlay).classList.add('hidden');
    document.getElementById(DOM_IDS.gameCanvas).classList.remove('hidden');

    // Game Loop starten
    gameLoop();
  } catch (error) {
    console.error('Start Game Error:', error);
    showError('Spiel konnte nicht gestartet werden');
  }
}

// === 10. UI STATE MANAGEMENT ===

/**
 * Zeigt einen bestimmten Screen an
 * @param {string} screenId - ID des anzuzeigenden Screens
 */
function showScreen(screenId) {
  const overlays = [
    DOM_IDS.loadingScreen,
    DOM_IDS.startScreen,
    DOM_IDS.pauseOverlay,
    DOM_IDS.gameoverOverlay,
    DOM_IDS.errorOverlay,
    DOM_IDS.gameHud
  ];

  overlays.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      if (id === screenId) {
        element.classList.remove('hidden');
      } else {
        element.classList.add('hidden');
      }
    }
  });
}

/**
 * Aktualisiert das HUD
 */
function updateHUD() {
  const timeDisplay = document.getElementById(DOM_IDS.timeDisplay);
  const scoreDisplay = document.getElementById(DOM_IDS.scoreDisplay);

  if (timeDisplay) {
    timeDisplay.textContent = formatTime(gameState.elapsedTime);
  }
  if (scoreDisplay) {
    scoreDisplay.textContent = gameState.score;
  }
}

/**
 * Toggle Pause-Status
 */
function togglePause() {
  if (!gameState.isPlaying) return;

  gameState.isPaused = !gameState.isPaused;

  if (gameState.isPaused) {
    document.getElementById(DOM_IDS.pauseOverlay).classList.remove('hidden');
  } else {
    document.getElementById(DOM_IDS.pauseOverlay).classList.add('hidden');
    // Zeit-Offset anpassen
    const pauseTime = Date.now();
    gameState.startTime = pauseTime - gameState.elapsedTime;
    gameLoop();
  }
}

/**
 * Triggert Game Over
 */
function triggerGameOver() {
  gameState.isPlaying = false;

  const finalTimeDisplay = document.getElementById(DOM_IDS.finalTimeDisplay);
  const finalScoreDisplay = document.getElementById(DOM_IDS.finalScoreDisplay);

  if (finalTimeDisplay) {
    finalTimeDisplay.textContent = formatTime(gameState.elapsedTime);
  }
  if (finalScoreDisplay) {
    finalScoreDisplay.textContent = gameState.score;
  }

  showScreen(DOM_IDS.gameoverOverlay);
}

/**
 * Zeigt Fehlermeldung an
 * @param {string} message - Fehlermeldung
 */
function showError(message) {
  const errorMessageText = document.getElementById(DOM_IDS.errorMessageText);
  if (errorMessageText) {
    errorMessageText.textContent = message;
  }
  showScreen(DOM_IDS.errorOverlay);
}

// === 11. EVENT BINDINGS ===

/**
 * Registriert alle Event-Listener
 */
function registerEventListeners() {
  // Button Events
  const startBtn = document.getElementById(DOM_IDS.startBtn);
  const restartBtn = document.getElementById(DOM_IDS.restartBtn);
  const continueBtn = document.getElementById(DOM_IDS.continueBtn);

  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  }
  if (restartBtn) {
    restartBtn.addEventListener('click', startGame);
  }
  if (continueBtn) {
    continueBtn.addEventListener('click', togglePause);
  }

  // Keyboard Events
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
}

// === 12. INITIALISIERUNG ===

/**
 * Initialisiert das Spiel
 */
function init() {
  try {
    // Canvas initialisieren
    canvas = document.getElementById(DOM_IDS.gameCanvas);
    
    if (!canvas) {
      throw new Error('Canvas nicht gefunden');
    }

    // Browser-Kompatibilität prüfen
    if (!canvas.getContext) {
      throw new Error('Canvas wird nicht unterstützt');
    }

    ctx = canvas.getContext('2d');
    canvas.width = CONFIG.CANVAS_WIDTH;
    canvas.height = CONFIG.CANVAS_HEIGHT;

    // Event-Listener registrieren
    registerEventListeners();

    // Asset-Loading simulieren
    setTimeout(() => {
      setState('start');
      document.getElementById(DOM_IDS.loadingScreen).classList.add('hidden');
      document.getElementById(DOM_IDS.startScreen).classList.remove('hidden');
    }, 1000);

  } catch (error) {
    console.error('Initialization Error:', error);
    showError('Browser nicht kompatibel');
  }
}

// === 13. STARTUP ===

window.addEventListener('DOMContentLoaded', init);