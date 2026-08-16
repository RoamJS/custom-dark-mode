import { expect, test } from "@playwright/test";
import {
  getDefaultColorValue,
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

test("keeps the default custom palette dark", () => {
  expect(
    getDefaultColorValue({
      role: "appBackground",
    }),
  ).toBe("slate-950");
  expect(
    getDefaultColorValue({
      role: "primaryText",
    }),
  ).toBe("slate-100");

  expect(resolveThemePalette()).toMatchObject({
    appBackground: "#020617",
    mainSurface: "#0f172a",
    primaryText: "#f1f5f9",
  });
});
