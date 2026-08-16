import type {
  ThemeMode,
  ThemePaletteOverrides,
  ThemePresetId,
  ThemeSettings,
} from "~/types/theme";
import type { RoamExtensionApi } from "~/types/roam";
import { THEME_MODE_VALUES, THEME_PRESET_VALUES } from "~/types/theme";
import { normalizePaletteOverrides } from "~/theme/palette";

export const THEME_MODE_SETTING_KEY = "theme-mode";
export const THEME_PRESET_SETTING_KEY = "theme-preset";
export const THEME_PALETTE_OVERRIDES_SETTING_KEY = "theme-palette-overrides";
export const THEME_LAST_ENABLED_MODE_SETTING_KEY = "theme-last-enabled-mode";

type EnabledThemeMode = Exclude<ThemeMode, "off">;

const isThemeMode = (value: unknown): value is ThemeMode =>
  typeof value === "string" && THEME_MODE_VALUES.includes(value as ThemeMode);

const isEnabledThemeMode = (value: unknown): value is EnabledThemeMode =>
  value === "dark" || value === "auto";

const isThemePreset = (value: unknown): value is ThemePresetId =>
  typeof value === "string" &&
  THEME_PRESET_VALUES.includes(value as ThemePresetId);

export const getToggledThemeMode = ({
  lastEnabledMode,
  mode,
}: {
  lastEnabledMode: EnabledThemeMode;
  mode: ThemeMode;
}): ThemeMode => (mode === "off" ? lastEnabledMode : "off");

export const readLastEnabledThemeMode = ({
  extensionAPI,
  fallback = "dark",
}: {
  extensionAPI: RoamExtensionApi;
  fallback?: EnabledThemeMode;
}): EnabledThemeMode => {
  const lastEnabledMode = extensionAPI.settings.get(
    THEME_LAST_ENABLED_MODE_SETTING_KEY,
  );
  return isEnabledThemeMode(lastEnabledMode) ? lastEnabledMode : fallback;
};

const persistLastEnabledThemeMode = ({
  extensionAPI,
  mode,
}: {
  extensionAPI: RoamExtensionApi;
  mode: EnabledThemeMode;
}): void => {
  void extensionAPI.settings.set(THEME_LAST_ENABLED_MODE_SETTING_KEY, mode);
};

export const readThemeSettings = ({
  extensionAPI,
}: {
  extensionAPI: RoamExtensionApi;
}): ThemeSettings => {
  const mode = extensionAPI.settings.get(THEME_MODE_SETTING_KEY);
  const preset = extensionAPI.settings.get(THEME_PRESET_SETTING_KEY);
  const overrides = extensionAPI.settings.get(
    THEME_PALETTE_OVERRIDES_SETTING_KEY,
  );

  return {
    mode: isThemeMode(mode) ? mode : "dark",
    preset: isThemePreset(preset) ? preset : "default",
    overrides: normalizePaletteOverrides(overrides),
  };
};

export const persistThemeSettings = ({
  extensionAPI,
  settings,
}: {
  extensionAPI: RoamExtensionApi;
  settings: ThemeSettings;
}): void => {
  void extensionAPI.settings.set(THEME_MODE_SETTING_KEY, settings.mode);
  void extensionAPI.settings.set(THEME_PRESET_SETTING_KEY, settings.preset);
  void extensionAPI.settings.set(
    THEME_PALETTE_OVERRIDES_SETTING_KEY,
    settings.overrides,
  );
  if (settings.mode !== "off") {
    persistLastEnabledThemeMode({ extensionAPI, mode: settings.mode });
  }
};

export const toggleThemeModeSettings = ({
  extensionAPI,
  settings,
}: {
  extensionAPI: RoamExtensionApi;
  settings: ThemeSettings;
}): ThemeSettings => {
  const fallbackMode = settings.mode === "off" ? "dark" : settings.mode;
  const lastEnabledMode = readLastEnabledThemeMode({
    extensionAPI,
    fallback: fallbackMode,
  });
  if (settings.mode !== "off") {
    persistLastEnabledThemeMode({ extensionAPI, mode: settings.mode });
  }

  const nextSettings = {
    ...settings,
    mode: getToggledThemeMode({ lastEnabledMode, mode: settings.mode }),
  };
  persistThemeSettings({ extensionAPI, settings: nextSettings });
  return nextSettings;
};

export const updatePaletteOverride = ({
  overrides,
  role,
  value,
}: {
  overrides: ThemePaletteOverrides;
  role: keyof ThemePaletteOverrides;
  value: string | null;
}): ThemePaletteOverrides => {
  const nextOverrides = { ...overrides };
  if (value) {
    nextOverrides[role] = value;
  } else {
    delete nextOverrides[role];
  }
  return nextOverrides;
};
