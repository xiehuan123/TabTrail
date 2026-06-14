import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "manifest.json",
  "src/background/service-worker.js",
  "src/shared/browser-api.js",
  "src/shared/constants.js",
  "src/shared/preferences.js",
  "src/shared/recent-activity.js",
  "src/shared/types.js",
  "src/popup/popup.html",
  "src/popup/popup.css",
  "src/popup/popup.js",
  "src/popup/popup-model.js",
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
assert.equal(manifest.side_panel.default_path, "src/sidepanel/sidepanel.html");

console.log("Project structure check passed.");
