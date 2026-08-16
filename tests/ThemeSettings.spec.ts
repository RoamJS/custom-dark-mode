import { expect, test } from "@playwright/test";
import {
  areAllColorGroupsExpanded,
  getColorGroupExpansionState,
  getColorSwatchStyle,
  SETTINGS_THEME_CLASSES,
} from "../src/components/ThemeSettings";

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
    boxShadow:
      "inset 0 0 0 2px #38bdf8, inset 0 0 0 3px rgba(15, 23, 42, 0.72)",
  });
});

test("uses filled color group headers in both schemes", () => {
  expect(SETTINGS_THEME_CLASSES.dark.groupHeader).toContain("!bg-slate-800");
  expect(SETTINGS_THEME_CLASSES.light.groupHeader).toContain("!bg-slate-100");
  expect(SETTINGS_THEME_CLASSES.light.groupHeader).toContain("!shadow-none");
  expect(SETTINGS_THEME_CLASSES.light.groupHeader).not.toContain(
    "border-slate-200",
  );
});
