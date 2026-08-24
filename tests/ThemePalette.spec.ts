import { expect, test } from "@playwright/test";
import {
  getDefaultColorValue,
  getPreset,
  resolveThemePalette,
} from "../src/theme/palette";
import { getThemeColorScheme } from "../src/theme/colorScheme";
import { getContrastRatio } from "../src/theme/contrast";

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
  });
});

test("preserves the original palette as a legacy preset", () => {
  expect(getPreset("initial-legacy").name).toBe("Original theme (Legacy)");
  expect(resolveThemePalette({ preset: "initial-legacy" })).toMatchObject({
    appBackground: "#020617",
    mainSurface: "#0f172a",
    primaryText: "#f1f5f9",
  });
});

test("offers a Tailwind-only GitHub Primer palette", () => {
  expect(getPreset("github-primer-tailwind").name).toBe(
    "GitHub Primer Tailwind",
  );
  expect(getPreset("github-primer-tailwind").palette).toMatchObject({
    appBackground: "gray-950",
    mainSurface: "gray-900",
    primaryText: "slate-100",
    pageReference: "blue-500",
    selectedSurface: "blue-600",
  });

  expect(
    resolveThemePalette({ preset: "github-primer-tailwind" }),
  ).toMatchObject({
    appBackground: "#030712",
    mainSurface: "#111827",
    primaryText: "#f1f5f9",
    pageReference: "#3b82f6",
    selectedSurface: "#2563eb",
  });
});

test("keeps the GitHub Primer Tailwind palette at WCAG AA contrast", () => {
  const palette = resolveThemePalette({ preset: "github-primer-tailwind" });
  const textPairs = [
    [palette.primaryText, palette.mainSurface],
    [palette.primaryText, palette.elevatedSurface],
    [palette.primaryText, palette.hoverSurface],
    [palette.primaryText, palette.selectedSurface],
    [palette.secondaryText, palette.mainSurface],
    [palette.secondaryText, palette.sidebarSurface],
    [palette.mutedText, palette.mainSurface],
    [palette.mutedText, palette.popoverSurface],
    [palette.pageReference, palette.mainSurface],
    [palette.accentHover, palette.mainSurface],
    [palette.blockReference, palette.mainSurface],
    [palette.appBackground, palette.accent],
  ];
  const nonTextPairs = [
    [palette.border, palette.mainSurface],
    [palette.border, palette.elevatedSurface],
    [palette.selectedSurface, palette.mainSurface],
    [palette.bullet, palette.mainSurface],
  ];

  textPairs.forEach(([foreground, background]) => {
    expect(getContrastRatio({ foreground, background })).toBeGreaterThanOrEqual(
      4.5,
    );
  });
  nonTextPairs.forEach(([foreground, background]) => {
    expect(getContrastRatio({ foreground, background })).toBeGreaterThanOrEqual(
      3,
    );
  });
});
