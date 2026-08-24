import { expect, test } from "@playwright/test";
import {
  areAllColorGroupsExpanded,
  COLOR_TOOLBAR_STYLE,
  getColorGroupHeaderStyle,
  getColorGroupExpansionState,
  getQuickSwatchesForRole,
  getColorSwatchStyle,
  QUICK_SWATCH_TOKENS_BY_ROLE,
  SETTINGS_THEME_CLASSES,
} from "../src/components/ThemeSettings";
import {
  COLOR_ROLE_DEFINITIONS,
  getDefaultColorValue,
} from "../src/theme/palette";

const groupedRoles = [
  ["Surfaces", []],
  ["Text", []],
] as Parameters<typeof getColorGroupExpansionState>[0]["groupedRoles"];

test("treats color groups as collapsed by default", () => {
  expect(
    areAllColorGroupsExpanded({
      expandedGroups: {},
      groupedRoles,
    }),
  ).toBe(false);
});

test("builds a matching expansion state for every color group", () => {
  expect(
    getColorGroupExpansionState({
      expanded: true,
      groupedRoles,
    }),
  ).toEqual({
    Surfaces: true,
    Text: true,
  });

  expect(
    getColorGroupExpansionState({
      expanded: false,
      groupedRoles,
    }),
  ).toEqual({
    Surfaces: false,
    Text: false,
  });
});

test("uses scheme-specific swatch outlines without changing swatch colors", () => {
  expect(
    getColorSwatchStyle({
      colorScheme: "light",
      hex: "#020617",
      selected: false,
    }),
  ).toMatchObject({
    backgroundColor: "#020617",
    boxShadow:
      "0 0 0 1px rgba(15, 23, 42, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.64)",
  });

  expect(
    getColorSwatchStyle({
      colorScheme: "dark",
      hex: "#020617",
      selected: false,
    }),
  ).toMatchObject({
    backgroundColor: "#020617",
    boxShadow:
      "0 0 0 1px rgba(248, 250, 252, 0.36), inset 0 0 0 1px rgba(2, 6, 23, 0.72)",
  });

  expect(
    getColorSwatchStyle({
      colorScheme: "dark",
      hex: "#020617",
      selected: true,
    }),
  ).toMatchObject({
    backgroundColor: "#020617",
    boxShadow: "inset 0 0 0 2px #ffffff, inset 0 0 0 4px #0f172a",
  });
});

test("offers quick swatches suited to each color role", () => {
  expect(QUICK_SWATCH_TOKENS_BY_ROLE.appBackground).toContain("slate-950");
  expect(QUICK_SWATCH_TOKENS_BY_ROLE.codeSurface).toContain("slate-950");
  expect(QUICK_SWATCH_TOKENS_BY_ROLE.primaryText).toEqual(
    expect.arrayContaining(["slate-50", "slate-100", "slate-300"]),
  );
  expect(QUICK_SWATCH_TOKENS_BY_ROLE.primaryText).not.toContain("slate-950");
  expect(QUICK_SWATCH_TOKENS_BY_ROLE.accent).toEqual(
    expect.arrayContaining(["sky-400", "blue-400", "cyan-300", "violet-300"]),
  );
  expect(QUICK_SWATCH_TOKENS_BY_ROLE.blockReferenceUnderline).toEqual(
    expect.arrayContaining(["slate-700", "slate-500", "gray-700"]),
  );
  expect(QUICK_SWATCH_TOKENS_BY_ROLE.bullet).toEqual(
    expect.arrayContaining(["slate-300", "slate-400", "sky-400"]),
  );
  expect(QUICK_SWATCH_TOKENS_BY_ROLE.highlight).toContain("amber-300");
});

test("resolves eight valid quick swatches for every color role", () => {
  COLOR_ROLE_DEFINITIONS.forEach(({ id }) => {
    const quickSwatches = getQuickSwatchesForRole(id);

    expect(quickSwatches).toHaveLength(8);
  });
});

test("keeps every original theme default available as a quick swatch", () => {
  COLOR_ROLE_DEFINITIONS.forEach(({ id }) => {
    const quickSwatches = getQuickSwatchesForRole(id);

    expect(quickSwatches.map(({ token }) => token)).toContain(
      getDefaultColorValue({ preset: "initial-legacy", role: id }),
    );
  });
});

test("uses filled color group headers in both schemes", () => {
  expect(SETTINGS_THEME_CLASSES.dark.groupHeader).toContain("!bg-slate-800");
  expect(SETTINGS_THEME_CLASSES.light.groupHeader).toContain("!bg-slate-100");
  expect(SETTINGS_THEME_CLASSES.light.groupHeader).toContain("!shadow-none");
  expect(SETTINGS_THEME_CLASSES.light.groupHeader).not.toContain(
    "border-slate-200",
  );

  expect(
    getColorGroupHeaderStyle({
      colorScheme: "dark",
      settings: { mode: "dark", overrides: {}, preset: "default" },
    }),
  ).toMatchObject({
    backgroundColor: "#161b22",
    borderColor: "#30363d",
  });
  expect(
    getColorGroupHeaderStyle({
      colorScheme: "light",
      settings: { mode: "off", overrides: {}, preset: "default" },
    }),
  ).toMatchObject({
    backgroundColor: "#f1f5f9",
    borderColor: "transparent",
  });
});

test("keeps Reset all and Expand all in one stable toolbar row", () => {
  expect(COLOR_TOOLBAR_STYLE).toMatchObject({
    display: "flex",
    flexWrap: "nowrap",
    gap: 8,
    justifyContent: "flex-end",
  });
});
