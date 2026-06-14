import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

test("manifest declares the MV3 extension entry points", async () => {
  const manifest = await readJson("manifest.json");

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.name, "TabTrail");
  assert.equal(manifest.action.default_popup, "src/popup/popup.html");
  assert.equal(manifest.background.service_worker, "src/background/service-worker.js");
  assert.equal(manifest.background.type, "module");
  assert.equal(manifest.side_panel.default_path, "src/sidepanel/sidepanel.html");
  assert.deepEqual(
    new Set(manifest.permissions),
    new Set(["tabs", "storage", "sidePanel"])
  );
});
