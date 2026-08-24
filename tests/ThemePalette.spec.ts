import { expect, test } from "@playwright/test";
import {
  getDefaultColorValue,
  getPreset,
  resolveThemePalette,
} from "../src/theme/palette";
import { getThemeColorScheme } from "../src/theme/colorScheme";

test("resolves off mode to the light color scheme", () => {
  expect(getThemeColorScheme({ mode: "off" })).toBe("light");
  expect(getThemeColorScheme({ mode: "dark" })).toBe("dark");
  expect(getThemeColorScheme({ mode: "auto", prefersDark: false })).toBe(
    "light",
  );
});

test("uses GitHub Primer as the default palette", () => {
  expect(getPreset("default").name).toBe("GitHub Primer");
  expect(
    getDefaultColorValue({
      role: "appBackground",
    }),
  ).toBe("#010409");
  expect(
    getDefaultColorValue({
      role: "primaryText",
    }),
  ).toBe("#e6edf3");

  expect(resolveThemePalette()).toMatchObject({
    appBackground: "#010409",
    mainSurface: "#0d1117",
    primaryText: "#e6edf3",
    pageReference: "#2f81f7",
    blockReference: "#e6edf3",
    blockReferenceUnderline: "#30363d",
  });
});

test("preserves the original palette as a legacy preset", () => {
  expect(getPreset("initial-legacy").name).toBe("Original theme (Legacy)");
  expect(resolveThemePalette({ preset: "initial-legacy" })).toMatchObject({
    appBackground: "#020617",
    mainSurface: "#0f172a",
    primaryText: "#f1f5f9",
    blockReferenceUnderline: "#334155",
  });
});
