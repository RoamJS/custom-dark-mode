import React from "react";
import ReactDOM from "react-dom";
import { createThemeSettingsComponent } from "~/components/ThemeSettings";
import type { ThemeSettings } from "~/types/theme";

type ThemeSettingsDrawerController = {
  open: () => void;
  unload: () => void;
};

export const createThemeSettingsDrawerController = ({
  extensionAPI,
  initialSettings,
  onSettingsChange,
}: {
  extensionAPI: RoamExtensionAPI;
  initialSettings: ThemeSettings;
  onSettingsChange: (settings: ThemeSettings) => void;
}): ThemeSettingsDrawerController => {
  const root = document.createElement("div");
  root.id = "roamjs-custom-dark-theme-settings-root";
  document.body.appendChild(root);

  let isOpen = false;
  let isUnloaded = false;
  let currentSettings = initialSettings;
  const ThemeSettings = createThemeSettingsComponent({
    extensionAPI,
    getInitialSettings: () => currentSettings,
    initialSettings,
    onSettingsChange: (settings) => {
      currentSettings = settings;
      onSettingsChange(settings);
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

    ReactDOM.render(
      isOpen ? (
        <aside
          aria-label="Custom Dark Theme settings"
          className="bp3-dark fixed bottom-0 right-0 top-0 z-[2000] flex w-[min(440px,92vw)] flex-col bg-slate-900 text-slate-100 shadow-2xl"
        >
          <header
            className="flex items-center justify-between gap-3 border-b border-slate-700"
            style={{ minHeight: 36, padding: "6px 12px" }}
          >
            <span
              className="font-semibold"
              style={{ lineHeight: "20px", margin: 0 }}
            >
              Custom Dark Theme
            </span>
            <button
              aria-label="Close Custom Dark Theme settings"
              className="bp3-button bp3-minimal bp3-small"
              onClick={close}
              type="button"
            >
              Close
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <ThemeSettings />
          </div>
        </aside>
      ) : null,
      root,
    );
  };

  document.addEventListener("keydown", onKeyDown, true);

  return {
    open: () => {
      isOpen = true;
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
