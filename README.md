<p align="center">
  <img src="public/icons/icon.png" width="60" height="60" alt="Scorecard App">
</p>
<h1 align="center">Scorecard</h1>
<h3 align="center" style="font-weight: normal;">
  Baseball scorecard app with diamond-based at-bat tracking
</h3>
<p align="center">
  <a href="https://opensource.org/licenses/mit">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License">
  </a>
  <a href="https://github.com/stevederico/scorecard/stargazers">
    <img src="https://img.shields.io/github/stars/stevederico/scorecard?style=social" alt="GitHub stars">
  </a>
</p>

## About

A baseball scorecard built with React and Hono. Track at-bats with diamond-based notation, manage lineups, and score games using standard baseball shorthand (K, BB, 6-3, F8, HR, etc).

### Features

- **Diamond at-bat boxes** — visual base path tracking per plate appearance
- **9-inning grid** — full lineup with 9 batting slots
- **Standard notation** — K, BB, 1B, 2B, 3B, HR, F7, 6-3, DP, and custom entries
- **Out tracking** — automatic out numbering with 3-out-per-inning enforcement
- **Base advancement** — toggle individual bases for runner tracking
- **Live stats** — AB, H, R totals per player and per inning
- **Dark mode** — full dark mode support

## Quick Start

```bash
git clone https://github.com/stevederico/scorecard.git
cd scorecard
deno install
deno run start
```

App runs at `http://localhost:5173`

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI |
| Vite 7.1+ | Build & dev server |
| Tailwind CSS v4 | Styling |
| Shadcn/ui | Components |
| Hono | Backend server |
| SQLite | Database |
| Skateboard-ui | Application shell |

## Project Structure

```
scorecard/
├── src/
│   ├── components/
│   │   └── BaseballView.jsx   # Scorecard component
│   ├── main.jsx               # Routes
│   └── constants.json         # App config
├── backend/
│   ├── server.js              # Hono API server
│   └── adapters/              # Database adapters
└── package.json
```

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Built by <a href="https://github.com/stevederico">Steve Derico</a>
</div>
