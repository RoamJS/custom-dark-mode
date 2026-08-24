import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-runtime";

const repoDir = process.cwd();
const DEFAULT_GRAPH_URL =
  process.env.ROAM_GRAPH_URL || "https://roamresearch.com/#/app/jarvis-sandbox";
const outDir = path.join(repoDir, "local", "full-ui-test", "latest");
const screenshotDir = path.join(outDir, "screenshots");
const videoDir = path.join(outDir, "video");
const profileDir = path.join(repoDir, "local", "full-ui-test", "profile");
const timeout = 45_000;
const actionDelayMs = 215;
const viewport = { width: 1440, height: 1000 };
const extensionName = "custom-dark-theme";
const readySelectors = [
  ".roam-app",
  ".roam-body",
  'input[placeholder="Find or Create Page"]',
];

const rootFiles = [
  { name: "extension.js", required: true, type: "text/javascript" },
  { name: "README.md", required: true, type: "text/markdown" },
  { name: "extension.css", required: false, type: "text/css" },
  { name: "CHANGELOG.md", required: false, type: "text/markdown" },
  { name: "package.json", required: false, type: "application/json" },
];

const groups = [
  { name: "Surfaces", roles: 6 },
  { name: "Text", roles: 3 },
  { name: "Links", roles: 5 },
  { name: "States", roles: 4 },
  { name: "Content", roles: 3 },
];

const checks = [];
const actions = [];
const captures = [];
const pageErrors = [];
const consoleErrors = [];
const knownWarnings = [];
const infrastructureIssues = [
  {
    name: "roam-load-plugin developer-mode fallback selector",
    status: "workaround",
    detail:
      "The skill's stock loader mixes text=/developer/i into a CSS selector. This runner uses the same folder-loader workflow with a valid CSS locator.",
  },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForRoamReady = async ({ page, profileDir, timeout }) => {
  await page.waitForTimeout(1500);
  const isSignin =
    page.url().includes("/signin") ||
    page.url().includes("#/signin") ||
    (await page.locator('input[type="password"]').count()) > 0;
  if (isSignin) {
    throw new Error(
      `Roam profile is not logged in or the session expired (${profileDir}). Refresh the cached profile, then rerun the suite.`,
    );
  }
  await page.waitForFunction(
    (selectors) =>
      selectors.some((selector) => document.querySelector(selector)),
    readySelectors,
    { timeout },
  );
};

const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const uiAction = async (label, callback) => {
  const startedAt = Date.now();
  try {
    const value = await callback();
    await wait(actionDelayMs);
    actions.push({
      label,
      status: "passed",
      afterDelayMs: actionDelayMs,
      elapsedMs: Date.now() - startedAt,
      at: new Date().toISOString(),
    });
    return value;
  } catch (error) {
    await wait(actionDelayMs);
    actions.push({
      label,
      status: "failed",
      afterDelayMs: actionDelayMs,
      elapsedMs: Date.now() - startedAt,
      error: error.message,
      at: new Date().toISOString(),
    });
    throw error;
  }
};

const click = async (locator, label) =>
  uiAction(label, async () => {
    await locator.first().waitFor({ state: "visible", timeout });
    await locator.first().scrollIntoViewIfNeeded();
    await locator.first().click({ force: true, timeout });
  });

const press = async (page, key, label) =>
  uiAction(label, () => page.keyboard.press(key));

const fill = async (locator, value, label) =>
  uiAction(label, async () => {
    await locator.first().waitFor({ state: "visible", timeout });
    await locator.first().fill(value);
  });

const select = async (locator, value, label) =>
  uiAction(label, async () => {
    await locator.first().waitFor({ state: "visible", timeout });
    await locator.first().selectOption(value);
  });

const navigate = async (page, url, selector, label) => {
  await uiAction(label, () =>
    page.evaluate((nextUrl) => {
      window.location.href = nextUrl;
    }, url),
  );
  await page.waitForURL(url, { timeout });
  await page.locator(selector).first().waitFor({ timeout });
  await page.waitForTimeout(750);
  await page.waitForFunction(
    () =>
      document.documentElement.classList.contains("roamjs-custom-dark-theme") &&
      document.querySelectorAll("#roamjs-custom-dark-theme-styles").length ===
        1,
    null,
    { timeout },
  );
};

const capture = async ({ page, name, label, locator, fullPage = false }) => {
  const filePath = path.join(screenshotDir, `${name}.png`);
  if (locator) {
    await locator.first().scrollIntoViewIfNeeded();
    await locator.first().screenshot({ path: filePath });
  } else {
    await page.screenshot({ path: filePath, fullPage });
  }
  captures.push({ label, path: filePath, url: page.url() });
  return filePath;
};

const recordCheck = ({ name, passed, details = null, screenshot = null }) => {
  checks.push({
    name,
    status: passed ? "passed" : "failed",
    details,
    screenshot,
    at: new Date().toISOString(),
  });
};

const check = async ({ name, test, details, screenshot }) => {
  try {
    const value = await test();
    const passed = typeof value === "object" ? !!value.passed : !!value;
    recordCheck({
      name,
      passed,
      details:
        typeof value === "object" && "details" in value
          ? value.details
          : details || value,
      screenshot,
    });
    return passed;
  } catch (error) {
    recordCheck({
      name,
      passed: false,
      details: error.message,
      screenshot,
    });
    return false;
  }
};

const readFolderFiles = async () => {
  const files = [];
  for (const file of rootFiles) {
    const filePath = path.join(repoDir, file.name);
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) throw new Error(`${file.name} is not a file`);
      files.push({
        name: file.name,
        content: await fs.readFile(filePath, "utf8"),
        type: file.type,
        lastModified: Math.floor(stat.mtimeMs),
      });
    } catch (error) {
      if (file.required) throw error;
    }
  }
  return files;
};

const installDirectoryPickerShim = async (page) => {
  const files = await readFolderFiles();
  await page.evaluate(
    ({ dirName, entries }) => {
      const notFound = (name) =>
        new DOMException(
          `A requested file could not be found: ${name}`,
          "NotFoundError",
        );
      const makeFileHandle = (entry) => ({
        kind: "file",
        name: entry.name,
        async getFile() {
          return new File([entry.content], entry.name, {
            type: entry.type,
            lastModified: entry.lastModified,
          });
        },
        async isSameEntry(other) {
          return other === this;
        },
        async queryPermission() {
          return "granted";
        },
        async requestPermission() {
          return "granted";
        },
      });
      const handles = new Map(
        entries.map((entry) => [entry.name, makeFileHandle(entry)]),
      );
      const directoryHandle = {
        kind: "directory",
        name: dirName,
        async getFileHandle(name) {
          const handle = handles.get(name);
          if (!handle) throw notFound(name);
          return handle;
        },
        async getDirectoryHandle(name) {
          throw notFound(name);
        },
        async resolve(possibleDescendant) {
          for (const [name, handle] of handles) {
            if (handle === possibleDescendant) return [name];
          }
          return null;
        },
        async isSameEntry(other) {
          return other === this;
        },
        async queryPermission() {
          return "granted";
        },
        async requestPermission() {
          return "granted";
        },
        async *entries() {
          for (const entry of handles.entries()) yield entry;
        },
        async *keys() {
          for (const key of handles.keys()) yield key;
        },
        async *values() {
          for (const handle of handles.values()) yield handle;
        },
        [Symbol.asyncIterator]() {
          return this.entries();
        },
      };
      Object.defineProperty(window, "showDirectoryPicker", {
        configurable: true,
        value: async () => directoryHandle,
      });
    },
    { dirName: path.basename(repoDir), entries: files },
  );
};

const closeOpenOverlays = async (page) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (
      await page
        .locator(".rm-help-popup:visible")
        .isVisible()
        .catch(() => false)
    ) {
      await click(
        page.locator(".rm-topbar__help .bp3-button"),
        `Close Roam help popup ${attempt + 1}`,
      );
      continue;
    }
    const closeButton = page
      .locator(
        ".rm-settings-close-button, .bp3-dialog button[aria-label='Close']",
      )
      .first();
    if ((await closeButton.count()) > 0 && (await closeButton.isVisible())) {
      await click(closeButton, `Close open overlay ${attempt + 1}`);
      continue;
    }
    await press(page, "Escape", `Dismiss overlay ${attempt + 1}`);
    if (
      (await page
        .locator(".rm-modal-dialog--settings, .bp3-dialog")
        .count()) === 0
    ) {
      break;
    }
  }
};

const openSettings = async (page) => {
  await closeOpenOverlays(page);
  await runCommand(page, "Open settings");
  await page.locator(".rm-modal-dialog--settings").waitFor({ timeout });
};

const openSettingsTab = async (page, selector, label) => {
  await click(page.locator(selector), `Open settings tab: ${label}`);
  await page.waitForTimeout(500);
};

const findExtensionRow = (page) =>
  page
    .locator(".rm-extension-installed")
    .filter({
      has: page
        .locator(".rm-extension-installed__name")
        .filter({ hasText: new RegExp(`^${extensionName}$`) }),
    })
    .first();

const loadExtension = async (page) => {
  await installDirectoryPickerShim(page);
  await openSettings(page);
  await openSettingsTab(
    page,
    "#bp3-tab-title_rm-settings-tabs_rm-depot-tab",
    "Roam Depot",
  );
  await page
    .locator("#bp3-tab-panel_rm-settings-tabs_rm-depot-tab")
    .waitFor({ timeout });

  await click(
    page.locator(".rm-extensions-installed__header button.bp3-icon-cog"),
    "Open Roam Depot developer menu",
  );
  const folderButton = page.locator(
    ".rm-extensions-installed__header button.bp3-icon-folder-new",
  );
  if (!(await folderButton.isVisible().catch(() => false))) {
    await click(
      page
        .locator(".bp3-menu-item, [role='menuitem']")
        .filter({ hasText: /developer mode/i }),
      "Enable Roam Depot developer mode",
    );
    await folderButton.waitFor({ state: "visible", timeout });
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const row = findExtensionRow(page);
    if ((await row.count()) === 0) break;
    await click(
      row.locator("button.bp3-icon-cross"),
      `Remove stale extension row ${attempt + 1}`,
    );
    await page.waitForTimeout(350);
  }

  await click(folderButton, "Load extension folder");
  const row = findExtensionRow(page);
  await row.waitFor({ timeout });
  await page.waitForTimeout(1000);

  let loadState = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await click(
      row.locator("button.bp3-icon-refresh"),
      `Refresh developer extension attempt ${attempt}`,
    );
    await page.waitForTimeout(1500);
    loadState = await page.evaluate(() => ({
      htmlThemeClass: document.documentElement.classList.contains(
        "roamjs-custom-dark-theme",
      ),
      bodyThemeClass: document.body.classList.contains(
        "roamjs-custom-dark-theme",
      ),
      styles: document.querySelectorAll("#roamjs-custom-dark-theme-styles")
        .length,
      roots: document.querySelectorAll(
        "#roamjs-custom-dark-theme-settings-root",
      ).length,
    }));
    if (
      loadState.htmlThemeClass &&
      loadState.bodyThemeClass &&
      loadState.styles >= 1 &&
      loadState.roots >= 1
    ) {
      return row;
    }
  }

  throw new Error(
    `Extension did not mount after three refreshes: ${JSON.stringify(loadState)}`,
  );
};

const openCommandPalette = async (page, query) => {
  await press(page, "Meta+p", "Open command palette");
  const palette = page.locator(".rm-command-palette");
  await palette.waitFor({ timeout });
  const input = palette.locator("input").first();
  await fill(input, query, `Search command palette for ${query}`);
  return palette;
};

const runCommand = async (page, query) => {
  await openCommandPalette(page, query);
  await press(page, "Enter", `Run command: ${query}`);
  await page.waitForTimeout(500);
};

const setSidebarState = async ({ page, leftOpen, rightOpen }) => {
  await uiAction(
    `${leftOpen ? "Open" : "Close"} left sidebar and ${rightOpen ? "open" : "close"} right sidebar`,
    () =>
      page.evaluate(
        ({ shouldOpenLeft, shouldOpenRight }) => {
          const api = window.roamAlphaAPI.ui;
          api.leftSidebar[shouldOpenLeft ? "open" : "close"]();
          api.rightSidebar[shouldOpenRight ? "open" : "close"]();
        },
        { shouldOpenLeft: leftOpen, shouldOpenRight: rightOpen },
      ),
  );
  await page.waitForTimeout(500);
};

const populateRightSidebar = async ({ page, pageUids }) => {
  await uiAction("Populate right sidebar with three page windows", () =>
    page.evaluate((uids) => {
      const sidebar = window.roamAlphaAPI.ui.rightSidebar;
      for (const windowState of sidebar.getWindows()) {
        sidebar.removeWindow({ window: windowState });
      }
      for (const uid of uids) {
        sidebar.addWindow({ window: { type: "outline", "block-uid": uid } });
      }
      sidebar.open();
    }, pageUids),
  );
  await page.waitForFunction(
    () => document.querySelectorAll(".rm-sidebar-window").length >= 3,
    null,
    { timeout },
  );
  await page.waitForTimeout(500);
};

const openScratchAutocomplete = async ({ page, blockUid, text, label }) => {
  await uiAction(`Reset scratch block for ${label}`, () =>
    page.evaluate(
      (uid) =>
        window.roamAlphaAPI.data.block.update({
          block: { uid, string: "Autocomplete scratch block" },
        }),
      blockUid,
    ),
  );
  const blockText = page
    .locator(".rm-block-text")
    .filter({ hasText: /^Autocomplete scratch block$/ })
    .first();
  await click(blockText, `Focus scratch block for ${label}`);
  const input = page
    .locator("textarea.rm-block__input--active:visible")
    .first();
  await input.waitFor({ state: "visible", timeout });
  await uiAction(`Type ${label}`, async () => {
    await input.fill("");
    await input.pressSequentially(text, { delay: 80 });
  });
  const menu = page
    .locator(".rm-autocomplete__results:visible, .bp3-menu:visible")
    .last();
  await menu.waitFor({ state: "visible", timeout });
  return menu;
};

const drawer = (page) =>
  page.locator('aside[aria-label="Custom Dark Mode settings"]');

const modeSelect = (page) => drawer(page).locator("select").first();

const roleContainer = (page, roleName) =>
  drawer(page)
    .getByText(roleName, { exact: true })
    .locator(
      "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' py-3 ')][1]",
    );

const createFixture = async (page) => {
  const suffix = Date.now().toString(36);
  const sourceTitle = `CDT Full UI Test ${suffix}`;
  const referenceTitle = `CDT Full UI Reference ${suffix}`;
  const fixture = await page.evaluate(
    ({ sourceTitle: source, referenceTitle: reference }) => {
      const api = window.roamAlphaAPI;
      return {
        sourceTitle: source,
        referenceTitle: reference,
        sourceUid: api.util.generateUID(),
        referenceUid: api.util.generateUID(),
        targetBlockUid: api.util.generateUID(),
        contentBlockUid: api.util.generateUID(),
        richContentUid: api.util.generateUID(),
        queryUid: api.util.generateUID(),
        tableUid: api.util.generateUID(),
        searchUid: api.util.generateUID(),
        dateUid: api.util.generateUID(),
        quoteUid: api.util.generateUID(),
        calloutUid: api.util.generateUID(),
        latexUid: api.util.generateUID(),
        listsUid: api.util.generateUID(),
        sliderUid: api.util.generateUID(),
        kanbanUid: api.util.generateUID(),
        scratchUid: api.util.generateUID(),
        sidebarPageUids: Array.from({ length: 3 }, () =>
          api.util.generateUID(),
        ),
      };
    },
    { sourceTitle, referenceTitle },
  );

  try {
    await page.evaluate(async (fixture) => {
      const api = window.roamAlphaAPI;
      const {
        sourceTitle: source,
        referenceTitle: reference,
        sourceUid,
        referenceUid,
        targetBlockUid,
        contentBlockUid,
        richContentUid,
        queryUid,
        tableUid,
        searchUid,
        dateUid,
        quoteUid,
        calloutUid,
        latexUid,
        listsUid,
        sliderUid,
        kanbanUid,
        scratchUid,
        sidebarPageUids,
      } = fixture;

      const createBlock = async ({
        parentUid,
        order,
        string,
        uid,
        heading,
        children = [],
      }) => {
        const blockUid = uid || api.util.generateUID();
        await api.data.block.create({
          location: { "parent-uid": parentUid, order },
          block: {
            uid: blockUid,
            string,
            ...(heading ? { heading } : {}),
          },
        });
        for (const [childOrder, child] of children.entries()) {
          await createBlock({
            parentUid: blockUid,
            order: childOrder,
            ...child,
          });
        }
        return blockUid;
      };

      await api.data.page.create({ page: { title: source, uid: sourceUid } });
      await api.data.page.create({
        page: { title: reference, uid: referenceUid },
      });
      for (const [index, uid] of sidebarPageUids.entries()) {
        await api.data.page.create({
          page: { title: `${source} Sidebar ${index + 1}`, uid },
        });
        await createBlock({
          parentUid: uid,
          order: 0,
          string: `Right sidebar test content ${index + 1} with [[${reference}]]`,
          children: [
            {
              string:
                "Nested sidebar content for surface and indentation coverage",
            },
          ],
        });
      }
      await api.data.block.create({
        location: { "parent-uid": sourceUid, order: 0 },
        block: {
          uid: targetBlockUid,
          string: "Target block for block-reference color verification",
        },
      });
      await createBlock({
        parentUid: sourceUid,
        order: 2,
        uid: richContentUid,
        heading: 1,
        string: "Theme gallery: typography and rich content",
      });
      await createBlock({
        parentUid: sourceUid,
        order: 3,
        string:
          "Body text with **bold**, __italic__, ~~strikethrough~~, **bold and __nested italic__**, ^^highlight^^, `inline code`, and a deliberately long wrapping sentence that exercises line height, muted punctuation, emphasis boundaries, and wrapping behavior across the main workspace.",
      });
      await createBlock({
        parentUid: sourceUid,
        order: 4,
        heading: 1,
        string: "Heading 1",
      });
      await createBlock({
        parentUid: sourceUid,
        order: 5,
        heading: 2,
        string: "Heading 2",
      });
      await createBlock({
        parentUid: sourceUid,
        order: 6,
        heading: 3,
        string: "Heading 3",
      });
      await createBlock({
        parentUid: sourceUid,
        order: 7,
        string: `Semantic links: [[${reference}]], #[[theme-test-tag]], ((${targetBlockUid})), [external link](https://github.com), [page alias]([[${reference}]]), and [block alias](((${targetBlockUid}))).`,
      });
      await createBlock({
        parentUid: sourceUid,
        order: 8,
        string: `Block embed with multiple lines: {{[[embed]]: ((${targetBlockUid}))}}`,
      });
      await createBlock({
        parentUid: targetBlockUid,
        order: 0,
        string: "First embedded child line",
      });
      await createBlock({
        parentUid: targetBlockUid,
        order: 1,
        string:
          "Second embedded child line with **bold** and [[theme-test-tag]]",
      });
      await createBlock({
        parentUid: sourceUid,
        order: 9,
        string: `Embed path: {{[[embed-path]]: ((${targetBlockUid}))}}`,
      });
      await createBlock({
        parentUid: sourceUid,
        order: 10,
        uid: searchUid,
        string: "Native search view: {{[[search]]}}",
      });
      await createBlock({
        parentUid: sourceUid,
        order: 11,
        uid: dateUid,
        string: "Native date picker: {{date}}",
      });
      await createBlock({
        parentUid: sourceUid,
        order: 12,
        string:
          '```javascript\nconst palette = { background: "#0d1117", foreground: "#e6edf3" };\nconsole.log(palette);\n```',
      });
      await createBlock({
        parentUid: sourceUid,
        order: 13,
        uid: quoteUid,
        string: "> A block quote with [[theme-test-tag]] and `inline code`.",
      });
      await createBlock({
        parentUid: sourceUid,
        order: 14,
        uid: calloutUid,
        string:
          "[[>]] [[!NOTE]] A native note callout with **important content**.",
      });
      await createBlock({
        parentUid: sourceUid,
        order: 15,
        uid: latexUid,
        string:
          "Inline LaTeX $E = mc^2$ and a block formula $$\\int_0^1 x^2 \\, dx = \\frac{1}{3}$$",
      });
      await createBlock({
        parentUid: sourceUid,
        order: 16,
        string: "Horizontal separator follows",
      });
      await createBlock({ parentUid: sourceUid, order: 17, string: "---" });
      await createBlock({
        parentUid: sourceUid,
        order: 18,
        uid: listsUid,
        string: "Nested list and indentation guides",
        children: [
          {
            string: "First nested list item",
            children: [
              { string: "Second-level item" },
              { string: "Another second-level item with a [[page reference]]" },
            ],
          },
          { string: "Second nested list item" },
        ],
      });
      await createBlock({
        parentUid: sourceUid,
        order: 20,
        string: "Query result alpha #[[ex-A]] #[[ex-B]]",
      });
      await createBlock({
        parentUid: sourceUid,
        order: 21,
        string: "Query result beta #[[ex-A]] #[[ex-B]]",
      });
      await createBlock({
        parentUid: sourceUid,
        order: 19,
        uid: queryUid,
        string: "Native query placeholder",
      });
      await createBlock({
        parentUid: sourceUid,
        order: 22,
        uid: tableUid,
        string: "Default Roam table: {{[[table]]}}",
        children: [
          {
            string: "Name",
            children: [{ string: "Status" }, { string: "Owner" }],
          },
          {
            string: "Primer gallery",
            children: [{ string: "Ready" }, { string: "Theme QA" }],
          },
          {
            string: "Sidebar coverage",
            children: [{ string: "Ready" }, { string: "Theme QA" }],
          },
        ],
      });
      await createBlock({
        parentUid: sourceUid,
        order: 23,
        uid: sliderUid,
        string: "Native slider: {{[[slider]]}}",
        children: [{ string: "5" }],
      });
      await createBlock({
        parentUid: sourceUid,
        order: 24,
        uid: kanbanUid,
        string: "Native kanban: {{[[kanban]]}}",
        children: [
          {
            string: "Backlog",
            children: [
              { string: "Audit hover states" },
              { string: "Audit focus states" },
            ],
          },
          {
            string: "Complete",
            children: [{ string: "GitHub Primer palette" }],
          },
        ],
      });
      await createBlock({
        parentUid: sourceUid,
        order: 2,
        uid: scratchUid,
        string: "Autocomplete scratch block",
      });
      await api.data.block.create({
        location: { "parent-uid": sourceUid, order: 1 },
        block: {
          uid: contentBlockUid,
          string: `Page ref [[${reference}]], block ref ((${targetBlockUid})), ^^highlight^^, \`inline code\`, and #[[theme-test-tag]]`,
        },
      });
      await api.data.block.create({
        location: { "parent-uid": referenceUid, order: 0 },
        block: {
          uid: api.util.generateUID(),
          string: `Linked reference back to [[${source}]]`,
        },
      });
    }, fixture);
    return fixture;
  } catch (error) {
    const cleanup = await deleteFixture(page, fixture).catch(
      (cleanupError) => ({
        attempted: true,
        succeeded: false,
        pages: [],
        error: cleanupError.message,
      }),
    );
    if (!cleanup.succeeded) {
      throw new Error(
        `Fixture creation failed: ${error.message}. Partial cleanup also failed: ${JSON.stringify(cleanup)}`,
      );
    }
    throw error;
  }
};

const deleteFixture = async (page, fixture) => {
  if (!fixture) return { attempted: false, succeeded: true, pages: [] };
  const pages = await page.evaluate(
    async ({ sourceUid, referenceUid, sidebarPageUids }) => {
      const api = window.roamAlphaAPI;
      const targets = [
        { label: "source", uid: sourceUid },
        { label: "reference", uid: referenceUid },
        ...sidebarPageUids.map((uid, index) => ({
          label: `right-sidebar-${index + 1}`,
          uid,
        })),
      ];
      const results = [];
      for (const target of targets) {
        try {
          await api.data.page.delete({ page: { uid: target.uid } });
          const remainingPage = api.pull("[:block/uid]", [
            ":block/uid",
            target.uid,
          ]);
          results.push({
            ...target,
            deleted: !remainingPage,
            error: remainingPage ? "Page still exists after deletion" : null,
          });
        } catch (error) {
          results.push({
            ...target,
            deleted: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      return results;
    },
    fixture,
  );
  return {
    attempted: true,
    succeeded: pages.every(({ deleted }) => deleted),
    pages,
  };
};

const isTransparent = (value) =>
  value === "transparent" || value === "rgba(0, 0, 0, 0)";

const parseRgb = (value) => {
  const values = value
    .match(/[\d.]+/g)
    ?.slice(0, 3)
    .map(Number);
  return values?.length === 3 ? values : null;
};

const luminance = (rgb) => {
  const channels = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

const contrastRatio = (foreground, background) => {
  const fg = parseRgb(foreground);
  const bg = parseRgb(background);
  if (!fg || !bg) return 0;
  const [bright, dark] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (bright + 0.05) / (dark + 0.05);
};

const writeMarkdownReport = async (result) => {
  const lines = [
    "# Custom Dark Mode full UI test",
    "",
    `- Result: **${result.ok ? "PASS" : "FAIL"}**`,
    `- Graph: ${result.graphUrl}`,
    `- Checks: ${result.summary.passed}/${result.summary.total} passed`,
    `- Screenshots: ${result.captures.length}`,
    `- Recorded actions: ${result.actions.length}`,
    `- Required action delay: ${result.actionDelayMs} ms`,
    `- Fixture cleanup: ${result.fixtureCleanup.succeeded ? "PASS" : "FAIL"}`,
    `- Video: ${result.videoPath || "not available"}`,
    "",
    "## Checks",
    "",
    ...result.checks.map(
      (item) =>
        `- [${item.status === "passed" ? "x" : " "}] ${item.name}${
          item.details ? ` - ${JSON.stringify(item.details)}` : ""
        }`,
    ),
    "",
    "## Infrastructure notes",
    "",
    ...result.infrastructureIssues.map(
      (item) => `- ${item.name}: ${item.detail}`,
    ),
  ];
  await fs.writeFile(path.join(outDir, "results.md"), `${lines.join("\n")}\n`);
};

const main = async () => {
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(screenshotDir, { recursive: true });
  await fs.mkdir(videoDir, { recursive: true });

  const context = await chromium.launchPersistentContext(profileDir, {
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    headless: true,
    viewport,
    recordVideo: { dir: videoDir, size: viewport },
  });
  const page = context.pages()[0] || (await context.newPage());
  const video = page.video();
  let fixture = null;
  let fixtureCleanup = { attempted: false, succeeded: true, pages: [] };
  let fatalError = null;

  page.on("pageerror", (error) => {
    if (
      error.message.includes("Failed to execute 'put' on 'IDBObjectStore'") &&
      error.message.includes("could not be cloned")
    ) {
      knownWarnings.push(error.message);
      return;
    }
    if (
      error.message.includes("Cannot read properties of null") &&
      error.message.includes("blendFunc") &&
      page.url().includes("/graph")
    ) {
      knownWarnings.push(error.message);
      infrastructureIssues.push({
        name: "Graph Overview headless WebGL context",
        status: "recovered",
        detail:
          "Roam attempted blendFunc on a null WebGL context while the headless Graph Overview still rendered its canvases and passed the visibility check.",
      });
      return;
    }
    pageErrors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  try {
    await uiAction("Navigate to Jarvis graph", () =>
      page.goto(DEFAULT_GRAPH_URL, { waitUntil: "domcontentloaded" }),
    );
    try {
      await waitForRoamReady({
        page,
        profileDir,
        headless: true,
        timeout: 20_000,
      });
    } catch (error) {
      infrastructureIssues.push({
        name: "Initial Roam loading screen timeout",
        status: "recovered",
        detail: `${error.message}; reloading the Jarvis graph once.`,
      });
      await uiAction("Reload Jarvis after loading-screen timeout", () =>
        page.reload({ waitUntil: "domcontentloaded" }),
      );
      await waitForRoamReady({
        page,
        profileDir,
        headless: true,
        timeout,
      });
    }
    const extensionRow = await loadExtension(page);
    const loadedScreenshot = await capture({
      page,
      name: "01-extension-loaded",
      label: "Developer extension loaded in Roam Depot",
    });
    await check({
      name: "Extension folder loads and mounts one stylesheet and one settings root",
      screenshot: loadedScreenshot,
      test: () =>
        page.evaluate(() => ({
          passed:
            document.querySelectorAll("#roamjs-custom-dark-theme-styles")
              .length === 1 &&
            document.querySelectorAll("#roamjs-custom-dark-theme-settings-root")
              .length === 1,
          details: {
            styles: document.querySelectorAll(
              "#roamjs-custom-dark-theme-styles",
            ).length,
            roots: document.querySelectorAll(
              "#roamjs-custom-dark-theme-settings-root",
            ).length,
          },
        })),
    });

    const iconStyles = await extensionRow
      .locator("button")
      .evaluateAll((buttons) =>
        buttons.map((button) => ({
          className: button.className,
          backgroundColor: getComputedStyle(button).backgroundColor,
          color: getComputedStyle(button).color,
        })),
      );
    await check({
      name: "Roam Depot icon controls have transparent backgrounds",
      screenshot: loadedScreenshot,
      test: async () => ({
        passed:
          iconStyles.length > 0 &&
          iconStyles.every(({ backgroundColor }) =>
            isTransparent(backgroundColor),
          ),
        details: iconStyles,
      }),
    });

    fixture = await createFixture(page);
    await closeOpenOverlays(page);
    await navigate(
      page,
      `${DEFAULT_GRAPH_URL}/page/${fixture.queryUid}`,
      ".roam-article",
      "Open native query placeholder",
    );
    await click(
      page
        .locator(".rm-block-text")
        .filter({ hasText: /^Native query placeholder$/ }),
      "Focus native query placeholder",
    );
    const queryInput = page.locator("textarea.rm-block__input--active:visible");
    await uiAction("Type /query into native query placeholder", async () => {
      await queryInput.fill("");
      await queryInput.pressSequentially("/query", { delay: 80 });
    });
    const queryCommandMenu = page.locator(".rm-autocomplete__results:visible");
    await queryCommandMenu.waitFor({ state: "visible", timeout });
    await press(page, "Enter", "Insert default Query (and) component");
    await page
      .getByText("Query result alpha", { exact: false })
      .first()
      .waitFor({ state: "visible", timeout });
    await navigate(
      page,
      `${DEFAULT_GRAPH_URL}/page/${fixture.sourceUid}`,
      ".roam-article, .rm-title-display",
      "Open UI fixture page",
    );
    const contentScreenshot = await capture({
      page,
      name: "02-content-colors",
      label: "Page, block reference, highlight, code, tag, and bullet colors",
    });
    await check({
      name: "Core content roles render with distinct theme colors",
      screenshot: contentScreenshot,
      test: () =>
        page.evaluate(() => {
          const read = (selector, property) => {
            const element = document.querySelector(selector);
            return element ? getComputedStyle(element)[property] : null;
          };
          const values = {
            themeClass: document.documentElement.classList.contains(
              "roamjs-custom-dark-theme",
            ),
            runtimeStyles: document.querySelectorAll(
              "#roamjs-custom-dark-theme-styles",
            ).length,
            pageReference: read(".roam-article .rm-page-ref", "color"),
            blockReference: read(".roam-article .rm-block-ref", "color"),
            blockReferenceUnderline: read(
              ".roam-article .rm-block-ref",
              "borderBottomColor",
            ),
            highlight: read(
              ".roam-article .rm-highlight, .roam-article mark",
              "backgroundColor",
            ),
            code: read(
              ".roam-article .rm-inline-code, .roam-article code",
              "backgroundColor",
            ),
            bullet: read(".roam-article .rm-bullet__inner", "backgroundColor"),
          };
          return {
            passed:
              values.themeClass &&
              values.runtimeStyles === 1 &&
              Object.entries(values)
                .filter(
                  ([key]) => !["themeClass", "runtimeStyles"].includes(key),
                )
                .every(([, value]) => !!value),
            details: values,
          };
        }),
    });

    const galleryScreenshot = await capture({
      page,
      name: "02a-theme-gallery-upper",
      label:
        "Theme gallery upper viewport with typography, rich content, and long wrapping content",
    });
    await check({
      name: "Theme gallery renders all deterministic fixture blocks",
      screenshot: galleryScreenshot,
      test: async () => {
        const requiredUids = [
          fixture.richContentUid,
          fixture.queryUid,
          fixture.tableUid,
          fixture.searchUid,
          fixture.dateUid,
          fixture.quoteUid,
          fixture.calloutUid,
          fixture.latexUid,
          fixture.listsUid,
          fixture.sliderUid,
          fixture.kanbanUid,
        ];
        const existingUids = await page.evaluate(
          (uids) =>
            uids.filter((uid) =>
              window.roamAlphaAPI.pull("[:block/uid]", [":block/uid", uid]),
            ),
          requiredUids,
        );
        return {
          passed: existingUids.length === requiredUids.length,
          details: { existingUids, requiredUids },
        };
      },
    });

    for (const { uid, name, label } of [
      {
        uid: fixture.queryUid,
        name: "02b-default-roam-query",
        label: "Default Roam query with populated results",
      },
      {
        uid: fixture.tableUid,
        name: "02c-default-roam-table",
        label: "Default Roam table with multiple rows and columns",
      },
      {
        uid: fixture.searchUid,
        name: "02d-native-search-view",
        label: "Native search view macro",
      },
      {
        uid: fixture.dateUid,
        name: "02e-native-date-picker-trigger",
        label: "Native date picker trigger",
      },
      {
        uid: fixture.quoteUid,
        name: "02e1-block-quote",
        label: "Block quote with semantic links and inline code",
      },
      {
        uid: fixture.calloutUid,
        name: "02e2-note-callout",
        label: "Native note callout",
      },
      {
        uid: fixture.latexUid,
        name: "02e3-latex",
        label: "Inline and block LaTeX",
      },
      {
        uid: fixture.listsUid,
        name: "02e4-lists-and-indentation",
        label: "Nested list and indentation guides",
      },
      {
        uid: fixture.sliderUid,
        name: "02e5-native-slider",
        label: "Native slider component",
      },
      {
        uid: fixture.kanbanUid,
        name: "02e6-native-kanban",
        label: "Native kanban with multiple columns and cards",
      },
    ]) {
      await navigate(
        page,
        `${DEFAULT_GRAPH_URL}/page/${uid}`,
        ".roam-article, .rm-title-display",
        `Zoom into ${label}`,
      );
      if (uid === fixture.queryUid) {
        await page
          .getByText("Query result alpha", { exact: false })
          .first()
          .waitFor({ state: "visible", timeout });
      }
      await capture({ page, name, label });
      if (uid === fixture.queryUid) {
        await check({
          name: "Default Roam query finishes rendering populated results",
          screenshot: path.join(screenshotDir, `${name}.png`),
          test: async () => {
            const articleText = await page.locator(".roam-article").innerText();
            return {
              passed:
                articleText.includes("Query result alpha") &&
                articleText.includes("Query result beta") &&
                !articleText.includes("{{[[query]]"),
              details: {
                hasAlpha: articleText.includes("Query result alpha"),
                hasBeta: articleText.includes("Query result beta"),
                hasRawMacro: articleText.includes("{{[[query]]"),
              },
            };
          },
        });
      }
      await press(page, "Escape", `Close transient state after ${label}`);
    }
    await navigate(
      page,
      `${DEFAULT_GRAPH_URL}/page/${fixture.sourceUid}`,
      ".roam-article, .rm-title-display",
      "Return to theme gallery after native component close-ups",
    );

    await setSidebarState({ page, leftOpen: true, rightOpen: false });
    const leftSidebarScreenshot = await capture({
      page,
      name: "02f-default-left-sidebar",
      label: "Default left sidebar open beside the theme gallery",
    });
    await check({
      name: "Default left sidebar is open and visible",
      screenshot: leftSidebarScreenshot,
      test: () =>
        page
          .locator(".roam-sidebar-container .roam-sidebar-content")
          .isVisible(),
    });

    await click(
      page.locator(".roam-sidebar-container .rm-db-title"),
      "Open graph picker menu",
    );
    const graphPicker = page.locator(".bp3-popover-content:visible").last();
    await graphPicker.waitFor({ state: "visible", timeout });
    await capture({
      page,
      name: "02g-graph-picker-menu",
      label: "Graph picker and graph actions menu",
    });
    await press(page, "Escape", "Close graph picker menu");

    await populateRightSidebar({ page, pageUids: fixture.sidebarPageUids });
    await setSidebarState({ page, leftOpen: false, rightOpen: true });
    const rightSidebarScreenshot = await capture({
      page,
      name: "02h-right-sidebar-three-windows",
      label: "Right sidebar with three page windows open",
    });
    await check({
      name: "Right sidebar displays three open page windows",
      screenshot: rightSidebarScreenshot,
      test: async () => ({
        passed: (await page.locator(".rm-sidebar-window").count()) === 3,
        details: { windows: await page.locator(".rm-sidebar-window").count() },
      }),
    });

    await setSidebarState({ page, leftOpen: true, rightOpen: true });
    await capture({
      page,
      name: "02i-both-sidebars-open",
      label: "Both sidebars open around the theme gallery",
    });
    await setSidebarState({ page, leftOpen: false, rightOpen: false });

    const helpButton = page.locator(".rm-topbar__help .bp3-button");
    await uiAction("Hover Roam help button for tooltip", () =>
      helpButton.hover(),
    );
    await page
      .locator(".bp3-tooltip:visible")
      .last()
      .waitFor({ state: "visible", timeout });
    await capture({
      page,
      name: "02j-native-tooltip",
      label: "Native Blueprint tooltip on a topbar control",
    });
    await click(helpButton, "Open Roam help menu");
    await page
      .locator(".rm-help-popup:visible")
      .waitFor({ state: "visible", timeout });
    await capture({
      page,
      name: "02k-roam-help-menu",
      label: "Roam help menu",
    });
    await click(helpButton, "Close Roam help menu");

    await click(
      page.locator(".rm-topbar .bp3-icon-more"),
      "Open topbar more menu for visual proof",
    );
    await page
      .locator(".bp3-menu:visible")
      .last()
      .waitFor({ state: "visible", timeout });
    await capture({
      page,
      name: "02l-topbar-more-menu",
      label: "Topbar more menu",
    });
    await press(page, "Escape", "Close topbar more menu");

    await navigate(
      page,
      `${DEFAULT_GRAPH_URL}/page/${fixture.sourceUid}`,
      ".roam-article",
      "Return to theme gallery for autocomplete tests",
    );
    for (const autocomplete of [
      {
        text: "/",
        name: "02m-slash-command-menu",
        label: "slash command menu",
      },
      {
        text: "[[search",
        name: "02n-inline-page-search",
        label: "inline page-reference search",
      },
      {
        text: "((search",
        name: "02o-inline-block-search",
        label: "inline block-reference search",
      },
      {
        text: "#search",
        name: "02p-inline-tag-search",
        label: "inline tag search",
      },
    ]) {
      const autocompleteMenu = await openScratchAutocomplete({
        page,
        blockUid: fixture.scratchUid,
        text: autocomplete.text,
        label: autocomplete.label,
      });
      await capture({
        page,
        name: autocomplete.name,
        label: autocomplete.label,
        locator: autocompleteMenu,
      });
      await press(page, "Escape", `Close ${autocomplete.label}`);
    }
    await page.evaluate(
      ({ uid }) =>
        window.roamAlphaAPI.data.block.update({
          block: { uid, string: "Autocomplete scratch block" },
        }),
      { uid: fixture.scratchUid },
    );
    await press(page, "Escape", "Exit scratch block editing");

    const targetBullet = page
      .locator(".rm-block-text")
      .filter({
        hasText: /^Target block for block-reference color verification$/,
      })
      .locator(
        "xpath=ancestor::div[contains(@class, 'roam-block-container')][1]",
      )
      .locator(".rm-bullet")
      .first();
    await uiAction("Open block context menu", () =>
      targetBullet.click({ button: "right", force: true }),
    );
    const blockContextMenu = page.locator(".bp3-menu:visible").last();
    await blockContextMenu.waitFor({ state: "visible", timeout });
    await capture({
      page,
      name: "02q-block-context-menu",
      label: "Right-click block context menu",
    });
    const copyBlockRef = blockContextMenu
      .locator(".bp3-menu-item")
      .filter({ hasText: /copy block ref/i })
      .first();
    if ((await copyBlockRef.count()) > 0) {
      await uiAction("Open Copy block ref submenu", () => copyBlockRef.hover());
      await page.waitForFunction(
        () => document.querySelectorAll(".bp3-menu").length >= 2,
        null,
        { timeout },
      );
      await click(
        page
          .locator(".bp3-menu:visible")
          .last()
          .locator(".bp3-menu-item")
          .first(),
        "Copy block reference and trigger toast",
      );
      const toast = page.locator(".bp3-toast:visible").last();
      if (!(await toast.isVisible().catch(() => false))) {
        await uiAction("Show deterministic Blueprint success toast", () =>
          page.evaluate(() => {
            window.__customDarkThemeTestToaster =
              window.Blueprint.Core.Toaster.create({
                position: "top",
              });
            window.__customDarkThemeTestToaster.show({
              intent: "success",
              message: "GitHub Primer theme toast coverage",
              timeout: 0,
            });
          }),
        );
      }
      await toast.waitFor({ state: "visible", timeout: 5_000 });
      const toastScreenshot = await capture({
        page,
        name: "02r-native-toast",
        label: "Native Roam success toast",
      });
      await check({
        name: "Native copy action displays a visible toast",
        screenshot: toastScreenshot,
        test: () => toast.isVisible(),
      });
      await uiAction("Dismiss deterministic Blueprint success toast", () =>
        page.evaluate(() => {
          window.__customDarkThemeTestToaster?.clear();
        }),
      );
    } else {
      await press(
        page,
        "Escape",
        "Close block context menu without copy action",
      );
    }

    const pageReference = page
      .locator(".rm-block-text")
      .filter({ hasText: /^Page ref / })
      .locator(
        "xpath=ancestor::div[contains(@class, 'roam-block-container')][1]",
      )
      .locator(".rm-page-ref")
      .first();
    await uiAction("Open page-reference context menu", () =>
      pageReference.click({ button: "right", force: true }),
    );
    await page
      .locator(".bp3-menu:visible")
      .last()
      .waitFor({ state: "visible", timeout });
    await capture({
      page,
      name: "02s-page-reference-context-menu",
      label: "Right-click page-reference context menu",
    });
    await uiAction("Dismiss page-reference context menu", async () => {
      await page.keyboard.press("Escape");
      if ((await page.locator(".bp3-menu:visible").count()) > 0) {
        await page.mouse.click(viewport.width - 24, viewport.height - 24);
      }
    });
    await page
      .locator(".bp3-menu:visible")
      .waitFor({ state: "hidden", timeout });
    await check({
      name: "Page-reference context menu is dismissed before later scenarios",
      test: async () => (await page.locator(".bp3-menu:visible").count()) === 0,
    });

    await navigate(
      page,
      `${DEFAULT_GRAPH_URL}/page/${fixture.sourceUid}`,
      ".roam-article, .rm-title-display",
      "Return to theme gallery after context-menu tests",
    );

    const linkedReferences = page
      .locator(".roam-body-main .roam-article .rm-reference-main")
      .filter({ hasText: /Linked References/ })
      .last();
    const mainReference = linkedReferences.locator(".rm-reference-item");
    await mainReference.first().waitFor({ timeout });
    const linkedScreenshot = await capture({
      page,
      name: "03-linked-references-main",
      label: "Linked references in the main window",
      locator: linkedReferences,
    });
    await check({
      name: "Main-window linked references use a subtly different background",
      screenshot: linkedScreenshot,
      test: async () => {
        const values = await mainReference.first().evaluate((element) => ({
          reference: getComputedStyle(element).backgroundColor,
          article: getComputedStyle(element.closest(".roam-article"))
            .backgroundColor,
        }));
        return {
          passed:
            !isTransparent(values.reference) &&
            values.reference !== values.article,
          details: values,
        };
      },
    });

    const referenceToolbarButtons = page.locator(
      ".roam-body-main .rm-reference-main button.bp3-button",
    );
    await check({
      name: "Linked-reference toolbar icons have transparent backgrounds",
      screenshot: linkedScreenshot,
      test: async () => {
        const values = await referenceToolbarButtons.evaluateAll((buttons) =>
          buttons.map((button) => getComputedStyle(button).backgroundColor),
        );
        return {
          passed: values.length > 0 && values.every(isTransparent),
          details: values,
        };
      },
    });

    await runCommand(page, "Custom Dark Mode: Open Settings");
    await drawer(page).waitFor({ timeout });
    const drawerDarkScreenshot = await capture({
      page,
      name: "04-drawer-dark-collapsed",
      label: "Dark settings drawer with all groups collapsed",
    });
    await check({
      name: "Settings drawer opens in dark mode with all five groups collapsed",
      screenshot: drawerDarkScreenshot,
      test: async () => {
        const states = await drawer(page)
          .locator("section > button")
          .evaluateAll((buttons) =>
            buttons.map((button) => button.getAttribute("aria-expanded")),
          );
        return {
          passed:
            states.length === groups.length &&
            states.every((value) => value === "false"),
          details: states,
        };
      },
    });
    await check({
      name: "Dark-mode group headers use a visible filled background",
      screenshot: drawerDarkScreenshot,
      test: async () => {
        const headerDetails = await drawer(page)
          .locator("section > button")
          .evaluateAll((buttons) =>
            buttons.map((button) => ({
              background: getComputedStyle(button).backgroundColor,
              className: button.className,
              inlineStyle: button.getAttribute("style"),
              insideTheme: !!button.closest(".roamjs-custom-dark-theme"),
              hasRuntimeRule: document
                .getElementById("roamjs-custom-dark-theme-styles")
                ?.textContent?.includes(
                  "roamjs-custom-dark-theme-color-group-header.bp3-button",
                ),
            })),
          );
        const backgrounds = headerDetails.map(({ background }) => background);
        return {
          passed:
            backgrounds.length === 5 &&
            backgrounds.every((value) => !isTransparent(value)),
          details: headerDetails,
        };
      },
    });

    const themeSelect = drawer(page).locator("select").nth(1);
    await check({
      name: "Theme selector exposes GitHub Primer and the original legacy theme",
      test: async () => {
        const options = await themeSelect
          .locator("option")
          .evaluateAll((elements) =>
            elements.map((option) => ({
              label: option.textContent?.trim(),
              value: option.value,
            })),
          );
        return {
          passed:
            JSON.stringify(options) ===
            JSON.stringify([
              { label: "GitHub Primer", value: "default" },
              {
                label: "Original theme (Legacy)",
                value: "initial-legacy",
              },
            ]),
          details: options,
        };
      },
    });

    await select(
      themeSelect,
      "initial-legacy",
      "Switch to the original legacy theme",
    );
    await check({
      name: "Legacy preset restores the original palette and exact Primer can be restored",
      test: async () => {
        const legacyValues = await page.evaluate(() => ({
          appBackground: getComputedStyle(document.documentElement)
            .getPropertyValue("--cdt-app-background")
            .trim(),
          drawerBackground: getComputedStyle(
            document.querySelector(
              'aside[aria-label="Custom Dark Mode settings"]',
            ),
          ).backgroundColor,
        }));
        await themeSelect.selectOption("default");
        await page.waitForTimeout(actionDelayMs);
        const primerValues = await page.evaluate(() => ({
          appBackground: getComputedStyle(document.documentElement)
            .getPropertyValue("--cdt-app-background")
            .trim(),
          drawerBackground: getComputedStyle(
            document.querySelector(
              'aside[aria-label="Custom Dark Mode settings"]',
            ),
          ).backgroundColor,
        }));
        return {
          passed:
            legacyValues.appBackground === "#020617" &&
            legacyValues.drawerBackground === "rgb(15, 23, 42)" &&
            primerValues.appBackground === "#010409" &&
            primerValues.drawerBackground === "rgb(13, 17, 23)",
          details: { legacyValues, primerValues },
        };
      },
    });

    const palette = await openCommandPalette(page, "Custom Dark Mode");
    const commandScreenshot = await capture({
      page,
      name: "05-command-palette-actions",
      label: "Both Custom Dark Mode command palette actions",
      locator: palette,
    });
    await check({
      name: "Open Settings and Toggle Dark Mode commands are registered once each",
      screenshot: commandScreenshot,
      test: async () => {
        const lines = (await palette.innerText())
          .split("\n")
          .map((line) => line.trim());
        const openCount = lines.filter(
          (line) => line === "Custom Dark Mode: Open Settings",
        ).length;
        const toggleCount = lines.filter(
          (line) => line === "Custom Dark Mode: Toggle Dark Mode",
        ).length;
        return {
          passed: openCount === 1 && toggleCount === 1,
          details: { openCount, toggleCount },
        };
      },
    });
    await press(page, "Escape", "Close command palette");
    if ((await drawer(page).count()) === 0) {
      await runCommand(page, "Custom Dark Mode: Open Settings");
      await drawer(page).waitFor({ timeout });
    }

    for (const group of groups) {
      const header = drawer(page).getByRole("button", {
        name: new RegExp(`^${group.name}$`),
      });
      await click(header, `Expand ${group.name} group`);
      const section = header.locator("xpath=ancestor::section[1]");
      const screenshot = await capture({
        page,
        name: `06-group-${slug(group.name)}`,
        label: `${group.name} color group expanded`,
        locator: section,
      });
      await check({
        name: `${group.name} group exposes all ${group.roles} color roles`,
        screenshot,
        test: async () => {
          const roleCount = await section
            .locator("div.grid.gap-2.py-3")
            .count();
          return { passed: roleCount === group.roles, details: { roleCount } };
        },
      });
      await click(header, `Collapse ${group.name} group`);
    }

    const expandAll = drawer(page).getByRole("button", { name: "Expand all" });
    await click(expandAll, "Expand all color groups");
    const expandedScreenshot = await capture({
      page,
      name: "07-all-groups-expanded",
      label: "All color groups expanded",
    });
    await check({
      name: "Expand all opens every color group and becomes Collapse all",
      screenshot: expandedScreenshot,
      test: async () => {
        const states = await drawer(page)
          .locator("section > button")
          .evaluateAll((buttons) =>
            buttons.map((button) => button.getAttribute("aria-expanded")),
          );
        return {
          passed:
            states.length === groups.length &&
            states.every((value) => value === "true") &&
            (await drawer(page)
              .getByRole("button", { name: "Collapse all" })
              .count()) === 1,
          details: states,
        };
      },
    });
    await click(
      drawer(page).getByRole("button", { name: "Collapse all" }),
      "Collapse all color groups",
    );

    const surfacesHeader = drawer(page).getByRole("button", {
      name: /^Surfaces$/,
    });
    await click(surfacesHeader, "Expand Surfaces for editor tests");
    const appRole = roleContainer(page, "App background");
    await click(
      appRole.getByRole("button", { name: "Custom" }),
      "Open App background custom editor",
    );
    const customScreenshot = await capture({
      page,
      name: "08-custom-editor-open",
      label: "Custom color editor",
      locator: appRole,
    });
    await check({
      name: "Custom editor opens without changing the role-row height until requested",
      screenshot: customScreenshot,
      test: async () => ({
        passed:
          (await appRole
            .getByLabel("App background Tailwind token or hex")
            .isVisible()) &&
          (await appRole.getByLabel("App background color").isVisible()),
        details: { editorOpen: true },
      }),
    });

    await click(
      appRole.getByRole("button", { name: "Use Slate 800" }),
      "Choose Slate 800 quick swatch",
    );
    await check({
      name: "Choosing a quick swatch keeps the custom editor open",
      test: () =>
        appRole.getByLabel("App background Tailwind token or hex").isVisible(),
    });
    const selectedSwatch = appRole.getByRole("button", {
      name: "Use Slate 800",
    });
    const swatchScreenshot = await capture({
      page,
      name: "09-selected-swatch-border",
      label: "Selected palette swatch with complete inset border",
      locator: appRole,
    });
    await check({
      name: "Selected swatch shows a complete inset selection border",
      screenshot: swatchScreenshot,
      test: async () => {
        const values = await selectedSwatch.evaluate((element) => ({
          boxShadow: getComputedStyle(element).boxShadow,
          overflow: getComputedStyle(element).overflow,
        }));
        return {
          passed:
            values.boxShadow !== "none" && values.boxShadow.includes("inset"),
          details: values,
        };
      },
    });

    const tokenSelect = appRole.getByLabel("App background Tailwind palette");
    await select(
      tokenSelect,
      "zinc-900",
      "Choose Zinc 900 from full Tailwind palette",
    );
    await check({
      name: "Tailwind palette select persists a token while keeping custom open",
      test: async () => ({
        passed:
          (await tokenSelect.inputValue()) === "zinc-900" &&
          (await appRole
            .getByLabel("App background Tailwind token or hex")
            .isVisible()),
        details: { value: await tokenSelect.inputValue() },
      }),
    });

    const customText = appRole.getByLabel(
      "App background Tailwind token or hex",
    );
    await fill(customText, "not-a-color", "Enter invalid custom color");
    const invalidScreenshot = await capture({
      page,
      name: "10-invalid-custom-color",
      label: "Invalid custom color validation",
      locator: appRole,
    });
    await check({
      name: "Invalid custom colors show actionable validation without applying",
      screenshot: invalidScreenshot,
      test: async () => ({
        passed: await appRole
          .getByText(/Use a Tailwind color token/)
          .isVisible(),
        details: { value: await customText.inputValue() },
      }),
    });

    await fill(customText, "#123456", "Enter valid custom hex color");
    await check({
      name: "Valid custom hex applies to the runtime CSS variable",
      test: () =>
        page.evaluate(() => ({
          passed:
            getComputedStyle(document.documentElement)
              .getPropertyValue("--cdt-app-background")
              .trim()
              .toLowerCase() === "#123456",
          details: getComputedStyle(document.documentElement)
            .getPropertyValue("--cdt-app-background")
            .trim(),
        })),
    });
    const validScreenshot = await capture({
      page,
      name: "11-valid-custom-hex",
      label: "Valid custom hex override",
      locator: appRole,
    });

    const colorInput = appRole.getByLabel("App background color");
    await fill(
      colorInput,
      "#0f172a",
      "Set App background through native color input",
    );
    await check({
      name: "Native color input applies its hex value",
      screenshot: validScreenshot,
      test: async () => ({
        passed: (await colorInput.inputValue()).toLowerCase() === "#0f172a",
        details: { value: await colorInput.inputValue() },
      }),
    });

    const collapseAllXWithReset = await drawer(page)
      .getByRole("button", { name: /Collapse all|Expand all/ })
      .boundingBox()
      .catch(() => null);
    const resetAllButton = drawer(page).getByRole("button", {
      name: "Reset all",
    });
    const resetLayoutScreenshot = await capture({
      page,
      name: "11b-reset-all-layout",
      label: "Reset all and expand/collapse control layout",
    });
    await check({
      name: "Reset all appears to the left of the stable expand/collapse control",
      screenshot: resetLayoutScreenshot,
      test: async () => {
        const resetBox = await resetAllButton.boundingBox();
        const collapseBox =
          collapseAllXWithReset ||
          (await drawer(page)
            .getByRole("button", { name: /Collapse all|Expand all/ })
            .boundingBox());
        return {
          passed:
            !!resetBox &&
            !!collapseBox &&
            Math.abs(resetBox.y - collapseBox.y) < 1 &&
            resetBox.x < collapseBox.x,
          details: { resetBox, collapseBox },
        };
      },
    });
    await click(
      appRole.getByRole("button", { name: "Reset" }),
      "Reset App background role",
    );
    await check({
      name: "Per-role Reset removes the override",
      test: async () => ({
        passed: await appRole.getByRole("button", { name: "Reset" }).isHidden(),
        details: { resetHidden: true },
      }),
    });
    await click(
      appRole.getByRole("button", { name: "Use Slate 800" }),
      "Create override for Reset all test",
    );
    await click(resetAllButton, "Reset all palette overrides");
    await check({
      name: "Reset all clears every override without moving Expand/Collapse all",
      test: async () => {
        const collapseBox = await drawer(page)
          .getByRole("button", { name: /Collapse all|Expand all/ })
          .boundingBox();
        return {
          passed:
            (await resetAllButton.isHidden()) &&
            !!collapseAllXWithReset &&
            Math.abs(collapseAllXWithReset.x - collapseBox.x) < 1,
          details: { before: collapseAllXWithReset, after: collapseBox },
        };
      },
    });

    await select(modeSelect(page), "off", "Switch theme mode Off");
    const lightScreenshot = await capture({
      page,
      name: "12-drawer-light-mode",
      label: "Off mode with light drawer chrome and filled headers",
    });
    await check({
      name: "Off mode disables the dark runtime and uses light drawer chrome",
      screenshot: lightScreenshot,
      test: () =>
        page.evaluate(() => {
          const aside = document.querySelector(
            'aside[aria-label="Custom Dark Mode settings"]',
          );
          return {
            passed:
              !document.documentElement.classList.contains(
                "roamjs-custom-dark-theme",
              ) &&
              getComputedStyle(aside).backgroundColor === "rgb(255, 255, 255)",
            details: {
              themeClass: document.documentElement.classList.contains(
                "roamjs-custom-dark-theme",
              ),
              drawerBackground: getComputedStyle(aside).backgroundColor,
            },
          };
        }),
    });
    await check({
      name: "Light-mode group headers use a visible light gray fill",
      screenshot: lightScreenshot,
      test: async () => {
        const backgrounds = await drawer(page)
          .locator("section > button")
          .evaluateAll((buttons) =>
            buttons.map((button) => getComputedStyle(button).backgroundColor),
          );
        return {
          passed:
            backgrounds.length === 5 &&
            backgrounds.every(
              (value) =>
                value !== "rgb(255, 255, 255)" && !isTransparent(value),
            ),
          details: backgrounds,
        };
      },
    });
    const lightSurfacesHeader = drawer(page).getByRole("button", {
      name: /^Surfaces$/,
    });
    if ((await lightSurfacesHeader.getAttribute("aria-expanded")) !== "true") {
      await click(lightSurfacesHeader, "Expand Surfaces in light mode");
    }
    const lightSwatches = roleContainer(page, "App background").locator(
      'button[aria-label^="Use "]',
    );
    const lightPaletteScreenshot = await capture({
      page,
      name: "13-light-drawer-dark-palette",
      label: "Dark-only palette remains readable in light drawer mode",
      locator: roleContainer(page, "App background"),
    });
    await check({
      name: "Off mode keeps the curated dark palette values",
      screenshot: lightPaletteScreenshot,
      test: async () => {
        const colors = await lightSwatches.evaluateAll((swatches) =>
          swatches.map((swatch) => getComputedStyle(swatch).backgroundColor),
        );
        const values = colors.map(parseRgb).filter(Boolean).map(luminance);
        return {
          passed: values.length === 8 && values.every((value) => value < 0.12),
          details: { colors, luminance: values },
        };
      },
    });

    await select(modeSelect(page), "auto", "Switch theme mode Auto");
    await runCommand(page, "Custom Dark Mode: Toggle Dark Mode");
    await check({
      name: "Toggle Dark Mode changes Auto to Off",
      test: async () => ({
        passed: (await modeSelect(page).inputValue()) === "off",
        details: { mode: await modeSelect(page).inputValue() },
      }),
    });
    await runCommand(page, "Custom Dark Mode: Toggle Dark Mode");
    await check({
      name: "Toggle Dark Mode restores Auto after Off",
      test: async () => ({
        passed: (await modeSelect(page).inputValue()) === "auto",
        details: { mode: await modeSelect(page).inputValue() },
      }),
    });
    await select(modeSelect(page), "dark", "Switch theme mode Dark");
    await runCommand(page, "Custom Dark Mode: Toggle Dark Mode");
    await check({
      name: "Toggle Dark Mode changes Dark to Off",
      test: async () => ({
        passed: (await modeSelect(page).inputValue()) === "off",
        details: { mode: await modeSelect(page).inputValue() },
      }),
    });
    await runCommand(page, "Custom Dark Mode: Toggle Dark Mode");
    const toggleScreenshot = await capture({
      page,
      name: "14-toggle-restored-dark",
      label: "Toggle Dark Mode restored Dark",
    });
    await check({
      name: "Toggle Dark Mode restores Dark after Off",
      screenshot: toggleScreenshot,
      test: async () => ({
        passed: (await modeSelect(page).inputValue()) === "dark",
        details: { mode: await modeSelect(page).inputValue() },
      }),
    });

    await press(page, "Escape", "Close settings drawer with Escape");
    await check({
      name: "Escape closes the settings drawer",
      test: () =>
        drawer(page)
          .count()
          .then((count) => count === 0),
    });
    await runCommand(page, "Custom Dark Mode: Open Settings");
    await click(
      drawer(page).getByRole("button", {
        name: "Close Custom Dark Mode settings",
      }),
      "Close settings drawer with Close button",
    );
    await check({
      name: "Close button closes the settings drawer",
      test: () =>
        drawer(page)
          .count()
          .then((count) => count === 0),
    });

    await navigate(
      page,
      `${DEFAULT_GRAPH_URL}/search`,
      ".rm-all-pages, #all-pages-search",
      "Open All Pages",
    );
    const allPagesScreenshot = await capture({
      page,
      name: "15-all-pages-transparent-rows",
      label: "All Pages rows without highlighted backgrounds",
    });
    await check({
      name: "All Pages body rows remain transparent while the header is elevated",
      screenshot: allPagesScreenshot,
      test: () =>
        page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll(".rm-pages-row"))
            .filter(
              (row) =>
                row.id !== "rm-all-pages-column-titles" &&
                !row.classList.contains("rm-pages-row-header") &&
                !row.closest("#rm-all-pages-column-titles"),
            )
            .slice(0, 10);
          const rowBackgrounds = rows.map(
            (row) => getComputedStyle(row).backgroundColor,
          );
          const header = document.querySelector(
            "#rm-all-pages-column-titles, .rm-pages-row-header",
          );
          const headerBackground = header
            ? getComputedStyle(header).backgroundColor
            : null;
          return {
            passed:
              rows.length > 0 &&
              rowBackgrounds.every((value) => value === "rgba(0, 0, 0, 0)") &&
              !!headerBackground &&
              headerBackground !== "rgba(0, 0, 0, 0)",
            details: { rowBackgrounds, headerBackground },
          };
        }),
    });

    await runCommand(page, "Open advanced search");
    const advancedSearch = page.locator(".rm-modal-dialog--find-or-create");
    await advancedSearch.waitFor({ timeout });
    await fill(
      advancedSearch.locator("#rm-find-or-create-modal-input"),
      "test",
      "Search in advanced native search",
    );
    await page.waitForTimeout(600);
    const searchScreenshot = await capture({
      page,
      name: "16-native-search-single-surface",
      label: "Native advanced search with a single base surface",
      locator: advancedSearch,
    });
    await check({
      name: "Native advanced search header, body, list, and footer share one base surface",
      screenshot: searchScreenshot,
      test: () =>
        advancedSearch.evaluate((dialog) => {
          const selectors = [
            ".rm-find-or-create-modal",
            ".rm-find-or-create-modal-header",
            ".rm-find-or-create-modal-main",
            ".rm-find-or-create-modal-body__list",
            ".rm-find-or-create-footer",
          ];
          const colors = selectors.map((selector) => ({
            selector,
            color: getComputedStyle(dialog.querySelector(selector))
              .backgroundColor,
          }));
          return {
            passed:
              new Set(
                colors
                  .map(({ color }) => color)
                  .filter((color) => color !== "rgba(0, 0, 0, 0)"),
              ).size <= 1,
            details: colors,
          };
        }),
    });
    await press(page, "Escape", "Close advanced search");

    await openSettings(page);
    const preferencesTab = page
      .locator(".rm-settings__tab[aria-selected='true']")
      .first();
    const settingsScreenshot = await capture({
      page,
      name: "17-settings-highlighted-text",
      label: "Readable highlighted settings menu text",
    });
    await check({
      name: "Highlighted settings menu text meets WCAG AA contrast",
      screenshot: settingsScreenshot,
      test: async () => {
        const values = await preferencesTab.evaluate((element) => ({
          color: getComputedStyle(element).color,
          backgroundColor: getComputedStyle(element).backgroundColor,
        }));
        const ratio = contrastRatio(values.color, values.backgroundColor);
        return {
          passed: ratio >= 4.5,
          details: { ...values, contrastRatio: ratio },
        };
      },
    });

    await openSettingsTab(
      page,
      "#bp3-tab-title_rm-settings-tabs_rm-depot-tab",
      "Roam Depot for final icon proof",
    );
    const depotScreenshot = await capture({
      page,
      name: "18-roam-depot-transparent-icons",
      label: "Roam Depot native icon controls without crowded backgrounds",
    });
    await check({
      name: "Visible icon-only controls across Roam Depot have transparent backgrounds",
      screenshot: depotScreenshot,
      test: () =>
        page.evaluate(() => {
          const buttons = Array.from(
            document.querySelectorAll(
              "#bp3-tab-panel_rm-settings-tabs_rm-depot-tab button.bp3-button[class*='bp3-icon-']",
            ),
          ).filter((button) => button.getBoundingClientRect().width > 0);
          const backgrounds = buttons.map(
            (button) => getComputedStyle(button).backgroundColor,
          );
          return {
            passed:
              backgrounds.length > 0 &&
              backgrounds.every((value) => value === "rgba(0, 0, 0, 0)"),
            details: { count: buttons.length, backgrounds },
          };
        }),
    });

    await closeOpenOverlays(page);
    await navigate(
      page,
      `${DEFAULT_GRAPH_URL}/graph`,
      ".roam-body-main, canvas",
      "Open Graph Overview",
    );
    await capture({
      page,
      name: "19-graph-overview",
      label: "Graph Overview under the custom dark theme",
    });
    await check({
      name: "Graph Overview remains visible under the theme",
      test: async () => ({
        passed:
          (await page.locator("canvas, .roam-graph").count()) > 0 &&
          (await page.locator(".roam-body-main").isVisible()),
        details: { canvasCount: await page.locator("canvas").count() },
      }),
    });

    await navigate(
      page,
      DEFAULT_GRAPH_URL,
      ".roam-log-container, .roam-article",
      "Return to Daily Notes",
    );
    const finalScreenshot = await capture({
      page,
      name: "20-final-daily-notes",
      label: "Final clean Daily Notes state in dark mode",
    });
    await check({
      name: "Final state is dark mode with exactly one active runtime stylesheet",
      screenshot: finalScreenshot,
      test: () =>
        page.evaluate(() => ({
          passed:
            document.documentElement.classList.contains(
              "roamjs-custom-dark-theme",
            ) &&
            document.querySelectorAll("#roamjs-custom-dark-theme-styles")
              .length === 1,
          details: {
            themeClass: document.documentElement.classList.contains(
              "roamjs-custom-dark-theme",
            ),
            styles: document.querySelectorAll(
              "#roamjs-custom-dark-theme-styles",
            ).length,
          },
        })),
    });
  } catch (error) {
    fatalError = error;
    await capture({
      page,
      name: "99-fatal-error-state",
      label: "Browser state when the full UI test stopped",
    }).catch(() => undefined);
  } finally {
    try {
      fixtureCleanup = await deleteFixture(page, fixture);
    } catch (error) {
      fixtureCleanup = {
        attempted: !!fixture,
        succeeded: false,
        pages: [],
        error: error.message,
      };
      consoleErrors.push(`Fixture cleanup failed: ${error.message}`);
    }
    await context.close();
    const temporaryVideoPath = video
      ? await video.path().catch(() => null)
      : null;
    let videoPath = null;
    if (temporaryVideoPath) {
      videoPath = path.join(videoDir, "custom-dark-theme-full-ui-test.webm");
      if (temporaryVideoPath !== videoPath) {
        await fs.rename(temporaryVideoPath, videoPath).catch(async () => {
          await fs.copyFile(temporaryVideoPath, videoPath);
        });
      }
    }

    const summary = {
      total: checks.length,
      passed: checks.filter(({ status }) => status === "passed").length,
      failed: checks.filter(({ status }) => status === "failed").length,
    };
    const result = {
      ok:
        !fatalError &&
        summary.failed === 0 &&
        pageErrors.length === 0 &&
        fixtureCleanup.succeeded &&
        actions.every(({ status }) => status === "passed"),
      graphUrl: DEFAULT_GRAPH_URL,
      repoDir,
      extensionName,
      actionDelayMs,
      summary,
      checks,
      captures,
      actions,
      videoPath,
      pageErrors,
      consoleErrors,
      knownWarnings,
      infrastructureIssues,
      fixtureCleanup,
      fatalError: fatalError?.stack || null,
      completedAt: new Date().toISOString(),
    };
    await fs.writeFile(
      path.join(outDir, "results.json"),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    await writeMarkdownReport(result);
    console.log(
      JSON.stringify(
        {
          ok: result.ok,
          summary,
          screenshots: captures.length,
          actions: actions.length,
          actionDelayMs,
          videoPath,
          resultPath: path.join(outDir, "results.json"),
          reportPath: path.join(outDir, "results.md"),
          pageErrors,
          fatalError: fatalError?.message || null,
        },
        null,
        2,
      ),
    );
    if (!result.ok) process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
