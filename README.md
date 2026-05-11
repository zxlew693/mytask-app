# MyTask — Desktop Task Manager

> A fast, local-first task manager built with Electron + Angular. Your data stays on your machine — always.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Angular](https://img.shields.io/badge/Angular-21-red.svg?logo=angular)
![Electron](https://img.shields.io/badge/Electron-42-47848F.svg?logo=electron)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

---

![MyTask Screenshot](./public/logo.png)

> _Screenshot placeholder — replace with an actual screenshot of the app._

---

## ✨ Features

- 📁 **Project Management** — Organise tasks across multiple projects
- ✅ **Task Status Tracking** — Mark tasks as Current, Completed, or Cancelled
- 🎨 **Theme Support** — Light and dark mode out of the box
- 💾 **Local-First** — All data stored in SQLite on your machine, no cloud required
- ⚡ **Reactive UI** — Built with Angular Signals for instant, fine-grained updates
- 🖥️ **Native Desktop** — Runs as a true desktop app via Electron
- 🔒 **Privacy by Default** — Zero telemetry, zero accounts, zero internet required

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 42 |
| Frontend framework | Angular 21 (Standalone API) |
| UI components | Angular Material |
| Styling | Tailwind CSS 4.3 |
| Language | TypeScript 5.9 |
| Database | SQLite via `sql.js` |
| Reactivity | Angular Signals + RxJS 7.8 |
| Testing | Vitest |
| Packaging | Electron Forge |

---

## 📋 Prerequisites

- **Node.js** 20 or later
- **npm** 10 or later
- **Angular CLI** (optional, for `ng` commands)

```bash
npm install -g @angular/cli
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/zxlew693/mytask-app.git
cd mytask-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run in development mode

```bash
npm run dev
```

This starts the Angular dev server on `http://localhost:8888` and launches Electron once the server is ready. DevTools open automatically.

---

## 📦 Building & Distribution

### Production build

Compiles Angular and the Electron main process:

```bash
npm run build
```

Output:
- `dist/mytask-app/browser/` — Angular renderer bundle
- `dist-electron/` — Compiled Electron main process

### Package (unpacked executable)

```bash
npm run package
```

Produces an unpacked executable in `out/`.

### Create installer

```bash
npm run make
```

Creates a platform-specific installer (`.exe` on Windows, `.zip` on macOS) in `out/make/`.

### All available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Angular dev server + Electron (development) |
| `npm run build` | Production build (Angular + Electron) |
| `npm run package` | Package into unpacked executable |
| `npm run make` | Build and create platform installer |
| `npm run start:ng` | Start Angular dev server only |
| `npm run build:electron` | Compile Electron TypeScript only |

---

## 🏗 Architecture

MyTask follows a clean separation between the **renderer process** (Angular) and the **main process** (Electron/Node.js).

```
┌─────────────────────────────────────┐
│          Renderer Process           │
│  Angular 21 + Signals + Material   │
│                                     │
│  ProjectService ──► TaskService     │
│       │                  │          │
│   (signals)          (signals)      │
└──────────────┬──────────────────────┘
               │ IPC Bridge (contextBridge)
               │ window.electronAPI.*
┌──────────────▼──────────────────────┐
│           Main Process              │
│        Electron + Node.js           │
│                                     │
│   ipcMain handlers ──► sql.js       │
│                        DbService    │
│                        (mytask.db)   │
└─────────────────────────────────────┘
```

### Key design decisions

- **Signals-based state** — `ProjectService` and `TaskService` expose Angular Signals for zero-boilerplate reactivity. Components subscribe directly without manual change detection.
- **IPC bridge** — The renderer never has direct Node.js access. All database operations go through a typed `electronAPI` interface exposed via `contextBridge`, keeping the renderer sandboxed.
- **SQLite on disk** — `sql.js` (pure JavaScript SQLite) persists data to `mytask.db` in the user's app data directory. Every mutation writes the full database export to disk via `fs.writeFileSync()`.
- **Standalone Angular** — No `NgModule`. Every component, pipe, and directive is standalone, keeping the bundle lean and tree-shaking effective.

---

## 🤝 Contributing

Contributions are welcome and appreciated! Here's how to get involved:

### Setup

1. Fork the repository and clone your fork
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Make your changes, following the existing code style
4. Run tests: `npx vitest`
5. Commit with a clear message: `git commit -m "feat: add task due dates"`
6. Push and open a Pull Request against `main`

### Guidelines

- Keep PRs focused — one feature or fix per PR
- Add or update tests for new behaviour
- Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
- Check that the app builds and runs before submitting: `npm run build`

### Reporting bugs

Please [open an issue](https://github.com/zxlew693/mytask-app/issues/new?template=bug_report.md) with:
- Steps to reproduce
- Expected vs actual behaviour
- OS and app version

---

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you agree to uphold this standard. Please report unacceptable behaviour to the project maintainers.

---

## 📄 License

MIT © https://github.com/zxlew693

See [LICENSE](./LICENSE) for the full text.

---

<p align="center">Built with ☕ by <a href="https://github.com/zxlew693">zxlew693</a></p>
