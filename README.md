<a href="https://roamjs.com/">
    <img src="https://avatars.githubusercontent.com/u/138642184" alt="RoamJS Logo" title="RoamJS" align="right" height="60" />
</a>

# Custom Dark Mode

**Give your graph a polished dark mode and fine-tune its colors without editing `roam/css`.**

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/RoamJS/custom-dark-mode)
[![Slack](https://img.shields.io/badge/Slack-%23roam--js-purple)](https://roamresearch.slack.com/archives/C016N2B66JU)

## Features

- Dark, Auto, and Off modes
- A curated default palette for Roam surfaces, text, links, states, and content
- Quick color swatches, Tailwind color tokens, and custom hex values
- Per-user settings that do not write to `roam/css`
- Color-only styling that leaves Roam's layout and spacing unchanged
- Command palette actions for opening settings and quickly toggling dark mode

## Usage

Run **Custom Dark Mode: Open Settings** from the command palette.

Choose a mode:

- **Dark** always applies Custom Dark Mode.
- **Auto** applies it when your browser or operating system prefers a dark color scheme.
- **Off** removes the custom colors and restores Roam's normal appearance.

Expand a color group to customize individual roles with a suggested swatch, a Tailwind color token such as `slate-900`, or a hex value such as `#0f172a`. Use **Reset all** to return every color to the default palette.

Run **Custom Dark Mode: Toggle Dark Mode** from the command palette to switch between Off and your previously selected Dark or Auto mode.

## Roadmap

- Preset themes drawn from the theme-design mockups: black, gray, terminal, monochrome (black and white), and Ubuntu
- Save and load your own custom themes
