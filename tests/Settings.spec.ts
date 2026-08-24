import { expect, test } from "@playwright/test";
import {
  getToggledThemeMode,
  readThemeSettings,
  THEME_LAST_ENABLED_MODE_SETTING_KEY,
  THEME_MODE_SETTING_KEY,
  THEME_PRESET_SETTING_KEY,
  toggleThemeModeSettings,
} from "../src/utils/settings";
import type { ThemeSettings } from "../src/types/theme";

type SettingsStore = Record<string, unknown>;

const createExtensionApi = (store: SettingsStore): RoamExtensionAPI =>
  ({
    settings: {
      get: (key: string) => store[key],
      set: (key: string, value: unknown) => {
        store[key] = value;
        return Promise.resolve();
      },
    },
  }) as RoamExtensionAPI;

const createSettings = (mode: ThemeSettings["mode"]): ThemeSettings => ({
  mode,
  overrides: {},
  preset: "default",
});

test("toggles dark mode off and back to dark", () => {
  expect(getToggledThemeMode({ lastEnabledMode: "dark", mode: "dark" })).toBe(
    "off",
  );
  expect(getToggledThemeMode({ lastEnabledMode: "dark", mode: "off" })).toBe(
    "dark",
  );
});

test("restores auto mode when auto was selected before off", () => {
  const store: SettingsStore = {};
  const extensionAPI = createExtensionApi(store);

  const offSettings = toggleThemeModeSettings({
    extensionAPI,
    settings: createSettings("auto"),
  });
  expect(offSettings.mode).toBe("off");
  expect(store[THEME_LAST_ENABLED_MODE_SETTING_KEY]).toBe("auto");
  expect(store[THEME_MODE_SETTING_KEY]).toBe("off");

  const autoSettings = toggleThemeModeSettings({
    extensionAPI,
    settings: offSettings,
  });
  expect(autoSettings.mode).toBe("auto");
  expect(store[THEME_MODE_SETTING_KEY]).toBe("auto");
});

test("reads the original legacy preset from the existing preset setting", () => {
  const store: SettingsStore = {
    [THEME_PRESET_SETTING_KEY]: "initial-legacy",
  };

  expect(
    readThemeSettings({ extensionAPI: createExtensionApi(store) }),
  ).toEqual({
    mode: "dark",
    overrides: {},
    preset: "initial-legacy",
  });
});

test("reads the GitHub Primer Tailwind preset", () => {
  const store: SettingsStore = {
    [THEME_PRESET_SETTING_KEY]: "github-primer-tailwind",
  };

  expect(
    readThemeSettings({ extensionAPI: createExtensionApi(store) }),
  ).toMatchObject({ preset: "github-primer-tailwind" });
});
