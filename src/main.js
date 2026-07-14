const { app, BrowserWindow, Tray, Menu, ipcMain, screen } = require('electron');
const path = require('path');
const { GlobalKeyboardListener } = require('node-global-key-listener');
const { mouse, Point, Button } = require('@nut-tree-fork/nut-js');
const Store = require('electron-store');

const store = new Store({
  defaults: {
    speed: 8,          // base pixels per tick
    maxSpeed: 40,       // max pixels per tick after acceleration
    accelTime: 600,     // ms to reach max speed
    holdThreshold: 180, // ms - hold longer than this on the click key to start a drag
    toggleKey: 'RIGHT SHIFT',
    keymap: {
      up: 'UP ARROW',
      down: 'DOWN ARROW',
      left: 'LEFT ARROW',
      right: 'RIGHT ARROW',
      click: 'RIGHT CTRL',   // tap = left click, hold = drag
      rightClick: 'K'
    }
  }
});

let tray = null;
let settingsWindow = null;
let cursorModeOn = false;

const held = { up: false, down: false, left: false, right: false };
let heldSince = null;

let clickKeyTimer = null;
let dragStarted = false;
let toggleKeyHeld = false;

let cfg = store.store;
function reloadConfig() { cfg = store.store; }

function sendStatusToWindow() {
  if (settingsWindow) settingsWindow.webContents.send('status-update', { cursorModeOn });
}

function toggleCursorMode() {
  cursorModeOn = !cursorModeOn;
  if (!cursorModeOn) {
    // release any in-flight input, otherwise a key still physically held when
    // mode turns off stays "held" forever (its key-up passes through untracked)
    held.up = held.down = held.left = held.right = false;
    heldSince = null;
    if (clickKeyTimer) {
      clearTimeout(clickKeyTimer);
      clickKeyTimer = null;
    }
    if (dragStarted) {
      dragStarted = false;
      mouse.releaseButton(Button.LEFT);
    }
  }
  sendStatusToWindow();
}

// normalize a key name for comparison - the listener library reports names
// in upper case like "UP ARROW", "RIGHT SHIFT", "K", etc.
function nameMatches(reportedName, configuredName) {
  if (!reportedName || !configuredName) return false;
  return reportedName.toUpperCase() === configuredName.toUpperCase();
}

// --- movement loop --------------------------------------------------------
const TICK_MS = 16;
let loopHandle = null;

function startLoop() {
  if (loopHandle) return;
  loopHandle = setInterval(tick, TICK_MS);
}

async function tick() {
  if (!cursorModeOn) return;
  const anyHeld = held.up || held.down || held.left || held.right;
  if (!anyHeld) { heldSince = null; return; }
  if (!heldSince) heldSince = Date.now();

  const elapsed = Date.now() - heldSince;
  const t = Math.min(1, elapsed / cfg.accelTime);
  const speed = cfg.speed + (cfg.maxSpeed - cfg.speed) * t;

  let dx = 0, dy = 0;
  if (held.up) dy -= speed;
  if (held.down) dy += speed;
  if (held.left) dx -= speed;
  if (held.right) dx += speed;

  if (dx !== 0 && dy !== 0) {
    const norm = Math.SQRT1_2;
    dx *= norm;
    dy *= norm;
  }

  try {
    const current = await mouse.getPosition();
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.bounds;
    const nx = Math.max(0, Math.min(width - 1, current.x + dx));
    const ny = Math.max(0, Math.min(height - 1, current.y + dy));
    await mouse.setPosition(new Point(nx, ny));
  } catch (e) {
    console.error('move error', e);
  }
}

// --- keyboard handling -------------------------------------------------------
const keyboard = new GlobalKeyboardListener({
  windows: {
    onError: (code) => console.error('key listener error:', code)
  }
});

// The listener calls back on every key event. Returning `true` suppresses
// the key from reaching whatever app is focused - this is what lets us
// use the arrow keys for cursor control without also typing into a
// text field, as long as cursor mode is on.
keyboard.addListener((e, down) => {
  if (process.env.DEBUG_KEYS) {
    console.log('key event:', e.name, e.state);
  }
  const km = cfg.keymap;
  const name = e.name;
  const isDown = e.state === 'DOWN';

  // --- toggle key (always active, regardless of cursor mode) ---
  if (nameMatches(name, cfg.toggleKey)) {
    if (isDown) {
      if (toggleKeyHeld) return true; // debounce OS key-repeat
      toggleKeyHeld = true;
      toggleCursorMode();
    } else {
      toggleKeyHeld = false;
    }
    return true;
  }

  if (!cursorModeOn) return false; // let every other key through untouched

  // --- movement keys ---
  if (nameMatches(name, km.up)) { held.up = isDown; return true; }
  if (nameMatches(name, km.down)) { held.down = isDown; return true; }
  if (nameMatches(name, km.left)) { held.left = isDown; return true; }
  if (nameMatches(name, km.right)) { held.right = isDown; return true; }

  // --- right click ---
  if (nameMatches(name, km.rightClick)) {
    if (isDown) mouse.rightClick();
    return true;
  }

  // --- tap-to-click / hold-to-drag ---
  if (nameMatches(name, km.click)) {
    if (isDown) {
      if (clickKeyTimer || dragStarted) return true; // ignore key-repeat
      clickKeyTimer = setTimeout(async () => {
        dragStarted = true;
        await mouse.pressButton(Button.LEFT);
      }, cfg.holdThreshold);
    } else {
      if (clickKeyTimer) {
        clearTimeout(clickKeyTimer);
        clickKeyTimer = null;
        mouse.leftClick();
      } else if (dragStarted) {
        dragStarted = false;
        mouse.releaseButton(Button.LEFT);
      }
    }
    return true;
  }

  // any other key while cursor mode is on: let it through normally
  return false;
});

// --- window / tray setup -----------------------------------------------------
function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 500,
    height: 620,
    resizable: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });
  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const menu = Menu.buildFromTemplate([
    { label: 'Open Settings', click: () => {
        if (!settingsWindow) createSettingsWindow();
        else settingsWindow.focus();
      }
    },
    { label: 'Toggle Cursor Mode (Right Shift)', click: () => toggleCursorMode() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setContextMenu(menu);
  tray.setToolTip('KeyboardCursor');
}

app.whenReady().then(() => {
  createTray();
  createSettingsWindow();
  startLoop();
});

app.on('window-all-closed', (e) => { e.preventDefault(); });

ipcMain.handle('get-config', () => store.store);
ipcMain.handle('set-config', (event, partial) => {
  store.set(partial);
  reloadConfig();
  return store.store;
});
ipcMain.handle('get-status', () => ({ cursorModeOn }));
