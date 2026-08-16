import { expect, test } from "@playwright/test";
import {
  DARK_DRAWER_STYLE,
  DRAWER_BODY_STYLE,
  DRAWER_HEADER_STYLE,
  getDrawerMountContainer,
  getDrawerStyle,
  LIGHT_DRAWER_STYLE,
} from "../src/components/ThemeSettingsDrawer";

test("mounts inside the settings overlay when it is open", () => {
  const body = {} as HTMLElement;
  const settingsOverlay = {} as HTMLElement;
  const ownerDocument = {
    body,
    querySelector: (selector: string) => {
      expect(selector).toBe(".rm-modal-portal--settings .bp3-overlay");
      return settingsOverlay;
    },
  } as unknown as Document;

  expect(getDrawerMountContainer({ ownerDocument })).toBe(settingsOverlay);
});

test("mounts in the document body when settings is closed", () => {
  const body = {} as HTMLElement;
  const ownerDocument = {
    body,
    querySelector: () => null,
  } as unknown as Document;

  expect(getDrawerMountContainer({ ownerDocument })).toBe(body);
});

test("keeps the settings drawer header pinned above the scrollable body", () => {
  expect(DARK_DRAWER_STYLE).toMatchObject({
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    justifyContent: "flex-start",
    minHeight: 0,
    overflow: "hidden",
    position: "fixed",
    right: 0,
    top: 0,
  });

  expect(DRAWER_HEADER_STYLE).toMatchObject({
    alignItems: "center",
    display: "flex",
    flex: "0 0 auto",
    justifyContent: "space-between",
    margin: 0,
    minHeight: 44,
    padding: "8px 12px",
  });

  expect(DRAWER_BODY_STYLE).toMatchObject({
    flex: "1 1 auto",
    minHeight: 0,
    overflowY: "auto",
  });
});

test("uses light drawer chrome for light color scheme", () => {
  expect(getDrawerStyle({ colorScheme: "light" })).toMatchObject({
    ...LIGHT_DRAWER_STYLE,
    backgroundColor: "#ffffff",
    color: "#0f172a",
  });
});
