import type {
  ThemeColorRole,
  ThemeColorRoleDefinition,
  ThemePalette,
  ThemePaletteOverrides,
  ThemePreset,
  ThemePresetId,
} from "~/types/theme";
import { THEME_COLOR_ROLES } from "~/types/theme";
import { resolveTailwindColor } from "~/theme/tailwindColors";

export const COLOR_ROLE_DEFINITIONS: ThemeColorRoleDefinition[] = [
  {
    id: "appBackground",
    label: "App background",
    group: "Surfaces",
    description: "Outer app chrome and deep page background.",
  },
  {
    id: "mainSurface",
    label: "Main surface",
    group: "Surfaces",
    description: "Daily notes, pages, and primary writing area.",
  },
  {
    id: "sidebarSurface",
    label: "Sidebar surface",
    group: "Surfaces",
    description: "Left sidebar and graph navigation.",
  },
  {
    id: "elevatedSurface",
    label: "Elevated surface",
    group: "Surfaces",
    description: "Topbar, cards, active rows, and raised controls.",
  },
  {
    id: "inputSurface",
    label: "Input surface",
    group: "Surfaces",
    description: "Inputs, textareas, and editable block fields.",
  },
  {
    id: "popoverSurface",
    label: "Popover surface",
    group: "Surfaces",
    description: "Menus, dialogs, autocomplete, and settings panels.",
  },
  {
    id: "primaryText",
    label: "Primary text",
    group: "Text",
    description: "Normal block text and primary labels.",
  },
  {
    id: "secondaryText",
    label: "Secondary text",
    group: "Text",
    description: "Section labels, page metadata, and secondary copy.",
  },
  {
    id: "mutedText",
    label: "Muted text",
    group: "Text",
    description: "Placeholders, icons, breadcrumbs, and quiet labels.",
  },
  {
    id: "accent",
    label: "Accent",
    group: "Links",
    description: "Primary actions, focus rings, and active controls.",
  },
  {
    id: "accentHover",
    label: "Accent hover",
    group: "Links",
    description: "Hover states for links and active controls.",
  },
  {
    id: "pageReference",
    label: "Page refs",
    group: "Links",
    description: "Page links and page reference tokens.",
  },
  {
    id: "blockReference",
    label: "Block refs",
    group: "Links",
    description: "Block references and inline reference links.",
  },
  {
    id: "border",
    label: "Borders",
    group: "States",
    description: "Dividers, outlines, table lines, and control borders.",
  },
  {
    id: "hoverSurface",
    label: "Hover surface",
    group: "States",
    description: "Hovered sidebar rows, menu items, and buttons.",
  },
  {
    id: "selectedSurface",
    label: "Selected surface",
    group: "States",
    description: "Selected rows, active menu items, and block selection.",
  },
  {
    id: "highlight",
    label: "Highlight",
    group: "States",
    description: "Roam highlights and search emphasis.",
  },
  {
    id: "codeSurface",
    label: "Code surface",
    group: "Content",
    description: "Inline code, code blocks, and preformatted content.",
  },
  {
    id: "embedSurface",
    label: "Embed surface",
    group: "Content",
    description: "Embeds, inline references, and reference panels.",
  },
  {
    id: "bullet",
    label: "Bullets",
    group: "Content",
    description: "Block bullets and collapsed bullet indicators.",
  },
];

export const DEFAULT_THEME_PRESET: ThemePreset = {
  id: "default",
  name: "Default",
  palette: {
    appBackground: "slate-950",
    mainSurface: "slate-900",
    sidebarSurface: "slate-800",
    elevatedSurface: "slate-800",
    inputSurface: "slate-800",
    popoverSurface: "gray-900",
    primaryText: "slate-100",
    secondaryText: "slate-300",
    mutedText: "slate-400",
    accent: "sky-400",
    accentHover: "sky-300",
    pageReference: "sky-300",
    blockReference: "cyan-300",
    border: "slate-700",
    hoverSurface: "slate-700",
    selectedSurface: "blue-900",
    highlight: "amber-300",
    codeSurface: "slate-950",
    embedSurface: "slate-800",
    bullet: "slate-400",
  },
};

export const THEME_PRESETS: Record<ThemePresetId, ThemePreset> = {
  default: DEFAULT_THEME_PRESET,
};

const THREE_DIGIT_HEX = /^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i;
const SIX_DIGIT_HEX = /^#?([a-f0-9]{6})$/i;

export const normalizeHexColor = (value: string): string | null => {
  const trimmed = value.trim();
  const threeDigitMatch = trimmed.match(THREE_DIGIT_HEX);
  if (threeDigitMatch) {
    const [, red, green, blue] = threeDigitMatch;
    return `#${red}${red}${green}${green}${blue}${blue}`.toLowerCase();
  }

  const sixDigitMatch = trimmed.match(SIX_DIGIT_HEX);
  return sixDigitMatch ? `#${sixDigitMatch[1].toLowerCase()}` : null;
};

export const resolveColorValue = (value: string): string | null =>
  normalizeHexColor(value) || resolveTailwindColor(value);

export const getPreset = (preset: ThemePresetId): ThemePreset =>
  THEME_PRESETS[preset] || DEFAULT_THEME_PRESET;

export const getDefaultColorValue = ({
  preset = "default",
  role,
}: {
  preset?: ThemePresetId;
  role: ThemeColorRole;
}): string => getPreset(preset).palette[role];

export const getDefaultColorHex = ({
  preset = "default",
  role,
}: {
  preset?: ThemePresetId;
  role: ThemeColorRole;
}): string =>
  resolveColorValue(getDefaultColorValue({ preset, role })) || "#000000";

export const resolveThemePalette = ({
  preset = "default",
  overrides = {},
}: {
  preset?: ThemePresetId;
  overrides?: ThemePaletteOverrides;
}): ThemePalette =>
  THEME_COLOR_ROLES.reduce<ThemePalette>((palette, role) => {
    const defaultValue = getDefaultColorValue({ preset, role });
    const overrideValue = overrides[role];
    palette[role] =
      (overrideValue && resolveColorValue(overrideValue)) ||
      resolveColorValue(defaultValue) ||
      "#000000";
    return palette;
  }, {} as ThemePalette);

export const isColorRole = (value: string): value is ThemeColorRole =>
  THEME_COLOR_ROLES.includes(value as ThemeColorRole);

export const normalizePaletteOverrides = (
  value: unknown,
): ThemePaletteOverrides => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(
    value as Record<string, unknown>,
  ).reduce<ThemePaletteOverrides>((overrides, [role, colorValue]) => {
    if (
      isColorRole(role) &&
      typeof colorValue === "string" &&
      resolveColorValue(colorValue)
    ) {
      overrides[role] = colorValue.trim().toLowerCase();
    }
    return overrides;
  }, {});
};
