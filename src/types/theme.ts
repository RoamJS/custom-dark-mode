export const THEME_MODE_VALUES = ["dark", "auto", "off"] as const;

export type ThemeMode = (typeof THEME_MODE_VALUES)[number];

export type ThemeColorScheme = "dark" | "light";

export const THEME_PRESET_VALUES = ["default", "initial-legacy"] as const;

export type ThemePresetId = (typeof THEME_PRESET_VALUES)[number];

export const THEME_COLOR_ROLES = [
  "appBackground",
  "mainSurface",
  "sidebarSurface",
  "elevatedSurface",
  "inputSurface",
  "popoverSurface",
  "primaryText",
  "secondaryText",
  "mutedText",
  "accent",
  "accentHover",
  "pageReference",
  "blockReference",
  "blockReferenceUnderline",
  "border",
  "hoverSurface",
  "selectedSurface",
  "highlight",
  "codeSurface",
  "embedSurface",
  "bullet",
] as const;

export type ThemeColorRole = (typeof THEME_COLOR_ROLES)[number];

export type ThemePalette = Record<ThemeColorRole, string>;

export type ThemePaletteOverrides = Partial<Record<ThemeColorRole, string>>;

export type ThemePreset = {
  id: ThemePresetId;
  name: string;
  palette: ThemePalette;
};

export type ThemeSettings = {
  mode: ThemeMode;
  preset: ThemePresetId;
  overrides: ThemePaletteOverrides;
};

export type ThemeColorRoleDefinition = {
  id: ThemeColorRole;
  label: string;
  group: string;
  description: string;
};
