import type { ThemeColorScheme, ThemeMode } from "~/types/theme";

export const getThemeColorScheme = ({
  mode,
  prefersDark = true,
}: {
  mode: ThemeMode;
  prefersDark?: boolean;
}): ThemeColorScheme => {
  if (mode === "off") return "light";
  if (mode === "auto" && !prefersDark) return "light";
  return "dark";
};
