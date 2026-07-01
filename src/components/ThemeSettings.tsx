import { Collapse } from "@blueprintjs/core";
import React, { useMemo, useState } from "react";
import type {
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
import {
  isTailwindColorToken,
  TAILWIND_COLOR_GROUPS,
  TAILWIND_COLOR_SWATCHES,
} from "~/theme/tailwindColors";
import { persistThemeSettings, updatePaletteOverride } from "~/utils/settings";

type ThemeSettingsComponentDependencies = {
  extensionAPI: RoamExtensionAPI;
  getInitialSettings?: () => ThemeSettings;
  initialSettings: ThemeSettings;
  onSettingsChange: (settings: ThemeSettings) => void;
};

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

const QUICK_SWATCHES = QUICK_SWATCH_TOKENS.map((token) =>
  TAILWIND_COLOR_SWATCHES.find((swatch) => swatch.token === token),
).filter(Boolean) as typeof TAILWIND_COLOR_SWATCHES;

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
    const [settings, setSettings] =
      useState<ThemeSettings>(getStartingSettings);
    const [draftColors, setDraftColors] = useState<
      Record<ThemeColorRole, string>
    >(() => getDraftColorValues(getStartingSettings()));
    const [invalidRoles, setInvalidRoles] = useState<
      Partial<Record<ThemeColorRole, boolean>>
    >({});
    const [customColorRole, setCustomColorRole] =
      useState<ThemeColorRole | null>(null);

    const groupedRoles = useMemo(() => Object.entries(colorRolesByGroup), []);
    const hasPaletteOverrides = Object.keys(settings.overrides).length > 0;

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
      const defaultHex = getDefaultColorHex({ preset: settings.preset, role });
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

    const renderColorRole = ({
      description,
      id,
      label,
    }: (typeof COLOR_ROLE_DEFINITIONS)[number]): React.ReactElement => {
      const storedValue = getStoredColorValue({ role: id, settings });
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
              <div className="font-medium text-slate-100">{label}</div>
              <div className="text-xs text-slate-400">{description}</div>
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

          <div className="flex items-center gap-1">
            <div className="flex min-w-0 flex-1 flex-wrap gap-1">
              {QUICK_SWATCHES.map((swatch) => {
                const selected =
                  resolveColorValue(storedValue)?.toLowerCase() ===
                  swatch.hex.toLowerCase();
                return (
                  <button
                    aria-label={`Use ${swatch.label}`}
                    className={`h-6 w-6 rounded border ${
                      selected
                        ? "border-sky-300 ring-2 ring-sky-400"
                        : "border-slate-600"
                    } ${swatch.className}`}
                    key={swatch.token}
                    onClick={() => {
                      setCustomColorRole(null);
                      setColorValue({ role: id, value: swatch.token });
                    }}
                    style={{ backgroundColor: swatch.hex }}
                    title={swatch.label}
                    type="button"
                  />
                );
              })}
            </div>
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
            <div className="mt-2 grid gap-2 rounded bg-slate-950 p-3">
              <div className="flex items-center gap-2">
                <input
                  aria-label={`${label} color`}
                  className="h-8 w-10 cursor-pointer rounded border border-slate-600 bg-slate-800 p-0"
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
              <select
                aria-label={`${label} Tailwind palette`}
                className="bp3-input"
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
              {invalidRoles[id] ? (
                <div className="text-xs text-amber-300">
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
      <div className="flex max-w-3xl flex-col gap-4 text-sm text-slate-100">
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

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium text-slate-100">Colors</div>
            <div className="text-xs text-slate-400">
              Tailwind tokens and hex colors are stored per user.
            </div>
          </div>
          {hasPaletteOverrides ? (
            <button className="bp3-button bp3-small" onClick={resetAllColors}>
              Reset All
            </button>
          ) : null}
        </div>

        {groupedRoles.map(([group, roles]) => (
          <section className="flex flex-col gap-2" key={group}>
            <h4 className="m-0 text-sm font-semibold text-slate-200">
              {group}
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {roles.map(renderColorRole)}
            </div>
          </section>
        ))}
      </div>
    );
  };

  return ThemeSettingsPanel;
};
