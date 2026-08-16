import type { ThemeColorRole, ThemePalette } from "~/types/theme";

export const THEME_CLASS = "roamjs-custom-dark-theme";
export const THEME_STYLE_ID = "roamjs-custom-dark-theme-styles";

const cssVariableNames: Record<ThemeColorRole, string> = {
  appBackground: "--cdt-app-background",
  mainSurface: "--cdt-main-surface",
  sidebarSurface: "--cdt-sidebar-surface",
  elevatedSurface: "--cdt-elevated-surface",
  inputSurface: "--cdt-input-surface",
  popoverSurface: "--cdt-popover-surface",
  primaryText: "--cdt-primary-text",
  secondaryText: "--cdt-secondary-text",
  mutedText: "--cdt-muted-text",
  accent: "--cdt-accent",
  accentHover: "--cdt-accent-hover",
  pageReference: "--cdt-page-reference",
  blockReference: "--cdt-block-reference",
  border: "--cdt-border",
  hoverSurface: "--cdt-hover-surface",
  selectedSurface: "--cdt-selected-surface",
  highlight: "--cdt-highlight",
  codeSurface: "--cdt-code-surface",
  embedSurface: "--cdt-embed-surface",
  bullet: "--cdt-bullet",
};

const color = (role: ThemeColorRole): string =>
  `var(${cssVariableNames[role]})`;

const transparent = (role: ThemeColorRole, amount: number): string =>
  `color-mix(in srgb, ${color(role)} ${amount}%, transparent)`;

export const buildThemeCss = (palette: ThemePalette): string => {
  const variables = Object.entries(cssVariableNames)
    .map(([role, variable]) => {
      const value = palette[role as ThemeColorRole];
      return `  ${variable}: ${value};`;
    })
    .join("\n");

  return `
html.${THEME_CLASS} {
${variables}
  color-scheme: dark;
}

html.${THEME_CLASS},
body.${THEME_CLASS},
.${THEME_CLASS} #app,
.${THEME_CLASS} #layoutViewport,
.${THEME_CLASS} .roam-app,
.${THEME_CLASS} .roam-body,
.${THEME_CLASS} .roam-main,
.${THEME_CLASS} .roam-body-main,
.${THEME_CLASS} .rm-files-dropzone {
  background: ${color("appBackground")} !important;
  color: ${color("primaryText")} !important;
}

.${THEME_CLASS} .roam-article,
.${THEME_CLASS} .rm-article-wrapper,
.${THEME_CLASS} .roam-log-container,
.${THEME_CLASS} .roam-log-page,
.${THEME_CLASS} .roam-log-preview {
  background: ${color("mainSurface")} !important;
  color: ${color("primaryText")} !important;
}

.${THEME_CLASS} .rm-topbar,
.${THEME_CLASS} .top-row {
  background-color: ${color("elevatedSurface")} !important;
  color: ${color("primaryText")} !important;
  border-color: ${color("border")} !important;
}

.${THEME_CLASS} .rm-reference-main,
.${THEME_CLASS} .rm-reference-wrapper,
.${THEME_CLASS} .rm-reference-item,
.${THEME_CLASS} .rm-inline-references,
.${THEME_CLASS} .rm-embed-container--block,
.${THEME_CLASS} .rm-embed--page,
.${THEME_CLASS} .rm-embed-container,
.${THEME_CLASS} .rm-reference-main__child-wrapper,
.${THEME_CLASS} .rm-nested-refs,
.${THEME_CLASS} .rm-block-children,
.${THEME_CLASS} .rm-block__children,
.${THEME_CLASS} .rm-block__self,
.${THEME_CLASS} .rm-block-main,
.${THEME_CLASS} .rm-block--ghost,
.${THEME_CLASS} .rm-level-margin,
.${THEME_CLASS} .roam-block-container,
.${THEME_CLASS} #block-input-ghost {
  background-color: transparent !important;
  color: ${color("primaryText")} !important;
  border-color: ${color("border")} !important;
}

.${THEME_CLASS} .rm-multibar,
.${THEME_CLASS} .rm-multibar .rm-multibar {
  background-color: transparent !important;
}

.${THEME_CLASS} .roam-body-main .roam-article .rm-reference-main .rm-reference-item {
  background-color: color-mix(
    in srgb,
    ${color("elevatedSurface")} 45%,
    ${color("mainSurface")}
  ) !important;
}

.${THEME_CLASS} .roam-body .roam-sidebar-container,
.${THEME_CLASS} .roam-sidebar-container,
.${THEME_CLASS} .roam-sidebar-content,
.${THEME_CLASS} .starred-pages-wrapper,
.${THEME_CLASS} .starred-pages {
  background: ${color("sidebarSurface")} !important;
  color: ${color("secondaryText")} !important;
}

.${THEME_CLASS} .rm-title-display,
.${THEME_CLASS} .rm-title-display textarea,
.${THEME_CLASS} .roam-block,
.${THEME_CLASS} .rm-block,
.${THEME_CLASS} .dont-unfocus-block,
.${THEME_CLASS} .rm-block__input,
.${THEME_CLASS} textarea.rm-block-input,
.${THEME_CLASS} .rm-block-input,
.${THEME_CLASS} .rm-page__title,
.${THEME_CLASS} .rm-db-title,
.${THEME_CLASS} .rm-pages-title-text {
  color: ${color("primaryText")} !important;
}

.${THEME_CLASS} .rm-zoom,
.${THEME_CLASS} .rm-zoom-item,
.${THEME_CLASS} .rm-pages-col,
.${THEME_CLASS} .rm-pages-title-matching-blocks,
.${THEME_CLASS} .rm-settings-panel__description,
.${THEME_CLASS} .bp3-text-muted,
.${THEME_CLASS} .bp3-input::placeholder,
.${THEME_CLASS} textarea::placeholder {
  color: ${color("mutedText")} !important;
}

.${THEME_CLASS} .log-button,
.${THEME_CLASS} .rm-left-sidebar__daily-notes,
.${THEME_CLASS} .rm-left-sidebar__graph-overview,
.${THEME_CLASS} .rm-left-sidebar__all-pages,
.${THEME_CLASS} .rm-left-sidebar__roam-depot,
.${THEME_CLASS} .starred-pages .page,
.${THEME_CLASS} .bp3-button.bp3-minimal {
  color: ${color("secondaryText")} !important;
}

.${THEME_CLASS} .log-button:hover,
.${THEME_CLASS} .top-row:hover,
.${THEME_CLASS} .starred-pages .page:hover,
.${THEME_CLASS} .bp3-menu-item:hover,
.${THEME_CLASS} .bp3-button:not(.bp3-disabled):hover,
.${THEME_CLASS} .rm-pages-row:hover,
.${THEME_CLASS} .rm-clickable-pill:hover {
  background-color: ${color("hoverSurface")} !important;
  color: ${color("primaryText")} !important;
}

.${THEME_CLASS} .rm-page-ref,
.${THEME_CLASS} .rm-page-ref--link,
.${THEME_CLASS} .rm-alias,
.${THEME_CLASS} a {
  color: ${color("pageReference")} !important;
}

.${THEME_CLASS} .rm-page-ref:hover,
.${THEME_CLASS} .rm-page-ref--link:hover,
.${THEME_CLASS} .rm-alias:hover,
.${THEME_CLASS} a:hover {
  color: ${color("accentHover")} !important;
}

.${THEME_CLASS} .rm-block-ref,
.${THEME_CLASS} .rm-block-ref:hover,
.${THEME_CLASS} .rm-block__ref-count,
.${THEME_CLASS} .rm-reference-item .rm-page-ref {
  color: ${color("blockReference")} !important;
}

.${THEME_CLASS} .rm-tag,
.${THEME_CLASS} .rm-clickable-pill {
  background: ${transparent("accent", 12)} !important;
  color: ${color("accentHover")} !important;
  border-color: ${transparent("accent", 35)} !important;
}

.${THEME_CLASS} .rm-bullet__inner {
  background-color: ${color("bullet")} !important;
  border-color: ${color("mainSurface")} !important;
}

.${THEME_CLASS} .rm-bullet.rm-bullet--closed .rm-bullet__inner {
  background-color: transparent !important;
  border-color: ${color("bullet")} !important;
}

.${THEME_CLASS} .block-highlight-blue,
.${THEME_CLASS} .block-highlight-grey,
.${THEME_CLASS} .rm-highlight,
.${THEME_CLASS} mark {
  background-color: ${transparent("selectedSurface", 55)} !important;
  color: ${color("primaryText")} !important;
}

.${THEME_CLASS} .block-highlight-yellow,
.${THEME_CLASS} .block-highlight-yellow > .rm-block__self {
  background-color: ${transparent("highlight", 20)} !important;
  border-color: ${transparent("highlight", 80)} !important;
}

.${THEME_CLASS} .rm-selection,
.${THEME_CLASS} ::selection {
  background: ${transparent("accent", 35)} !important;
  color: ${color("primaryText")} !important;
}

.${THEME_CLASS} .bp3-input,
.${THEME_CLASS} .bp3-select select,
.${THEME_CLASS} .rm-input,
.${THEME_CLASS} #find-or-create-input,
.${THEME_CLASS} .rm-settings-panel textarea,
.${THEME_CLASS} .bp3-dialog textarea,
.${THEME_CLASS} .bp3-popover-content textarea,
.${THEME_CLASS} input {
  background-color: ${color("inputSurface")} !important;
  color: ${color("primaryText")} !important;
  border-color: ${color("border")} !important;
  box-shadow: inset 0 0 0 1px ${transparent("border", 65)} !important;
}

.${THEME_CLASS} .bp3-input:focus,
.${THEME_CLASS} .bp3-select select:focus,
.${THEME_CLASS} .rm-settings-panel textarea:focus,
.${THEME_CLASS} .bp3-dialog textarea:focus,
.${THEME_CLASS} .bp3-popover-content textarea:focus,
.${THEME_CLASS} input:focus {
  border-color: ${color("accent")} !important;
  box-shadow: 0 0 0 1px ${color("accent")} !important;
}

.${THEME_CLASS} .rm-title-display textarea,
.${THEME_CLASS} textarea.rm-block-input,
.${THEME_CLASS} textarea.rm-block-input:focus,
.${THEME_CLASS} .rm-block-input,
.${THEME_CLASS} .rm-block-input:focus,
.${THEME_CLASS} .rm-block__input,
.${THEME_CLASS} .rm-block__input:focus {
  background-color: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.${THEME_CLASS} .bp3-popover-content,
.${THEME_CLASS} .bp3-menu,
.${THEME_CLASS} .bp3-dialog,
.${THEME_CLASS} .bp3-dialog-header,
.${THEME_CLASS} .rm-autocomplete__results,
.${THEME_CLASS} .rm-modal-dialog,
.${THEME_CLASS} .rm-settings__panel-wrapper,
.${THEME_CLASS} .rm-settings-panel,
.${THEME_CLASS} .rm-settings-panel__contents,
.${THEME_CLASS} .rm-modal-portal--settings,
.${THEME_CLASS} .rm-settings,
.${THEME_CLASS} .rm-extensions-marketplace,
.${THEME_CLASS} .rm-extension-small {
  background-color: ${color("popoverSurface")} !important;
  color: ${color("primaryText")} !important;
  border-color: ${color("border")} !important;
}

.${THEME_CLASS} .rm-settings-tabs,
.${THEME_CLASS} .rm-extensions-marketplace-details {
  background-color: transparent !important;
  color: ${color("primaryText")} !important;
}

.${THEME_CLASS} .rm-settings .bp3-tab-list,
.${THEME_CLASS} .rm-settings-tabs > .bp3-tab-list,
.${THEME_CLASS} .rm-extensions-marketplace-search {
  background-color: ${color("sidebarSurface")} !important;
  color: ${color("secondaryText")} !important;
  border-color: ${color("border")} !important;
}

.${THEME_CLASS} #zotero-roam-portal .zr-auxiliary-dialog--settings .zr-settings-tabs-wrapper > .bp3-tab-list {
  background-color: ${color("sidebarSurface")} !important;
}

.${THEME_CLASS} #zotero-roam-portal .zr-auxiliary-dialog--settings .zr-settings-panel .zr-secondary {
  color: ${color("mutedText")} !important;
}

.${THEME_CLASS} .bp3-menu-item,
.${THEME_CLASS} .rm-autocomplete-result,
.${THEME_CLASS} .rm-settings__tab,
.${THEME_CLASS} .rm-settings-panel__setting {
  color: ${color("secondaryText")} !important;
}

.${THEME_CLASS} .bp3-menu-item.bp3-active,
.${THEME_CLASS} .bp3-menu-item.bp3-intent-primary,
.${THEME_CLASS} .rm-settings__tab[aria-selected="true"] {
  background-color: ${color("selectedSurface")} !important;
  color: ${color("primaryText")} !important;
}

.${THEME_CLASS} .rm-autocomplete-result:hover,
.${THEME_CLASS} .rm-autocomplete-result.selected {
  background-color: ${color("hoverSurface")} !important;
  color: ${color("primaryText")} !important;
}

.${THEME_CLASS} .rm-autocomplete-result:hover *,
.${THEME_CLASS} .rm-autocomplete-result.selected * {
  color: inherit !important;
}

.${THEME_CLASS} .rm-find-or-create__menu .bp3-menu-item.bp3-active,
.${THEME_CLASS} .rm-find-or-create__menu .bp3-menu-item.bp3-intent-primary {
  background-color: ${color("hoverSurface")} !important;
  color: ${color("primaryText")} !important;
}

.${THEME_CLASS} .rm-find-or-create__menu .bp3-menu-item.bp3-active *,
.${THEME_CLASS} .rm-find-or-create__menu .bp3-menu-item.bp3-intent-primary * {
  color: inherit !important;
}

.${THEME_CLASS} .bp3-button,
.${THEME_CLASS} .bp3-control-indicator,
.${THEME_CLASS} .bp3-tab {
  background-color: ${transparent("elevatedSurface", 90)} !important;
  color: ${color("secondaryText")} !important;
  border-color: ${color("border")} !important;
}

.${THEME_CLASS} .bp3-button.bp3-intent-primary,
.${THEME_CLASS} .bp3-control input:checked ~ .bp3-control-indicator,
.${THEME_CLASS} .bp3-tab[aria-selected="true"] {
  background-color: ${color("accent")} !important;
  color: ${color("appBackground")} !important;
}

.${THEME_CLASS} .bp3-button.bp3-minimal,
.${THEME_CLASS} .bp3-button.bp3-minimal[class*="bp3-icon-"],
.${THEME_CLASS} .bp3-button.bp3-small[class*="bp3-icon-"],
.${THEME_CLASS} button.bp3-button[class*="bp3-icon-"],
.${THEME_CLASS} span.bp3-button[class*="bp3-icon-"],
.${THEME_CLASS} .bp3-button.bp3-minimal:has(.bp3-icon),
.${THEME_CLASS} .bp3-button.bp3-small:has(.bp3-icon) {
  background-color: transparent !important;
  color: ${color("secondaryText")} !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.${THEME_CLASS} .bp3-button.bp3-minimal[class*="bp3-icon-"]::before,
.${THEME_CLASS} .bp3-button.bp3-minimal[class*="bp3-icon-"]::after,
.${THEME_CLASS} .bp3-button.bp3-small[class*="bp3-icon-"]::before,
.${THEME_CLASS} .bp3-button.bp3-small[class*="bp3-icon-"]::after,
.${THEME_CLASS} button.bp3-button[class*="bp3-icon-"]::before,
.${THEME_CLASS} button.bp3-button[class*="bp3-icon-"]::after,
.${THEME_CLASS} span.bp3-button[class*="bp3-icon-"]::before,
.${THEME_CLASS} span.bp3-button[class*="bp3-icon-"]::after,
.${THEME_CLASS} .bp3-button.bp3-minimal:has(.bp3-icon)::before,
.${THEME_CLASS} .bp3-button.bp3-minimal:has(.bp3-icon)::after,
.${THEME_CLASS} .bp3-button.bp3-small:has(.bp3-icon)::before,
.${THEME_CLASS} .bp3-button.bp3-small:has(.bp3-icon)::after,
.${THEME_CLASS} .bp3-button.bp3-minimal .bp3-icon,
.${THEME_CLASS} .bp3-button.bp3-small .bp3-icon {
  background-color: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.${THEME_CLASS} .bp3-button.bp3-minimal:hover,
.${THEME_CLASS} .bp3-button.bp3-minimal[class*="bp3-icon-"]:hover,
.${THEME_CLASS} .bp3-button.bp3-small[class*="bp3-icon-"]:hover,
.${THEME_CLASS} button.bp3-button[class*="bp3-icon-"]:hover,
.${THEME_CLASS} span.bp3-button[class*="bp3-icon-"]:hover,
.${THEME_CLASS} .bp3-button.bp3-minimal:has(.bp3-icon):hover,
.${THEME_CLASS} .bp3-button.bp3-small:has(.bp3-icon):hover,
.${THEME_CLASS} .bp3-button.bp3-minimal.bp3-active,
.${THEME_CLASS} .bp3-button.bp3-minimal:focus,
.${THEME_CLASS} .bp3-button.bp3-minimal:active {
  background-color: transparent !important;
  color: ${color("primaryText")} !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.${THEME_CLASS} .rm-settings-tabs .bp3-tab[aria-selected="true"],
.${THEME_CLASS} .rm-settings__tab[aria-selected="true"] {
  background-color: ${color("selectedSurface")} !important;
  color: ${color("primaryText")} !important;
}

.${THEME_CLASS} .rm-settings-tabs .bp3-tab[aria-selected="true"] *,
.${THEME_CLASS} .rm-settings__tab[aria-selected="true"] * {
  color: ${color("primaryText")} !important;
}

.${THEME_CLASS} .rm-modal-dialog--find-or-create,
.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-modal,
.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-modal-header,
.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-modal-header__search-bar,
.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-modal-main,
.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-modal-body-col,
.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-modal-body,
.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-modal-body__list,
.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-footer {
  background-color: ${color("popoverSurface")} !important;
  color: ${color("primaryText")} !important;
  border-color: ${color("border")} !important;
}

.${THEME_CLASS} .rm-modal-dialog--find-or-create #rm-find-or-create-modal-input,
.${THEME_CLASS} .rm-modal-dialog--find-or-create #rm-find-or-create-modal-input:focus {
  background-color: transparent !important;
  color: ${color("primaryText")} !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-modal-header__left-icon,
.${THEME_CLASS} .rm-modal-dialog--find-or-create .bp3-icon {
  color: ${color("mutedText")} !important;
}

.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-modal-header .bp3-button,
.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-footer__action,
.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-footer__actions,
.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-footer__action-hotkey,
.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-footer__action-hotkey-icon {
  background-color: transparent !important;
  color: ${color("secondaryText")} !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-modal-body__list .bp3-menu-item,
.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-row {
  background-color: transparent !important;
  color: ${color("primaryText")} !important;
}

.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-modal-body__list .bp3-menu-item:hover,
.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-modal-body__list .bp3-menu-item.bp3-active,
.${THEME_CLASS} .rm-modal-dialog--find-or-create .rm-find-or-create-modal-body__list .bp3-menu-item.bp3-intent-primary {
  background-color: ${color("hoverSurface")} !important;
  color: ${color("primaryText")} !important;
}

.${THEME_CLASS} code,
.${THEME_CLASS} pre,
.${THEME_CLASS} .rm-code-block,
.${THEME_CLASS} .bp3-code,
.${THEME_CLASS} .rm-inline-code {
  background-color: ${color("codeSurface")} !important;
  color: ${color("secondaryText")} !important;
  border-color: ${color("border")} !important;
}

.${THEME_CLASS} .rm-inline-reference {
  background-color: transparent !important;
  color: ${color("secondaryText")} !important;
  border-color: ${color("border")} !important;
}

.${THEME_CLASS} .rm-settings-panel__setting,
.${THEME_CLASS} .rm-settings-panel__section,
.${THEME_CLASS} .rm-settings-panel__section-wrapper,
.${THEME_CLASS} .rm-settings-panel__hotkeys,
.${THEME_CLASS} .rm-settings-panel__content,
.${THEME_CLASS} .rm-settings-panel__tab-content,
.${THEME_CLASS} .rm-settings-panel__setting-container,
.${THEME_CLASS} .rm-user-settings,
.${THEME_CLASS} .rm-graph-settings,
.${THEME_CLASS} .rm-extensions-settings,
.${THEME_CLASS} .rm-extensions-installed,
.${THEME_CLASS} .rm-extensions-installed__header,
.${THEME_CLASS} .rm-extension-installed,
.${THEME_CLASS} .rm-extension,
.${THEME_CLASS} .rm-extension-small,
.${THEME_CLASS} .rm-extension-list-item,
.${THEME_CLASS} .rm-extension-row,
.${THEME_CLASS} .rm-extensions-marketplace-search__settings,
.${THEME_CLASS} .rm-extensions-marketplace-search__results {
  background-color: transparent !important;
}

.${THEME_CLASS} .rm-pages-title-col,
.${THEME_CLASS} .rm-pages-checkbox-col,
.${THEME_CLASS} .rm-pages-col,
.${THEME_CLASS} .rm-pages-row {
  background-color: transparent !important;
  color: ${color("secondaryText")} !important;
  border-color: ${color("border")} !important;
}

.${THEME_CLASS} #rm-all-pages-column-titles,
.${THEME_CLASS} .rm-pages-row-header {
  background-color: ${color("elevatedSurface")} !important;
  color: ${color("secondaryText")} !important;
  border-color: ${color("border")} !important;
}

.${THEME_CLASS} .rm-diagram,
.${THEME_CLASS} .rm-diagram-title-panel,
.${THEME_CLASS} .react-flow,
.${THEME_CLASS} .react-flow__minimap {
  background-color: ${color("embedSurface")} !important;
  color: ${color("primaryText")} !important;
  border-color: ${color("border")} !important;
}

.${THEME_CLASS} .rm-diagram .react-flow__node-toolbar,
.${THEME_CLASS} .rm-diagram .react-flow__node-block,
.${THEME_CLASS} .rm-diagram .react-flow__node-group {
  background-color: ${color("elevatedSurface")} !important;
  color: ${color("primaryText")} !important;
  border-color: ${color("border")} !important;
}

.${THEME_CLASS} .bp3-overlay-backdrop,
.${THEME_CLASS} .rm-modal-backdrop {
  background-color: ${transparent("appBackground", 75)} !important;
}
`;
};
