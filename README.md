# Typing Speed Test

A clean, responsive typing speed test built with plain HTML, CSS and JavaScript. No frameworks, no build step, no server.

## Features

- Time modes: 15, 30, 60 (default) and 120 seconds
- Live WPM, accuracy, errors and countdown, with a progress bar
- Per-character feedback: untyped, correct, incorrect, current
- 60 built-in sentences, shuffled so texts do not repeat back to back
- Result screen with score and performance level
- Personal best and last 10 results saved in `localStorage`
- Light and dark themes
- Optional sounds (Web Audio, off by default) and auto focus setting
- Paste, drop and cut are blocked while a test runs
- Works on phones, tablets and desktops (native mobile keyboard)

## How to use

1. Pick a duration and press **Start Test** (or press Enter).
2. Type the text shown. The timer starts immediately.
3. Press **Esc** to exit, or **Restart** for a new text.
4. When time is up, review your results and press **Try Again** or **New Test**.

## Calculations

- **WPM** = (correct characters / 5) / minutes
- **Accuracy** = correct characters / total typed characters x 100
- **Errors** = wrong characters typed (corrections still count)
- **Score** = WPM x accuracy x 10 (never below 0)

| WPM | Level |
| --- | --- |
| 0-20 | Beginner |
| 21-35 | Novice |
| 36-50 | Average |
| 51-70 | Fast |
| 71-90 | Very Fast |
| 91+ | Expert |

## Deploy on GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `style.css`, `script.js` (and the other files) to the repository root.
3. Go to **Settings > Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then click **Save**.
6. After a minute your site is live at `https://USERNAME.github.io/REPOSITORY/`.

## Run locally

Open `index.html` in any modern browser. No installation needed.

## Privacy

Everything runs in your browser. Results are stored only in your browser's `localStorage`. No analytics, no tracking, no data sent anywhere.

## Screenshots

Add your own screenshots to a `screenshots/` folder and link them here after deploying.

## License

MIT
