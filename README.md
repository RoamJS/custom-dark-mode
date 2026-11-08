<a href="https://roamjs.com/">
    <img src="https://avatars.githubusercontent.com/u/138642184" alt="RoamJS Logo" title="RoamJS" align="right" height="60" />
</a>

# Custom Dark Mode

**Give your graph a polished dark mode and fine-tune its colors without editing `roam/css`.**

[![RoamJS](https://roamjs.com/badges/website.svg)](https://roamjs.com/) [![DeepWiki](https://roamjs.com/badges/deepwiki.svg)](https://deepwiki.com/RoamJS/custom-dark-mode) [![Slack](https://roamjs.com/badges/slack.svg)](https://roamresearch.slack.com/archives/C016N2B66JU)

## Features

- Dark, Auto, and Off modes
- GitHub Primer as the default palette and the original theme as a legacy preset
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

Choose **GitHub Primer** for the exact GitHub-inspired palette or **Original theme (Legacy)** for the extension's initial palette. Expand a color group to customize individual roles with a suggested swatch, a Tailwind color token such as `slate-900`, or a hex value such as `#0f172a`. Use **Reset all** to return every color to the selected preset.

Run **Custom Dark Mode: Toggle Dark Mode** from the command palette to switch between Off and your previously selected Dark or Auto mode.

## Roadmap

- More preset themes drawn from the theme-design mockups: black, gray, terminal, monochrome (black and white), and Ubuntu
- Save and load your own custom themes
- Preview color changes with example pages/components

### Full UI verification

Run `npm run build:roam` and `npm run test:ui-full` with the RoamJS session skills installed. The runner reserves a configured sandbox graph and profile through `roamjs-playwright-session`, including its stored login recovery. Set `ROAM_TEST_SLOT` to select a specific configured slot, or leave it unset for automatic selection. `ROAM_SESSION_HELPER` can point to the owning RoamJS checkout's `scripts/roam-session.mjs` when the managed skill link is unavailable.

The suite uses deterministic fixtures, including a Desk comparison for expanded, childless, and collapsed bullets. Screenshots, video, and reports are saved under `local/full-ui-test/latest/`.
