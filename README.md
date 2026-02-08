# ⬡ ClawdPanels

A widget-based personal dashboard powered by [Clawdbot](https://github.com/clawdbot/clawdbot). Create, configure, and arrange widgets through an AI agent — just describe what you want and it builds it.

![ClawdPanels Dashboard](https://raw.githubusercontent.com/aeon-clawd/clawdpanels/main/docs/screenshot.png)

## ✨ Features

- **🧩 Widget System** — Standardized widget spec for easy creation and sharing
- **🤖 AI Widget Creator** — Built-in chat agent that creates custom widgets from descriptions
- **📐 Drag & Drop Layout** — Responsive grid with resize, rearrange, and per-widget configuration
- **🎨 Dark Theme** — Clean, modern UI designed for always-on dashboards
- **🔌 Clawdbot Integration** — Connects to your Clawdbot gateway for AI-powered widget creation
- **💾 Persistent** — Layout and configs saved to localStorage (more backends coming)

## 📦 Built-in Widgets

| Widget | Description |
|--------|------------|
| 🕐 Clock | Current time with timezone support |
| ⛅ Weather | Current weather and forecast via wttr.in |
| 📝 Notes | Quick inline notes with edit/save |
| ⏳ Countdown | Countdown to any target date |
| 📈 Portfolio | Investment portfolio overview |

## 🚀 Quick Start

```bash
git clone https://github.com/aeon-clawd/clawdpanels.git
cd clawdpanels
npm install
npm run dev
```

Open `http://localhost:5173` and start adding widgets.

## 🤖 Connecting to Clawdbot

Click the **💬 Agent** button, then configure:

1. **Gateway URL** — Your Clawdbot gateway address (default: `http://localhost:3577`)
2. **Gateway Token** — Optional auth token
3. **Model** — Select which AI model to use for widget creation

Then just describe what widget you want:

> "I want a widget that shows my Aimharder workout schedule"

The agent will create, preview, and register the widget for you.

## 🧩 Widget Spec

Every widget follows a standard structure. See [WIDGET_SPEC.md](./WIDGET_SPEC.md) for the full specification.

```
widgets/
  my-widget/
    widget.json    # Metadata & config schema
    Widget.jsx     # React component
```

### Creating Widgets Manually

```jsx
// widgets/my-widget/Widget.jsx
export default function MyWidget({ config, onConfigChange, size }) {
  return <div>Hello from {config.title}!</div>
}
```

Register it in the widget registry and it appears in the Add Widget picker.

## 🏗️ Architecture

```
┌──────────────────────────────────────────────┐
│                  ClawdPanels                  │
├──────────────┬──────────────┬────────────────┤
│  Dashboard   │  Widget      │  Chat Panel    │
│  (Grid)      │  Registry    │  (Agent)       │
├──────────────┼──────────────┼────────────────┤
│  Layout      │  Widget      │  Clawdbot      │
│  Context     │  Context     │  Context       │
├──────────────┴──────────────┴────────────────┤
│              React + Vite                     │
└──────────────────────────────────────────────┘
```

## 🗺️ Roadmap

- [ ] Dynamic widget creation via agent (code generation + hot-load)
- [ ] Widget marketplace / sharing
- [ ] Backend persistence (file-based, database)
- [ ] Real-time data sources via Clawdbot skills
- [ ] Mobile-optimized view
- [ ] Export/import dashboard configs
- [ ] Theming support

## 📄 License

MIT

---

Built with ❤️ by [Aeon](https://github.com/aeon-clawd) & Clawdbot
