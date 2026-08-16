import { Button } from "@blueprintjs/core";
import type { CSSProperties } from "react";
import React from "react";
import ReactDOM from "react-dom";
import { createThemeSettingsComponent } from "~/components/ThemeSettings";
import { getThemeColorScheme } from "~/theme/colorScheme";
import type { RoamExtensionApi } from "~/types/roam";
import type { ThemeColorScheme, ThemeSettings } from "~/types/theme";

type ThemeSettingsDrawerController = {
  open: () => void;
  updateSettings: (settings: ThemeSettings) => void;
  unload: () => void;
};

const SETTINGS_MODAL_OVERLAY_SELECTOR =
  ".rm-modal-portal--settings .bp3-overlay";

export const getDrawerMountContainer = ({
  ownerDocument,
}: {
  ownerDocument: Document;
}): HTMLElement =>
  ownerDocument.querySelector<HTMLElement>(SETTINGS_MODAL_OVERLAY_SELECTOR) ||
  ownerDocument.body;

const getBrowserPrefersDark = (): boolean =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : true;

const getColorSchemeForSettings = (settings: ThemeSettings): ThemeColorScheme =>
  getThemeColorScheme({
    mode: settings.mode,
    prefersDark: getBrowserPrefersDark(),
  });

const DRAWER_BASE_STYLE: CSSProperties = {
  bottom: 0,
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  justifyContent: "flex-start",
  minHeight: 0,
  overflow: "hidden",
  position: "fixed",
  right: 0,
  top: 0,
  width: "min(440px, 92vw)",
  zIndex: 2000,
};

export const DARK_DRAWER_STYLE: CSSProperties = {
  ...DRAWER_BASE_STYLE,
  backgroundColor: "#0f172a",
  color: "#f1f5f9",
};

export const LIGHT_DRAWER_STYLE: CSSProperties = {
  ...DRAWER_BASE_STYLE,
  backgroundColor: "#ffffff",
  color: "#0f172a",
};

export const getDrawerStyle = ({
  colorScheme,
}: {
  colorScheme: ThemeColorScheme;
}): CSSProperties =>
  colorScheme === "light" ? LIGHT_DRAWER_STYLE : DARK_DRAWER_STYLE;

export const DRAWER_HEADER_STYLE: CSSProperties = {
  alignItems: "center",
  boxSizing: "border-box",
  display: "flex",
  flex: "0 0 auto",
  gap: 12,
  justifyContent: "space-between",
  margin: 0,
  minHeight: 44,
  padding: "8px 12px",
};

export const DRAWER_BODY_STYLE: CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
};

const DRAWER_CLASS_NAMES: Record<ThemeColorScheme, string> = {
  dark: "bp3-dark bg-slate-900 text-slate-100 shadow-2xl",
  light: "bg-white text-slate-900 shadow-2xl",
};

const DRAWER_HEADER_CLASS_NAMES: Record<ThemeColorScheme, string> = {
  dark: "border-b border-slate-700",
  light: "border-b border-slate-200",
};

export const createThemeSettingsDrawerController = ({
  extensionAPI,
  initialSettings,
  onSettingsChange,
}: {
  extensionAPI: RoamExtensionApi;
  initialSettings: ThemeSettings;
  onSettingsChange: (settings: ThemeSettings) => void;
}): ThemeSettingsDrawerController => {
  const root = document.createElement("div");
  root.id = "roamjs-custom-dark-theme-settings-root";
  document.body.appendChild(root);

  let isOpen = false;
  let isUnloaded = false;
  let currentSettings = initialSettings;
  let settingsRenderKey = 0;
  const ThemeSettings = createThemeSettingsComponent({
    extensionAPI,
    getInitialSettings: () => currentSettings,
    initialSettings,
    onSettingsChange: (settings) => {
      currentSettings = settings;
      onSettingsChange(settings);
      render();
    },
  });

  const close = (): void => {
    isOpen = false;
    render();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (isOpen && event.key === "Escape") {
      close();
    }
  };

  const render = (): void => {
    if (isUnloaded) return;

    const colorScheme = getColorSchemeForSettings(currentSettings);

    if (!isOpen) {
      ReactDOM.unmountComponentAtNode(root);
      return;
    }

    ReactDOM.render(
      <aside
        aria-label="Custom Dark Theme settings"
        className={DRAWER_CLASS_NAMES[colorScheme]}
        style={getDrawerStyle({ colorScheme })}
      >
        <header
          className={DRAWER_HEADER_CLASS_NAMES[colorScheme]}
          style={DRAWER_HEADER_STYLE}
        >
          <span className="m-0 font-semibold leading-5">Custom Dark Theme</span>
          <Button
            aria-label="Close Custom Dark Theme settings"
            minimal
            onClick={close}
            small
            text="Close"
          />
        </header>
        <div className="p-3" style={DRAWER_BODY_STYLE}>
          <ThemeSettings key={settingsRenderKey} />
        </div>
      </aside>,
      root,
    );
  };

  document.addEventListener("keydown", onKeyDown, true);

  return {
    open: () => {
      getDrawerMountContainer({ ownerDocument: document }).appendChild(root);
      isOpen = true;
      render();
    },
    updateSettings: (settings) => {
      currentSettings = settings;
      settingsRenderKey += 1;
      render();
    },
    unload: () => {
      isUnloaded = true;
      document.removeEventListener("keydown", onKeyDown, true);
      ReactDOM.unmountComponentAtNode(root);
      root.remove();
    },
  };
};
