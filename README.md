# Custom Dark Theme

A per-user customizable dark theme for Roam Research.

## Features

- Dark, Auto, and Off modes
- One built-in preset: Default
- Curated color roles for Roam surfaces, text, links, states, and content
- Tailwind color tokens plus custom hex overrides
- Per-user settings through the Roam Depot extension settings API

The extension injects a managed stylesheet at runtime and does not write to `roam/css`.

## Development

```sh
npm install
npm run build:roam
```
