<a href="https://roamjs.com/">
    <img src="https://avatars.githubusercontent.com/u/138642184" alt="RoamJS Logo" title="RoamJS" align="right" height="60" />
</a>

# Custom Dark Theme

**Give your graph a polished dark theme and fine-tune its colors without editing `roam/css`.**

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/RoamJS/custom-dark-theme)
[![Slack](https://img.shields.io/badge/Slack-%23roam--js-purple)](https://roamresearch.slack.com/archives/C016N2B66JU)

## Features

- Dark, Auto, and Off modes
- GitHub Primer as the default palette and the original theme as a legacy preset
- Quick color swatches, Tailwind color tokens, and custom hex values
- Per-user settings that do not write to `roam/css`
- Command palette actions for opening settings and quickly toggling the theme

## Usage

Run **Custom Dark Theme: Open Settings** from the command palette.

Choose a mode:

- **Dark** always applies the custom theme.
- **Auto** applies it when your browser or operating system prefers a dark color scheme.
- **Off** removes the custom theme and restores Roam's normal appearance.

Choose **GitHub Primer** for the exact GitHub-inspired palette or **Original theme (Legacy)** for the extension's initial palette. Expand a color group to customize individual roles with a suggested swatch, a Tailwind color token such as `slate-900`, or a hex value such as `#0f172a`. Use **Reset all** to return every color to the selected preset.

Run **Custom Dark Theme: Toggle Dark Mode** from the command palette to switch between Off and your previously selected Dark or Auto mode.

## Roadmap

- More preset themes drawn from the theme-design mockups: black, gray, terminal, monochrome (black and white), and Ubuntu
- Save and load your own custom themes
