import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";

const storage = () => {
  const map = new Map();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
};
globalThis.localStorage = storage();
globalThis.sessionStorage = storage();
globalThis.window = Object.assign(new EventTarget(), {
  location: { origin: "http://localhost:5175" },
  localStorage,
  sessionStorage,
});
const locales = ["en", "fa-AF", "ps-AF"];
const translations = await Promise.all(
  locales.map((lang) =>
    readFile(`../provider/src/i18n/locales/${lang}.json`, "utf8").then(
      JSON.parse,
    ),
  ),
);
function keys(value, prefix = "") {
  return Object.entries(value).flatMap(([key, item]) =>
    typeof item === "object"
      ? keys(item, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}
for (let i = 1; i < 3; i++)
  assert.deepEqual(
    keys(translations[i].adminConsole).sort(),
    keys(translations[0].adminConsole).sort(),
    `${locales[i]} translation keys`,
  );
const appSource = await readFile("src/App.tsx", "utf8");
const primaryNavigation = appSource.slice(
  appSource.indexOf("const items ="),
  appSource.indexOf("const utilities ="),
);
assert(!primaryNavigation.includes("/views"));
assert(!primaryNavigation.includes("/profile"));
assert(!primaryNavigation.includes("/settings"));
const server = await createServer({
  envDir: false,
  ssr: {
    noExternal: [
      "lucide-react",
      "framer-motion",
      "react-redux",
      "react-i18next",
      /^@radix-ui\//,
    ],
  },
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { default: i18n } = await server.ssrLoadModule(
    "/@fs/" +
      process.cwd().replaceAll("\\", "/") +
      "/../provider/src/i18n/config.ts",
  );
  const { store } = await server.ssrLoadModule(
    "/@fs/" +
      process.cwd().replaceAll("\\", "/") +
      "/../provider/src/redux/store.ts",
  );
  const { AdminSessionContext, defaultPreferences } =
    await server.ssrLoadModule("/src/session.tsx");
  const { default: Profile } = await server.ssrLoadModule(
    "/src/pages/admin/Profile.tsx",
  );
  const { default: Settings } = await server.ssrLoadModule(
    "/src/pages/admin/Settings.tsx",
  );
  const { default: Access } = await server.ssrLoadModule(
    "/src/pages/admin/Access.tsx",
  );
  const { default: Table } = await server.ssrLoadModule(
    "/src/components/ResponsiveTable.tsx",
  );
  const { canAccess, homeFor, assignableRoles, canManageUser } =
    await server.ssrLoadModule("/src/access.ts");
  assert(canAccess("support_agent", "/support"));
  assert(!canAccess("support_agent", "/users"));
  assert(canAccess("content_manager", "/content"));
  assert(!canAccess("finance_agent", "/properties"));
  assert(canAccess("admin", "/users"));
  assert(!canAccess("customer", "/profile"));
  assert.equal(homeFor("verification_agent"), "/properties");
  assert(assignableRoles("admin").includes("admin"));
  assert(!assignableRoles("admin").includes("super_admin"));
  assert(canManageUser("admin", "customer", "target", "actor"));
  assert(!canManageUser("admin", "admin", "target", "actor"));
  const profile = {
    id: "actor",
    name: "Test administrator",
    email: "test@example.invalid",
    phone: "",
    role: "admin",
    language: "en",
    currency: "AFN",
    avatar: null,
    consolePreferences: {},
    propertyName: "",
  };
  const session = {
    profile,
    preferences: defaultPreferences,
    loading: false,
    failed: false,
    reload: async () => {},
    update: () => {},
    formatDate: (value) => value,
  };
  function render(component) {
    return renderToStaticMarkup(
      React.createElement(
        Provider,
        { store },
        React.createElement(
          MemoryRouter,
          {},
          React.createElement(
            AdminSessionContext.Provider,
            { value: session },
            component,
          ),
        ),
      ),
    );
  }
  for (let index = 0; index < 3; index++) {
    await i18n.changeLanguage(locales[index]);
    const text = translations[index];
    const profileHTML = render(React.createElement(Profile));
    assert(profileHTML.includes(text.adminConsole.uploadPhoto));
    assert(profileHTML.includes(text.adminConsole.currentPassword));
    assert(profileHTML.includes(text.adminConsole.confirmPassword));
    const settingsHTML = render(React.createElement(Settings));
    assert(settingsHTML.includes(text.adminConsole.autoRefresh));
    assert(settingsHTML.includes(text.adminConsole.tableDensity));
    assert(settingsHTML.includes(text.adminConsole.timeZone));
    const roleHTML = render(React.createElement(Access));
    assert(roleHTML.includes(text.adminConsole.roleSummary.support_agent));
    assert(roleHTML.includes(text.adminConsole.availableAreas));
    const tableHTML = render(
      React.createElement(
        Table,
        {
          label: text.admin.users,
          headings: [text.console.name, text.console.role],
        },
        React.createElement(
          "tr",
          {},
          React.createElement("td", {}, "Test name"),
          React.createElement("td", {}, "Test role"),
        ),
      ),
    );
    assert(tableHTML.includes(`data-label="${text.console.name}"`));
    assert(tableHTML.includes(`data-label="${text.console.role}"`));
    assert(!profileHTML.includes("adminConsole."));
    assert(!settingsHTML.includes("adminConsole."));
    assert(!roleHTML.includes("adminConsole."));
  }
  console.log(
    "Admin checks passed: role navigation, assignment rules, profile/password/settings in three languages, and labeled mobile table markup.",
  );
} finally {
  await server.close();
}
