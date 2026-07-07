# KeyboardCursor

Control your mouse cursor entirely from the keyboard — no numpad, no NumLock, no mouse required.

- **Right Shift** — toggle cursor mode on/off
- **Arrow keys** — move the cursor (accelerates the longer you hold)
- **Right Ctrl** — tap to left-click, hold to drag
- **K** — right click
- Settings window lets you tune speed/acceleration and see live status

While cursor mode is on, these keys are suppressed from reaching whatever app is
focused, so they won't leak into a text field — turn cursor mode off (Right Shift)
before typing normally.

## Running it (development mode)

You need [Node.js](https://nodejs.org) installed (LTS version is fine).

```bash
cd keyboard-cursor
npm install
npm start
```

Whenever you get an updated version of this project, always delete `node_modules`
and `package-lock.json` and run `npm install` fresh rather than copying `node_modules`
over from an old version — native modules are tightly coupled to the exact Electron
version and mixing an old copy in is a common source of crashes.

## Why node-global-key-listener instead of uiohook-napi

An earlier version of this project used `uiohook-napi` for global key listening.
It's a native addon that loads *inside* the Electron process, which means it has
to exactly match Electron's internal Node-API/V8 version — and it doesn't always
keep up with newer Electron releases, causing crashes like
`FATAL ERROR: tsfn_to_js_proxy napi_call_function` the moment a key event fires.

`node-global-key-listener` avoids this entirely: it runs a small separate helper
process and talks to it over stdio, so it's not sensitive to Electron's internal
ABI at all. It also lets us **suppress** key events from reaching other apps
(by returning `true` from the listener), which is what makes cursor mode not leak
into text fields.

## If your key names don't match

Different keyboard layouts/drivers occasionally report key names slightly
differently. If Arrow Keys / Right Ctrl / Right Shift don't seem to register,
run this to see exactly what name each key reports:

```bash
set DEBUG_KEYS=1
npm start
```

(On PowerShell: `$env:DEBUG_KEYS=1; npm start`)

Press the key you expect to use and watch the terminal for a line like
`key event: UP ARROW DOWN`. Copy the exact name shown and use it in the
`keymap` config in `src/main.js` if it differs from the default.

## Packaging it into a real .exe you can install

```bash
npm run dist
```

This uses `electron-builder` to produce a Windows installer under `dist/` with
your custom icon, a Desktop shortcut, and a Start Menu entry. Since the `.exe`
isn't code-signed, Windows SmartScreen will likely show an "Unknown publisher"
warning on first run — normal for an unsigned app, not a bug.

## Project structure

```
keyboard-cursor/
  package.json
  src/
    main.js        # Electron main process: key listening, cursor movement loop, tray
    preload.js      # safe IPC bridge for the settings window
    settings.html   # settings UI (speed sliders, live status, keymap display)
    icon.png / icon.ico
```

## Customizing keybinds

The keymap lives in the default config inside `main.js` (`store` defaults). Edit
the `keymap` object there to change which keys do what.
