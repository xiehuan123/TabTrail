import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const requiredFiles = [
  "manifest.json",
  "src/background/service-worker.js",
  "src/background/tab-events.js",
  "src/assets/icons/tabtrail.svg",
  "src/assets/icons/tabtrail-16.png",
  "src/assets/icons/tabtrail-32.png",
  "src/assets/icons/tabtrail-48.png",
  "src/assets/icons/tabtrail-128.png",
  "src/shared/browser-api.js",
  "src/shared/constants.js",
  "src/shared/icons.js",
  "src/shared/preferences.js",
  "src/shared/recent-activity.js",
  "src/shared/time-format.js",
  "src/shared/types.js",
  "src/shared/ui-tokens.css",
  "src/vendor/driverjs/driver.js.iife.js",
  "src/vendor/driverjs/driver.css",
  "src/vendor/driverjs/LICENSE",
  "src/popup/popup.html",
  "src/popup/popup.css",
  "src/popup/popup.js",
  "src/popup/popup-model.js",
  "src/newtab/newtab.html",
  "src/newtab/newtab.css",
  "src/newtab/newtab.js",
  "src/newtab/onboarding-tour.js",
  "src/newtab/newtab-model.js",
  "src/sidepanel/sidepanel.html",
  "src/sidepanel/sidepanel.css",
  "src/sidepanel/sidepanel.js",
  "src/sidepanel/sidepanel-model.js"
];

for (const file of requiredFiles) {
  await access(file);
}

const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.background.type, "module");
assert.equal(manifest.action.default_popup, "src/popup/popup.html");
assert.deepEqual(manifest.icons, {
  "16": "src/assets/icons/tabtrail-16.png",
  "32": "src/assets/icons/tabtrail-32.png",
  "48": "src/assets/icons/tabtrail-48.png",
  "128": "src/assets/icons/tabtrail-128.png"
});
assert.deepEqual(manifest.action.default_icon, manifest.icons);
assert.equal(manifest.side_panel.default_path, "src/sidepanel/sidepanel.html");
assert.deepEqual(
  new Set(manifest.permissions),
  new Set(["tabs", "storage", "sidePanel", "sessions"])
);

const sourceFiles = await Promise.all(
  requiredFiles
    .filter((file) => file.endsWith(".js") || file.endsWith(".json"))
    .map((file) => readFile(file, "utf8"))
);
const source = sourceFiles.join("\n");
assert.equal(source.includes("fetch("), false, "MVP must not upload browsing data");
assert.equal(source.includes("XMLHttpRequest"), false, "MVP must not upload browsing data");
assert.equal(source.includes("document.body.innerText"), false, "MVP must not read page body text");

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
assert.equal(packageJson.dependencies?.["driver.js"], "1.3.6");
assert.equal(packageJson.dependencies?.["intro.js"], undefined, "Intro.js AGPL dependency is not allowed");
assert.equal(packageJson.dependencies?.introjs, undefined, "Intro.js AGPL dependency is not allowed");

const driverLicense = await readFile("src/vendor/driverjs/LICENSE", "utf8");
assert.match(driverLicense, /MIT License/);

const onboardingFiles = [
  "src/newtab/newtab.html",
  "src/newtab/newtab.js",
  "src/newtab/onboarding-tour.js",
  "src/newtab/newtab.css",
  "src/vendor/driverjs/driver.css",
  "src/vendor/driverjs/LICENSE"
];
const blockedOnboardingPatterns = [
  "https://",
  "http://",
  "unpkg",
  "jsdelivr",
  "cdnjs",
  "intro.js",
  "introjs",
  "AGPL"
];
const onboardingSource = (await Promise.all(onboardingFiles.map((file) => readFile(file, "utf8")))).join("\n");
for (const pattern of blockedOnboardingPatterns.map((value) => new RegExp(value.replace(".", "\\."), "i"))) {
  assert.equal(pattern.test(onboardingSource), false, `onboarding resources must be local and permissively licensed: ${pattern}`);
}

async function listFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const filePath = path.join(root, entry.name);
    return entry.isDirectory() ? listFiles(filePath) : filePath;
  }));

  return files.flat();
}

const vendorFiles = await listFiles("src/vendor/driverjs");
assert.deepEqual(
  vendorFiles.sort(),
  [
    "src/vendor/driverjs/LICENSE",
    "src/vendor/driverjs/driver.css",
    "src/vendor/driverjs/driver.js.iife.js"
  ]
);

console.log("Project structure check passed.");
