import { expect, test } from "@playwright/test";
import { buildThemeCss } from "../src/theme/css";
import { resolveThemePalette } from "../src/theme/palette";

test("does not paint content containers as inset surfaces", () => {
  const css = buildThemeCss(resolveThemePalette());

  expect(css).toContain(`.roamjs-custom-dark-theme .rm-block-ref,
.roamjs-custom-dark-theme .rm-block-ref:hover {
  border-bottom-color: var(--cdt-block-reference-underline) !important;
}`);

  expect(css).toContain(`.roamjs-custom-dark-theme .rm-reference-main,
.roamjs-custom-dark-theme .rm-reference-wrapper,
.roamjs-custom-dark-theme .rm-reference-item,
.roamjs-custom-dark-theme .rm-inline-references,
.roamjs-custom-dark-theme .rm-embed-container--block,
.roamjs-custom-dark-theme .rm-embed--page,
.roamjs-custom-dark-theme .rm-embed-container,
.roamjs-custom-dark-theme .rm-reference-main__child-wrapper,
.roamjs-custom-dark-theme .rm-nested-refs,
.roamjs-custom-dark-theme .rm-block-children,
.roamjs-custom-dark-theme .rm-block__children,
.roamjs-custom-dark-theme .rm-block__self,
.roamjs-custom-dark-theme .rm-block-main,
.roamjs-custom-dark-theme .rm-block--ghost,
.roamjs-custom-dark-theme .rm-level-margin,
.roamjs-custom-dark-theme .roam-block-container,
.roamjs-custom-dark-theme #block-input-ghost {
  background-color: transparent !important;
  color: var(--cdt-primary-text) !important;
  border-color: var(--cdt-border) !important;
}`);
  expect(css)
    .toContain(`.roamjs-custom-dark-theme .roam-body-main .roam-article .rm-reference-main .rm-reference-item {
  background-color: color-mix(
    in srgb,
    var(--cdt-elevated-surface) 45%,
    var(--cdt-main-surface)
  ) !important;
}`);
  expect(css).toContain(`.roamjs-custom-dark-theme .rm-title-display textarea,
.roamjs-custom-dark-theme textarea.rm-block-input,
.roamjs-custom-dark-theme textarea.rm-block-input:focus,
.roamjs-custom-dark-theme .rm-block-input,
.roamjs-custom-dark-theme .rm-block-input:focus,
.roamjs-custom-dark-theme .rm-block__input,
.roamjs-custom-dark-theme .rm-block__input:focus {
  background-color: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}`);
  expect(css).not.toContain(`.roamjs-custom-dark-theme textarea.rm-block-input,
.roamjs-custom-dark-theme textarea,
.roamjs-custom-dark-theme input {
  background-color: var(--cdt-input-surface) !important;
}`);
  expect(css).toContain(`.roamjs-custom-dark-theme .rm-settings-panel__setting,
.roamjs-custom-dark-theme .rm-settings-panel__section,
.roamjs-custom-dark-theme .rm-settings-panel__section-wrapper,
.roamjs-custom-dark-theme .rm-settings-panel__hotkeys,
.roamjs-custom-dark-theme .rm-settings-panel__content,
.roamjs-custom-dark-theme .rm-settings-panel__tab-content,
.roamjs-custom-dark-theme .rm-settings-panel__setting-container,
.roamjs-custom-dark-theme .rm-user-settings,
.roamjs-custom-dark-theme .rm-graph-settings,
.roamjs-custom-dark-theme .rm-extensions-settings,
.roamjs-custom-dark-theme .rm-extensions-installed,
.roamjs-custom-dark-theme .rm-extensions-installed__header,
.roamjs-custom-dark-theme .rm-extension-installed,
.roamjs-custom-dark-theme .rm-extension,
.roamjs-custom-dark-theme .rm-extension-small,
.roamjs-custom-dark-theme .rm-extension-list-item,
.roamjs-custom-dark-theme .rm-extension-row,
.roamjs-custom-dark-theme .rm-extensions-marketplace-search__settings,
.roamjs-custom-dark-theme .rm-extensions-marketplace-search__results {
  background-color: transparent !important;
}`);
  expect(css).toContain(`.roamjs-custom-dark-theme .bp3-popover-content,
.roamjs-custom-dark-theme .bp3-menu,
.roamjs-custom-dark-theme .bp3-dialog,
.roamjs-custom-dark-theme .bp3-dialog-header,
.roamjs-custom-dark-theme .rm-autocomplete__results,
.roamjs-custom-dark-theme .rm-modal-dialog,
.roamjs-custom-dark-theme .rm-settings__panel-wrapper,
.roamjs-custom-dark-theme .rm-settings-panel,
.roamjs-custom-dark-theme .rm-settings-panel__contents,
.roamjs-custom-dark-theme .rm-modal-portal--settings,
.roamjs-custom-dark-theme .rm-settings,
.roamjs-custom-dark-theme .rm-extensions-marketplace,
.roamjs-custom-dark-theme .rm-extension-small {
  background-color: var(--cdt-popover-surface) !important;
  color: var(--cdt-primary-text) !important;
  border-color: var(--cdt-border) !important;
}`);
  expect(css).toContain(`.roamjs-custom-dark-theme .rm-settings .bp3-tab-list,
.roamjs-custom-dark-theme .rm-settings-tabs > .bp3-tab-list,
.roamjs-custom-dark-theme .rm-extensions-marketplace-search {
  background-color: var(--cdt-sidebar-surface) !important;
  color: var(--cdt-secondary-text) !important;
  border-color: var(--cdt-border) !important;
}`);
  expect(css)
    .toContain(`.roamjs-custom-dark-theme .rm-settings-tabs .bp3-tab[aria-selected="true"],
.roamjs-custom-dark-theme .rm-settings__tab[aria-selected="true"] {
  background-color: var(--cdt-selected-surface) !important;
  color: var(--cdt-primary-text) !important;
}`);
  expect(css)
    .toContain(`.roamjs-custom-dark-theme .rm-settings-tabs .bp3-tab[aria-selected="true"] *,
.roamjs-custom-dark-theme .rm-settings__tab[aria-selected="true"] * {
  color: var(--cdt-primary-text) !important;
}`);
  expect(css)
    .toContain(`.roamjs-custom-dark-theme .rm-autocomplete-result:hover,
.roamjs-custom-dark-theme .rm-autocomplete-result.selected {
  background-color: var(--cdt-hover-surface) !important;
  color: var(--cdt-primary-text) !important;
}`);
  expect(css)
    .toContain(`.roamjs-custom-dark-theme .rm-find-or-create__menu .bp3-menu-item.bp3-active,
.roamjs-custom-dark-theme .rm-find-or-create__menu .bp3-menu-item.bp3-intent-primary {
  background-color: var(--cdt-hover-surface) !important;
  color: var(--cdt-primary-text) !important;
}`);
  expect(css)
    .toContain(`.roamjs-custom-dark-theme .rm-modal-dialog--find-or-create,
.roamjs-custom-dark-theme .rm-modal-dialog--find-or-create .rm-find-or-create-modal,
.roamjs-custom-dark-theme .rm-modal-dialog--find-or-create .rm-find-or-create-modal-header,
.roamjs-custom-dark-theme .rm-modal-dialog--find-or-create .rm-find-or-create-modal-header__search-bar,
.roamjs-custom-dark-theme .rm-modal-dialog--find-or-create .rm-find-or-create-modal-main,
.roamjs-custom-dark-theme .rm-modal-dialog--find-or-create .rm-find-or-create-modal-body-col,
.roamjs-custom-dark-theme .rm-modal-dialog--find-or-create .rm-find-or-create-modal-body,
.roamjs-custom-dark-theme .rm-modal-dialog--find-or-create .rm-find-or-create-modal-body__list,
.roamjs-custom-dark-theme .rm-modal-dialog--find-or-create .rm-find-or-create-footer {
  background-color: var(--cdt-popover-surface) !important;
  color: var(--cdt-primary-text) !important;
  border-color: var(--cdt-border) !important;
}`);
  expect(css)
    .toContain(`.roamjs-custom-dark-theme .rm-modal-dialog--find-or-create .rm-find-or-create-modal-body__list .bp3-menu-item:hover,
.roamjs-custom-dark-theme .rm-modal-dialog--find-or-create .rm-find-or-create-modal-body__list .bp3-menu-item.bp3-active,
.roamjs-custom-dark-theme .rm-modal-dialog--find-or-create .rm-find-or-create-modal-body__list .bp3-menu-item.bp3-intent-primary {
  background-color: var(--cdt-hover-surface) !important;
  color: var(--cdt-primary-text) !important;
}`);
  expect(css).toContain(`.roamjs-custom-dark-theme .bp3-button.bp3-minimal,
.roamjs-custom-dark-theme .bp3-button.bp3-minimal[class*="bp3-icon-"],
.roamjs-custom-dark-theme .bp3-button.bp3-small[class*="bp3-icon-"],
.roamjs-custom-dark-theme button.bp3-button[class*="bp3-icon-"],
.roamjs-custom-dark-theme span.bp3-button[class*="bp3-icon-"],
.roamjs-custom-dark-theme .bp3-button.bp3-minimal:has(.bp3-icon),
.roamjs-custom-dark-theme .bp3-button.bp3-small:has(.bp3-icon) {
  background-color: transparent !important;
  color: var(--cdt-secondary-text) !important;
  border-color: transparent !important;
  box-shadow: none !important;
}`);
  expect(css)
    .toContain(`.roamjs-custom-dark-theme .bp3-button.bp3-minimal[class*="bp3-icon-"]::before,
.roamjs-custom-dark-theme .bp3-button.bp3-minimal[class*="bp3-icon-"]::after,
.roamjs-custom-dark-theme .bp3-button.bp3-small[class*="bp3-icon-"]::before,
.roamjs-custom-dark-theme .bp3-button.bp3-small[class*="bp3-icon-"]::after,
.roamjs-custom-dark-theme button.bp3-button[class*="bp3-icon-"]::before,
.roamjs-custom-dark-theme button.bp3-button[class*="bp3-icon-"]::after,
.roamjs-custom-dark-theme span.bp3-button[class*="bp3-icon-"]::before,
.roamjs-custom-dark-theme span.bp3-button[class*="bp3-icon-"]::after,
.roamjs-custom-dark-theme .bp3-button.bp3-minimal:has(.bp3-icon)::before,
.roamjs-custom-dark-theme .bp3-button.bp3-minimal:has(.bp3-icon)::after,
.roamjs-custom-dark-theme .bp3-button.bp3-small:has(.bp3-icon)::before,
.roamjs-custom-dark-theme .bp3-button.bp3-small:has(.bp3-icon)::after,
.roamjs-custom-dark-theme .bp3-button.bp3-minimal .bp3-icon,
.roamjs-custom-dark-theme .bp3-button.bp3-small .bp3-icon {
  background-color: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}`);
  expect(css)
    .toContain(`.roamjs-custom-dark-theme .bp3-button.bp3-minimal:hover,
.roamjs-custom-dark-theme .bp3-button.bp3-minimal[class*="bp3-icon-"]:hover,
.roamjs-custom-dark-theme .bp3-button.bp3-small[class*="bp3-icon-"]:hover,
.roamjs-custom-dark-theme button.bp3-button[class*="bp3-icon-"]:hover,
.roamjs-custom-dark-theme span.bp3-button[class*="bp3-icon-"]:hover,
.roamjs-custom-dark-theme .bp3-button.bp3-minimal:has(.bp3-icon):hover,
.roamjs-custom-dark-theme .bp3-button.bp3-small:has(.bp3-icon):hover,
.roamjs-custom-dark-theme .bp3-button.bp3-minimal.bp3-active,
.roamjs-custom-dark-theme .bp3-button.bp3-minimal:focus,
.roamjs-custom-dark-theme .bp3-button.bp3-minimal:active {
  background-color: transparent !important;
  color: var(--cdt-primary-text) !important;
  border-color: transparent !important;
  box-shadow: none !important;
}`);
  expect(css).not
    .toContain(`.roamjs-custom-dark-theme .bp3-menu-item.bp3-active,
.roamjs-custom-dark-theme .bp3-menu-item.bp3-intent-primary,
.roamjs-custom-dark-theme .rm-autocomplete-result:hover,
.roamjs-custom-dark-theme .rm-autocomplete-result.selected,
.roamjs-custom-dark-theme .rm-settings__tab[aria-selected="true"] {
  background-color: var(--cdt-selected-surface) !important;
  color: var(--cdt-primary-text) !important;
}`);
  expect(css).toContain(`.roamjs-custom-dark-theme .rm-pages-title-col,
.roamjs-custom-dark-theme .rm-pages-checkbox-col,
.roamjs-custom-dark-theme .rm-pages-col,
.roamjs-custom-dark-theme .rm-pages-row {
  background-color: transparent !important;
  color: var(--cdt-secondary-text) !important;
  border-color: var(--cdt-border) !important;
}`);
  expect(css).toContain(`.roamjs-custom-dark-theme #rm-all-pages-column-titles,
.roamjs-custom-dark-theme .rm-pages-row-header {
  background-color: var(--cdt-elevated-surface) !important;
  color: var(--cdt-secondary-text) !important;
  border-color: var(--cdt-border) !important;
}`);
  expect(css).not.toContain(`.roamjs-custom-dark-theme .rm-reference-main,
.roamjs-custom-dark-theme .rm-reference-item,
.roamjs-custom-dark-theme .rm-inline-references,
.roamjs-custom-dark-theme .rm-embed-container--block,
.roamjs-custom-dark-theme .rm-embed--page,
.roamjs-custom-dark-theme .rm-embed-container {
  background-color: var(--cdt-elevated-surface) !important;
}`);
  expect(css).not.toContain(".roamjs-custom-dark-theme #all-pages-search,\n");
  expect(css).toContain(
    `.roamjs-custom-dark-theme #roamjs-custom-dark-theme-settings-root .roamjs-custom-dark-theme-color-group-header.bp3-button.bp3-minimal {
  background: var(--cdt-elevated-surface) !important;
  border-color: var(--cdt-border) !important;
}`,
  );
});
