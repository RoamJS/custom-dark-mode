import { Button, Collapse } from "@blueprintjs/core";
import type { CSSProperties } from "react";
import React, { useMemo, useState } from "react";
import type { RoamExtensionApi } from "~/types/roam";
import type {
  ThemeColorScheme,
  ThemeColorRole,
  ThemeMode,
  ThemePaletteOverrides,
  ThemeSettings,
} from "~/types/theme";
import { THEME_MODE_VALUES } from "~/types/theme";
import {
  COLOR_ROLE_DEFINITIONS,
  DEFAULT_THEME_PRESET,
  getDefaultColorHex,
  getDefaultColorValue,
  normalizeHexColor,
  resolveColorValue,
} from "~/theme/palette";
import { getThemeColorScheme } from "~/theme/colorScheme";
import {
  isTailwindColorToken,
  TAILWIND_COLOR_GROUPS,
  TAILWIND_COLOR_SWATCHES,
} from "~/theme/tailwindColors";
import { persistThemeSettings, updatePaletteOverride } from "~/utils/settings";

type ThemeSettingsComponentDependencies = {
  extensionAPI: RoamExtensionApi;
  getInitialSettings?: () => ThemeSettings;
  initialSettings: ThemeSettings;
  onSettingsChange: (settings: ThemeSettings) => void;
};

type ColorRoleGroup = [string, typeof COLOR_ROLE_DEFINITIONS];

export type ColorGroupExpansionState = Record<string, boolean>;

type SettingsThemeClasses = {
  colorInput: string;
  customPanel: string;
  groupHeader: string;
  invalidText: string;
  mutedText: string;
  primaryText: string;
  rootText: string;
  selectedSwatchBorder: string;
  selectedSwatchShadow: string;
  swatchBorder: string;
  swatchShadow: string;
};

export const areAllColorGroupsExpanded = ({
  expandedGroups,
  groupedRoles,
}: {
  expandedGroups: ColorGroupExpansionState;
  groupedRoles: ColorRoleGroup[];
}): boolean =>
  groupedRoles.length > 0 &&
  groupedRoles.every(([group]) => expandedGroups[group]);

export const getColorGroupExpansionState = ({
  expanded,
  groupedRoles,
}: {
  expanded: boolean;
  groupedRoles: ColorRoleGroup[];
}): ColorGroupExpansionState =>
  groupedRoles.reduce<ColorGroupExpansionState>((groups, [group]) => {
    groups[group] = expanded;
    return groups;
  }, {});

const QUICK_SWATCH_TOKENS = [
  "slate-950",
  "slate-900",
  "slate-800",
  "gray-900",
  "zinc-900",
  "neutral-900",
  "blue-950",
  "violet-950",
];

export const SETTINGS_THEME_CLASSES: Record<
  ThemeColorScheme,
  SettingsThemeClasses
> = {
  dark: {
    colorInput:
      "h-8 w-10 cursor-pointer rounded border border-slate-600 bg-slate-800 p-0",
    customPanel: "mt-2 grid gap-2 rounded bg-slate-950 p-3",
    groupHeader: "border border-slate-700 !bg-slate-800 hover:!bg-slate-700",
    invalidText: "text-xs text-amber-300",
    mutedText: "text-xs text-slate-400",
    primaryText: "text-slate-100",
    rootText: "text-slate-100",
    selectedSwatchBorder: "border-sky-300",
    selectedSwatchShadow:
      "inset 0 0 0 2px #38bdf8, inset 0 0 0 3px rgba(15, 23, 42, 0.72)",
    swatchBorder: "border-slate-500",
    swatchShadow:
      "0 0 0 1px rgba(248, 250, 252, 0.36), inset 0 0 0 1px rgba(2, 6, 23, 0.72)",
  },
  light: {
    colorInput:
      "h-8 w-10 cursor-pointer rounded border border-slate-300 bg-white p-0",
    customPanel: "mt-2 grid gap-2 rounded bg-slate-100 p-3",
    groupHeader: "!border-0 !bg-slate-100 !shadow-none hover:!bg-slate-200",
    invalidText: "text-xs text-amber-700",
    mutedText: "text-xs text-slate-600",
    primaryText: "text-slate-900",
    rootText: "text-slate-900",
    selectedSwatchBorder: "border-sky-600",
    selectedSwatchShadow:
      "inset 0 0 0 2px #2563eb, inset 0 0 0 3px rgba(255, 255, 255, 0.72)",
    swatchBorder: "border-slate-500",
    swatchShadow:
      "0 0 0 1px rgba(15, 23, 42, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.64)",
  },
};

export const getColorSwatchStyle = ({
  colorScheme,
  hex,
  selected,
}: {
  colorScheme: ThemeColorScheme;
  hex: string;
  selected: boolean;
}): CSSProperties => {
  const themeClasses = SETTINGS_THEME_CLASSES[colorScheme];

  return {
    backgroundColor: hex,
    boxShadow: selected
      ? themeClasses.selectedSwatchShadow
      : themeClasses.swatchShadow,
  };
};

const QUICK_SWATCHES = QUICK_SWATCH_TOKENS.map((token) =>
  TAILWIND_COLOR_SWATCHES.find((swatch) => swatch.token === token),
).filter(Boolean) as typeof TAILWIND_COLOR_SWATCHES;

const getBrowserPrefersDark = (): boolean =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : true;

const getColorSchemeForSettings = (settings: ThemeSettings): ThemeColorScheme =>
  getThemeColorScheme({
    mode: settings.mode,
    prefersDark: getBrowserPrefersDark(),
  });

const getStoredColorValue = ({
  role,
  settings,
}: {
  role: ThemeColorRole;
  settings: ThemeSettings;
}): string =>
  settings.overrides[role] ||
  getDefaultColorValue({ preset: settings.preset, role });

const getDraftColorValues = (
  settings: ThemeSettings,
): Record<ThemeColorRole, string> =>
  COLOR_ROLE_DEFINITIONS.reduce<Record<ThemeColorRole, string>>(
    (drafts, { id }) => {
      drafts[id] = getStoredColorValue({ role: id, settings });
      return drafts;
    },
    {} as Record<ThemeColorRole, string>,
  );

const colorRolesByGroup = COLOR_ROLE_DEFINITIONS.reduce<
  Record<string, typeof COLOR_ROLE_DEFINITIONS>
>((groups, role) => {
  groups[role.group] = groups[role.group] || [];
  groups[role.group].push(role);
  return groups;
}, {});

const modeLabels: Record<ThemeMode, string> = {
  dark: "Dark",
  auto: "Auto",
  off: "Off",
};

const COMPLETE_HEX_COLOR = /^#?[a-f0-9]{6}$/i;

const isPartialColorInput = (value: string): boolean => {
  const trimmedValue = value.trim().toLowerCase();
  return (
    !trimmedValue ||
    /^#?[a-f0-9]{0,6}$/i.test(trimmedValue) ||
    TAILWIND_COLOR_SWATCHES.some((swatch) =>
      swatch.token.startsWith(trimmedValue),
    )
  );
};

export const createThemeSettingsComponent = ({
  extensionAPI,
  getInitialSettings,
  initialSettings,
  onSettingsChange,
}: ThemeSettingsComponentDependencies): React.FC => {
  const ThemeSettingsPanel = (): React.ReactElement => {
    const getStartingSettings = (): ThemeSettings =>
      getInitialSettings?.() || initialSettings;
    const getStartingDraftColors = (): Record<ThemeColorRole, string> => {
      return getDraftColorValues(getStartingSettings());
    };
    const [settings, setSettings] =
      useState<ThemeSettings>(getStartingSettings);
    const [draftColors, setDraftColors] = useState<
      Record<ThemeColorRole, string>
    >(getStartingDraftColors);
    const [invalidRoles, setInvalidRoles] = useState<
      Partial<Record<ThemeColorRole, boolean>>
    >({});
    const [customColorRole, setCustomColorRole] =
      useState<ThemeColorRole | null>(null);
    const [expandedGroups, setExpandedGroups] =
      useState<ColorGroupExpansionState>({});

    const groupedRoles = useMemo(() => Object.entries(colorRolesByGroup), []);
    const colorScheme = getColorSchemeForSettings(settings);
    const themeClasses = SETTINGS_THEME_CLASSES[colorScheme];
    const hasPaletteOverrides = Object.keys(settings.overrides).length > 0;
    const areAllGroupsExpanded = areAllColorGroupsExpanded({
      expandedGroups,
      groupedRoles,
    });

    const commitSettings = (nextSettings: ThemeSettings): void => {
      setSettings(nextSettings);
      persistThemeSettings({ extensionAPI, settings: nextSettings });
      onSettingsChange(nextSettings);
    };

    const setMode = (mode: ThemeMode): void => {
      commitSettings({ ...settings, mode });
    };

    const setDraftColor = ({
      role,
      value,
    }: {
      role: ThemeColorRole;
      value: string;
    }): void => {
      setDraftColors((drafts) => ({
        ...drafts,
        [role]: value,
      }));
    };

    const setRoleInvalid = ({
      invalid,
      role,
    }: {
      invalid: boolean;
      role: ThemeColorRole;
    }): void => {
      setInvalidRoles((roles) => ({
        ...roles,
        [role]: invalid,
      }));
    };

    const setColorValue = ({
      role,
      value,
    }: {
      role: ThemeColorRole;
      value: string | null;
    }): void => {
      const defaultValue = getDefaultColorValue({
        preset: settings.preset,
        role,
      });
      const defaultHex = getDefaultColorHex({
        preset: settings.preset,
        role,
      });
      const normalizedValue = value
        ? normalizeHexColor(value) || value.trim().toLowerCase()
        : null;
      const resolvedValue = normalizedValue
        ? resolveColorValue(normalizedValue)
        : null;
      const shouldUseDefault =
        !normalizedValue ||
        (resolvedValue &&
          resolvedValue.toLowerCase() === defaultHex.toLowerCase());
      const nextOverrides = updatePaletteOverride({
        overrides: settings.overrides,
        role,
        value: shouldUseDefault ? null : normalizedValue,
      });
      const nextSettings = {
        ...settings,
        overrides: nextOverrides,
      };

      setRoleInvalid({ role, invalid: false });
      setDraftColor({
        role,
        value: shouldUseDefault
          ? defaultValue
          : normalizedValue || defaultValue,
      });
      commitSettings(nextSettings);
    };

    const updateCustomColorInput = ({
      role,
      value,
    }: {
      role: ThemeColorRole;
      value: string;
    }): void => {
      const trimmedValue = value.trim().toLowerCase();
      setDraftColor({ role, value });

      if (
        isTailwindColorToken(trimmedValue) ||
        COMPLETE_HEX_COLOR.test(trimmedValue)
      ) {
        setColorValue({ role, value: trimmedValue });
        return;
      }

      setRoleInvalid({
        role,
        invalid: !isPartialColorInput(trimmedValue),
      });
    };

    const resetAllColors = (): void => {
      const nextSettings = {
        ...settings,
        overrides: {} as ThemePaletteOverrides,
      };
      setInvalidRoles({});
      setDraftColors(getDraftColorValues(nextSettings));
      commitSettings(nextSettings);
    };

    const setAllGroupsExpanded = (expanded: boolean): void => {
      setExpandedGroups(
        getColorGroupExpansionState({
          expanded,
          groupedRoles,
        }),
      );

      if (!expanded) {
        setCustomColorRole(null);
      }
    };

    const toggleGroup = ({
      group,
      roles,
    }: {
      group: string;
      roles: typeof COLOR_ROLE_DEFINITIONS;
    }): void => {
      const isExpanded = !!expandedGroups[group];

      setExpandedGroups((groups) => ({
        ...groups,
        [group]: !isExpanded,
      }));

      if (isExpanded && roles.some(({ id }) => id === customColorRole)) {
        setCustomColorRole(null);
      }
    };

    const renderColorRole = ({
      description,
      id,
      label,
    }: (typeof COLOR_ROLE_DEFINITIONS)[number]): React.ReactElement => {
      const storedValue = getStoredColorValue({
        role: id,
        settings,
      });
      const storedHex =
        resolveColorValue(storedValue) ||
        getDefaultColorHex({ preset: settings.preset, role: id });
      const draftValue = draftColors[id];
      const selectedTailwindToken = isTailwindColorToken(draftValue)
        ? draftValue.trim().toLowerCase()
        : "";
      const isDefaultValue = !settings.overrides[id];
      const isCustomDropdownOpen = customColorRole === id;
      const draftHex = resolveColorValue(draftValue) || storedHex;

      return (
        <div className="grid gap-2 py-3" key={id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-[160px] flex-1">
              <div className={`font-medium ${themeClasses.primaryText}`}>
                {label}
              </div>
            </div>
            <div className="flex w-[64px] justify-end">
              <button
                aria-hidden={isDefaultValue}
                className={`bp3-button bp3-small bp3-minimal ${
                  isDefaultValue ? "pointer-events-none invisible" : ""
                }`}
                disabled={isDefaultValue}
                onClick={() => setColorValue({ role: id, value: null })}
                tabIndex={isDefaultValue ? -1 : 0}
                type="button"
              >
                Reset
              </button>
            </div>
          </div>
          <div className={themeClasses.mutedText}>{description}</div>

          <div className="flex items-center gap-1">
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
              {QUICK_SWATCHES.map((swatch) => {
                const selected =
                  resolveColorValue(storedValue)?.toLowerCase() ===
                  swatch.hex.toLowerCase();
                return (
                  <button
                    aria-label={`Use ${swatch.label}`}
                    className={`h-6 w-6 shrink-0 overflow-hidden rounded border ${
                      selected
                        ? themeClasses.selectedSwatchBorder
                        : themeClasses.swatchBorder
                    } ${swatch.className}`}
                    key={swatch.token}
                    onClick={() => {
                      setColorValue({ role: id, value: swatch.token });
                    }}
                    style={getColorSwatchStyle({
                      colorScheme,
                      hex: swatch.hex,
                      selected,
                    })}
                    title={swatch.label}
                    type="button"
                  />
                );
              })}
            </div>
            <select
              aria-label={`${label} Tailwind palette`}
              className="bp3-input bp3-small h-6 w-[116px] shrink-0 py-0 text-xs"
              onChange={(event) =>
                setColorValue({ role: id, value: event.target.value })
              }
              value={selectedTailwindToken}
            >
              <option value="">Custom hex</option>
              {TAILWIND_COLOR_GROUPS.map((group) => (
                <optgroup key={group.name} label={group.name}>
                  {group.swatches.map((swatch) => (
                    <option key={swatch.token} value={swatch.token}>
                      {swatch.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button
              aria-expanded={isCustomDropdownOpen}
              className="bp3-button bp3-small bp3-minimal shrink-0"
              onClick={() =>
                setCustomColorRole(isCustomDropdownOpen ? null : id)
              }
              type="button"
            >
              Custom
            </button>
          </div>

          <Collapse isOpen={isCustomDropdownOpen} keepChildrenMounted>
            <div className={themeClasses.customPanel}>
              <div className="flex items-center gap-2">
                <input
                  aria-label={`${label} color`}
                  className={themeClasses.colorInput}
                  onChange={(event) =>
                    setColorValue({ role: id, value: event.target.value })
                  }
                  type="color"
                  value={draftHex}
                />
                <input
                  aria-label={`${label} Tailwind token or hex`}
                  className="bp3-input min-w-0 flex-1 font-mono text-sm"
                  onChange={(event) =>
                    updateCustomColorInput({
                      role: id,
                      value: event.target.value,
                    })
                  }
                  placeholder="slate-900 or #0f172a"
                  spellCheck={false}
                  value={draftValue}
                />
              </div>
              {invalidRoles[id] ? (
                <div className={themeClasses.invalidText}>
                  Use a Tailwind color token like slate-900 or a hex color like
                  #0f172a.
                </div>
              ) : null}
            </div>
          </Collapse>
        </div>
      );
    };

    return (
      <div
        className={`flex max-w-3xl flex-col gap-4 text-sm ${themeClasses.rootText}`}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-medium">Mode</span>
            <select
              className="bp3-input"
              onChange={(event) => setMode(event.target.value as ThemeMode)}
              value={settings.mode}
            >
              {THEME_MODE_VALUES.map((mode) => (
                <option key={mode} value={mode}>
                  {modeLabels[mode]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Theme</span>
            <select className="bp3-input" disabled value={settings.preset}>
              <option value={DEFAULT_THEME_PRESET.id}>
                {DEFAULT_THEME_PRESET.name}
              </option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-[80px_auto] justify-end gap-2">
          <Button
            className={hasPaletteOverrides ? "" : "invisible"}
            disabled={!hasPaletteOverrides}
            onClick={resetAllColors}
            small
            tabIndex={hasPaletteOverrides ? 0 : -1}
            text="Reset all"
          />
          <Button
            icon={areAllGroupsExpanded ? "chevron-up" : "chevron-down"}
            onClick={() => setAllGroupsExpanded(!areAllGroupsExpanded)}
            small
            text={areAllGroupsExpanded ? "Collapse all" : "Expand all"}
          />
        </div>

        {groupedRoles.map(([group, roles]) => {
          const isExpanded = !!expandedGroups[group];

          return (
            <section className="flex flex-col gap-2" key={group}>
              <Button
                alignText="left"
                aria-expanded={isExpanded}
                className={themeClasses.groupHeader}
                fill
                icon={isExpanded ? "chevron-down" : "chevron-right"}
                large
                minimal
                onClick={() => toggleGroup({ group, roles })}
                text={
                  <span
                    className={`text-base font-semibold ${themeClasses.primaryText}`}
                  >
                    {group}
                  </span>
                }
              />
              <Collapse isOpen={isExpanded}>
                <div className="grid grid-cols-1 gap-3">
                  {roles.map(renderColorRole)}
                </div>
              </Collapse>
            </section>
          );
        })}
      </div>
    );
  };

  return ThemeSettingsPanel;
};
