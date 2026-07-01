import type {
  ThemeMode,
  ThemePaletteOverrides,
  ThemePresetId,
  ThemeSettings,
} from "~/types/theme";
import { THEME_MODE_VALUES, THEME_PRESET_VALUES } from "~/types/theme";
import { normalizePaletteOverrides } from "~/theme/palette";

export const THEME_MODE_SETTING_KEY = "theme-mode";
export const THEME_PRESET_SETTING_KEY = "theme-preset";
export const THEME_PALETTE_OVERRIDES_SETTING_KEY = "theme-palette-overrides";

const isThemeMode = (value: unknown): value is ThemeMode =>
  typeof value === "string" && THEME_MODE_VALUES.includes(value as ThemeMode);

const isThemePreset = (value: unknown): value is ThemePresetId =>
  typeof value === "string" &&
  THEME_PRESET_VALUES.includes(value as ThemePresetId);

export const readThemeSettings = ({
  extensionAPI,
}: {
  extensionAPI: RoamExtensionAPI;
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
  extensionAPI: RoamExtensionAPI;
  settings: ThemeSettings;
}): void => {
  void extensionAPI.settings.set(THEME_MODE_SETTING_KEY, settings.mode);
  void extensionAPI.settings.set(THEME_PRESET_SETTING_KEY, settings.preset);
  void extensionAPI.settings.set(
    THEME_PALETTE_OVERRIDES_SETTING_KEY,
    settings.overrides,
  );
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
