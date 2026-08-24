# Changelog

## Unreleased

### Changed

- Made GitHub Primer the default theme and kept the extension's original palette available as **Original theme (Legacy)**.
- Added a switchable **GitHub Primer Tailwind** palette using included Tailwind colors with WCAG AA text, control-border, bullet, and selected-state contrast.
- Expanded the full Roam UI visual test with a rich-content gallery, both sidebars, native queries and tables, graph and help menus, autocomplete and context menus, tooltips, toasts, and additional native components.

## 1.0.0 - 2026-07-01

### Fixed

- Kept theme drawer controls usable when the drawer is opened over Roam Settings.
- Tailored quick color swatches to each theme role and made the selected swatch clear with a high-contrast outline and checkmark.
- Added a small inset around quick color swatches so their borders remain fully visible.
- Removed crowded background boxes from native icon controls while preserving readable icon colors.
- Made the advanced native search dialog use a single dark surface with a neutral selected result.
- Added a subtle main-window linked reference row background without changing references in other surfaces.
- Made native search result selection use a neutral dark highlight instead of the stronger blue menu selection.
- Removed the highlighted background from normal All Pages rows while keeping the header subtly filled.
- Kept active settings menu item text readable against the selected dark background.
- Removed the remaining native Roam background remnants from settings, Roam Depot, empty block, and reference wrapper surfaces.
- Fixed Roam Depot settings and All Pages surfaces by clearing the extension settings wrapper background and no longer styling the All Pages container as an input.
- Added a command palette action to toggle dark mode off and restore the previously selected dark or auto mode.
- Removed inset backgrounds from normal Roam block, reference, embed, settings, extension-list, and block-editor content in the default dark theme.
- Replaced the light settings color group header outline with a subtle filled background.
- Kept the custom palette defaults dark while still using light drawer chrome when the theme is off or auto mode resolves to light.
- Improved quick swatch contrast in both light and dark settings drawer chrome.
- Moved the Tailwind palette dropdown out of the custom color controls so it is always visible beside the quick swatches.
- Kept custom color controls open when selecting a quick swatch.
- Collapsed color groups by default, added an expand/collapse-all control, and removed the extra colors intro copy from the settings drawer.
- Tightened the custom theme settings drawer header spacing so the title and controls appear at the top without large blank gaps.
