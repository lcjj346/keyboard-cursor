# KeyboardCursor

**Control your mouse pointer entirely from the keyboard — no mouse needed.**

## The problem

Sometimes the mouse just isn't an option. Maybe your mouse died and you're stuck. Maybe your laptop's trackpad is unreliable. Maybe reaching for the mouse constantly disrupts your typing flow, or a wrist injury makes gripping a mouse painful.

Windows technically has a built-in feature for this ("Mouse Keys"), but it requires a numpad — which most laptops and compact keyboards simply don't have. If your keyboard has no numpad, you're out of luck.

KeyboardCursor fixes that. It's a small app that sits quietly in your system tray and lets you move, click, and drag the mouse pointer using keys every keyboard has: the arrow keys.

## How it works

Press **Right Shift** to switch cursor mode on. Then:

| Key | What it does |
|-----|--------------|
| **Arrow keys** | Move the pointer — it speeds up the longer you hold |
| **Right Ctrl** | Tap to left-click, hold to drag |
| **K** | Right-click |
| **Right Shift** | Turn cursor mode back off |

While cursor mode is on, those keys are captured by the app, so pressing arrows won't accidentally scroll the page or type into a text box. When you want to type normally again, just tap Right Shift to switch it off.

There's also a settings window (from the tray icon) where you can adjust how fast the pointer moves, how quickly it accelerates, and see at a glance whether cursor mode is on.

## The story

This started as a personal fix for a real everyday annoyance: needing to click something when using a mouse wasn't practical, and discovering that Windows' own solution assumes a numpad I didn't have. Rather than live with it, I built a lightweight tool that does one thing well — and made the keys, speed, and feel adjustable so it works the way *you* want.

## A note on installing

The app comes as a normal Windows installer. Because it's a small personal project and not signed by a big software company, Windows may show an "Unknown publisher" warning the first time you run it — that's expected for independent apps, not a sign anything is wrong. Click "More info" → "Run anyway" to proceed.

---

*Built with Electron. Part of my project portfolio — [github.com/lcjj346](https://github.com/lcjj346).*
