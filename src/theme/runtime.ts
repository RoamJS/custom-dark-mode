import type { ThemeSettings } from "~/types/theme";
import { buildThemeCss, THEME_CLASS, THEME_STYLE_ID } from "~/theme/css";
import { resolveThemePalette } from "~/theme/palette";

type ThemeRuntime = {
  update: (settings: ThemeSettings) => void;
  unload: () => void;
};

const prefersDark = (mediaQuery: MediaQueryList | null): boolean =>
  mediaQuery?.matches ?? true;

const shouldApplyTheme = ({
  mediaQuery,
  mode,
}: {
  mediaQuery: MediaQueryList | null;
  mode: ThemeSettings["mode"];
}): boolean => {
  if (mode === "off") return false;
  if (mode === "auto") return prefersDark(mediaQuery);
  return true;
};

const getStyleElement = (): HTMLStyleElement => {
  const existing = document.getElementById(THEME_STYLE_ID);
  if (existing instanceof HTMLStyleElement) return existing;

  const style = document.createElement("style");
  style.id = THEME_STYLE_ID;
  style.dataset.roamjs = "custom-dark-theme";
  document.head.appendChild(style);
  return style;
};

export const createThemeRuntime = ({
  initialSettings,
}: {
  initialSettings: ThemeSettings;
}): ThemeRuntime => {
  let settings = initialSettings;
  let addedBlueprintDarkClass = false;
  const mediaQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

  const addBlueprintDarkClass = (): void => {
    if (!document.body.classList.contains("bp3-dark")) {
      document.body.classList.add("bp3-dark");
      addedBlueprintDarkClass = true;
    }
  };

  const removeBlueprintDarkClass = (): void => {
    if (addedBlueprintDarkClass) {
      document.body.classList.remove("bp3-dark");
      addedBlueprintDarkClass = false;
    }
  };

  const removeTheme = (): void => {
    document.documentElement.classList.remove(THEME_CLASS);
    document.body.classList.remove(THEME_CLASS);
    document.getElementById(THEME_STYLE_ID)?.remove();
    removeBlueprintDarkClass();
  };

  const applyTheme = (): void => {
    if (!shouldApplyTheme({ mediaQuery, mode: settings.mode })) {
      removeTheme();
      return;
    }

    const palette = resolveThemePalette({
      preset: settings.preset,
      overrides: settings.overrides,
    });
    const style = getStyleElement();
    style.textContent = buildThemeCss(palette);
    document.documentElement.classList.add(THEME_CLASS);
    document.body.classList.add(THEME_CLASS);
    addBlueprintDarkClass();
  };

  const handleMediaChange = (): void => {
    applyTheme();
  };

  if (mediaQuery) {
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }
  }

  applyTheme();

  return {
    update: (nextSettings) => {
      settings = nextSettings;
      applyTheme();
    },
    unload: () => {
      if (mediaQuery) {
        if (typeof mediaQuery.removeEventListener === "function") {
          mediaQuery.removeEventListener("change", handleMediaChange);
        } else {
          mediaQuery.removeListener(handleMediaChange);
        }
      }
      removeTheme();
    },
  };
};
