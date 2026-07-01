import runExtension from "roamjs-components/util/runExtension";
import { render as renderToast } from "roamjs-components/components/Toast";
import { createThemeSettingsDrawerController } from "~/components/ThemeSettingsDrawer";
import { createThemeRuntime } from "~/theme/runtime";
import { readThemeSettings } from "~/utils/settings";

const OPEN_SETTINGS_COMMAND = "Custom Dark Theme: Open Settings";

export default runExtension(async ({ extensionAPI }) => {
  const initialSettings = readThemeSettings({ extensionAPI });
  const themeRuntime = createThemeRuntime({ initialSettings });
  const settingsDrawer = createThemeSettingsDrawerController({
    extensionAPI,
    initialSettings,
    onSettingsChange: themeRuntime.update,
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
      void extensionAPI.ui.commandPalette
        .removeCommand({ label: OPEN_SETTINGS_COMMAND })
        .catch(() => undefined);
      settingsDrawer.unload();
      themeRuntime.unload();
    },
  };
});
