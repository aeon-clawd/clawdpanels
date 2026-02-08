# ClawdPanels Widget Specification v1.0

## Overview

A widget is a self-contained React component that displays data in the ClawdPanels dashboard. Every widget follows this standard to ensure consistency and dynamic creation.

## Widget Structure

```
widgets/
  my-widget/
    widget.json       # Metadata & config schema
    Widget.jsx        # React component
    index.js          # Exports
```

## widget.json

```json
{
  "id": "unique-widget-id",
  "name": "My Widget",
  "description": "What this widget shows",
  "version": "1.0.0",
  "author": "username",
  "icon": "📊",
  "category": "general",
  "defaultSize": { "w": 4, "h": 3 },
  "minSize": { "w": 2, "h": 2 },
  "maxSize": { "w": 12, "h": 8 },
  "configSchema": {
    "type": "object",
    "properties": {
      "title": { "type": "string", "default": "My Widget" },
      "refreshInterval": { "type": "number", "default": 60, "description": "Refresh interval in seconds" }
    }
  },
  "dataSource": {
    "type": "api|static|clawdbot",
    "endpoint": "/api/data",
    "skill": "weather"
  }
}
```

## Widget Component Contract

```jsx
// Widget.jsx receives these props:
function Widget({ config, data, onConfigChange, size }) {
  // config: merged configSchema defaults + user overrides
  // data: fetched data from dataSource (or null if loading)
  // onConfigChange: callback to persist config changes
  // size: { w, h } current grid size
  return <div>...</div>
}
```

## Categories

- `general` - Clock, notes, text
- `data` - APIs, feeds, metrics
- `fitness` - Aimharder, health tracking
- `finance` - Portfolio, trading, crypto
- `productivity` - Calendar, tasks, email
- `media` - News, social, entertainment
- `system` - Clawdbot status, logs

## Sizing

Grid is 12 columns wide. Height units are ~80px each.
- Small: 2x2 (compact info)
- Medium: 4x3 (standard)
- Large: 6x4 (charts, tables)
- Full-width: 12x4 (timelines, feeds)

## Data Fetching

Widgets can get data from:
1. **api** - Direct HTTP endpoint
2. **static** - Hardcoded/config-based data
3. **clawdbot** - Via Clawdbot session API (skill execution)

The dashboard shell handles data fetching based on `dataSource` config. Widgets just receive `data` as a prop.

## Widget Registry

All available widgets are listed in `widget-registry.json`:

```json
{
  "widgets": [
    { "id": "clock", "path": "./widgets/clock", "builtin": true },
    { "id": "custom-123", "path": "./widgets/custom-123", "builtin": false }
  ]
}
```

Custom widgets created via the chat agent are saved to the registry automatically.
