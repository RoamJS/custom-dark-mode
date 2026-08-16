import runExtension from "roamjs-components/util/runExtension";
import { render as renderToast } from "roamjs-components/components/Toast";
import { createThemeSettingsDrawerController } from "~/components/ThemeSettingsDrawer";
import { createThemeRuntime } from "~/theme/runtime";
import { readThemeSettings, toggleThemeModeSettings } from "~/utils/settings";

const OPEN_SETTINGS_COMMAND = "Custom Dark Theme: Open Settings";
const TOGGLE_DARK_MODE_COMMAND = "Custom Dark Theme: Toggle Dark Mode";
const COMMAND_LABELS = [OPEN_SETTINGS_COMMAND, TOGGLE_DARK_MODE_COMMAND];

export default runExtension(async ({ extensionAPI }) => {
  let currentSettings = readThemeSettings({ extensionAPI });
  const themeRuntime = createThemeRuntime({ initialSettings: currentSettings });
  const settingsDrawer = createThemeSettingsDrawerController({
    extensionAPI,
    initialSettings: currentSettings,
    onSettingsChange: (settings) => {
      currentSettings = settings;
      themeRuntime.update(settings);
    },
  });

  extensionAPI.settings.panel.create({
    tabTitle: "Custom Dark Theme",
    settings: [
      {
        id: "custom-dark-theme-settings",
        name: "Settings",
        description: "Open the custom dark theme sidebar.",
        action: {
          type: "button",
          content: "Open Theme Sidebar",
          onClick: () => settingsDrawer.open(),
        },
      },
    ],
  });

  void extensionAPI.ui.commandPalette
    .addCommand({
      label: OPEN_SETTINGS_COMMAND,
      callback: () => settingsDrawer.open(),
    })
    .catch(() => undefined);

  void extensionAPI.ui.commandPalette
    .addCommand({
      label: TOGGLE_DARK_MODE_COMMAND,
      callback: () => {
        currentSettings = toggleThemeModeSettings({
          extensionAPI,
          settings: currentSettings,
        });
        themeRuntime.update(currentSettings);
        settingsDrawer.updateSettings(currentSettings);
      },
    })
    .catch(() => undefined);

  if (process.env.NODE_ENV === "development") {
    renderToast({
      id: "custom-dark-theme-loaded",
      content: "Successfully loaded Custom Dark Theme",
      intent: "success",
      timeout: 500,
    });
  }

  return {
    unload: () => {
      COMMAND_LABELS.forEach((label) => {
        void extensionAPI.ui.commandPalette
          .removeCommand({ label })
          .catch(() => undefined);
      });
      settingsDrawer.unload();
      themeRuntime.unload();
    },
  };
});
