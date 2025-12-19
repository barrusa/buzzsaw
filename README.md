# 🐝 Buzzsaw

**Buzzsaw** is a professional-grade, Jeopardy-style trivia buzzer system built for macOS. It interfaces with physical USB buzzers to manage player lockouts, timing, and sound effects, providing a TV-show quality experience for your game nights.

![Buzzsaw Board View](https://via.placeholder.com/800x450.png?text=Buzzsaw+Game+Board)

## 🚀 Features

*   **Dual-Window Interface:**
    *   **Host Console:** Complete control over the game flow, reset/start buttons, and a live activity log.
    *   **Game Board:** A clean, high-contrast, "stage-ready" display for the audience and players (supports secondary monitors).
*   **Hardware Integration:** Native support for **Delcom USB HID** buzzers.
*   **Precision Lockout:** 
    *   Millisecond-accurate input detection using polling (~250Hz).
    *   **Penalty System:** Players who buzz *before* the floor opens are locked out for 0.25s.
*   **Jeopardy Style:** 
    *   Authentic fonts (Oswald/Helvetica style).
    *   Standard 5-second countdown timer.
    *   🥇, 🥈, 🥉 medal tracking for every round.
*   **Sound Effects:** Preloaded "Buzz" and "Time's Up" audio cues with instant playback.
*   **Persistence:** Remembers player names and buzzer mappings between restarts.

## 🛠️ Installation

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/barrusa/buzzsaw.git
    cd buzzsaw
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the app:**
    ```bash
    npm start
    ```

## 🎮 How to Play

1.  **Launch the App:** Run `npm start`. The Host Console will appear.
2.  **Open Board Window:** Click "Focus Board" to open the audience view. Drag this window to your TV or secondary monitor and maximize it.
3.  **Setup Players:**
    *   Enter names for up to 3 players in the Host Console.
    *   Click **"Map Buzzer"** for a player, then press their physical button to assign it.
4.  **Start a Round:**
    *   Read the question.
    *   Press **OPEN BUZZERS** (or `Shift+Cmd+O`).
    *   The timer starts, and the board turns **GREEN**.
5.  **Buzzing In:**
    *   The first player to buzz locks out the others. Their name flashes on the big screen with a 🥇.
    *   If no one buzzes in 5 seconds, the "Time's Up" sound plays.
6.  **Reset:**
    *   Press **STOP / RESET** (or `Shift+Cmd+R`) to clear the board for the next question.

## ⌨️ Global Hotkeys

Control the game even when the app is in the background:

*   **`Shift + Cmd + O`**: Open Buzzers / Start Round
*   **`Shift + Cmd + R`**: Stop / Reset Game

## 📦 Building for Production

To create a standalone `.app` file:

```bash
npm run make
```

The output will be in `out/Buzzsaw-darwin-arm64/`. Note that you may need to right-click > Open the app the first time to bypass macOS developer checks.

## 🧩 Hardware

Designed for **Delcom USB HID Switches** (Vendor ID: `0x0fc5`, Product ID: `0xb080`), but the polling logic in `src/main.ts` can be adapted for other HID devices.

## 📄 License

MIT
