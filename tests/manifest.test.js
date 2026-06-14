import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const EXPECTED_ICONS = {
  "16": "src/assets/icons/tabtrail-16.png",
  "32": "src/assets/icons/tabtrail-32.png",
  "48": "src/assets/icons/tabtrail-48.png",
  "128": "src/assets/icons/tabtrail-128.png"
};

test("manifest declares the MV3 extension entry points", async () => {
  const manifest = await readJson("manifest.json");

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.name, "TabTrail");
  assert.equal(manifest.action.default_popup, "src/popup/popup.html");
  assert.deepEqual(manifest.icons, EXPECTED_ICONS);
  assert.deepEqual(manifest.action.default_icon, EXPECTED_ICONS);
  assert.equal(manifest.chrome_url_overrides.newtab, "src/newtab/newtab.html");
  assert.equal(manifest.background.service_worker, "src/background/service-worker.js");
  assert.equal(manifest.background.type, "module");
  assert.equal(manifest.side_panel.default_path, "src/sidepanel/sidepanel.html");
  assert.deepEqual(
    new Set(manifest.permissions),
    new Set(["tabs", "storage", "sidePanel", "sessions"])
  );
});

test("extension logo assets are present in Chrome icon sizes", async () => {
  const svg = await readFile("src/assets/icons/tabtrail.svg", "utf8");

  assert.match(svg, /<title[^>]*>TabTrail logo<\/title>/);
  assert.match(svg, /#1f6feb/);
  assert.match(svg, /#167348/);

  await Promise.all(Object.entries(EXPECTED_ICONS).map(async ([size, path]) => {
    const buffer = await readFile(path);

    assert.deepEqual([...buffer.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(buffer.readUInt32BE(16), Number(size));
    assert.equal(buffer.readUInt32BE(20), Number(size));
  }));
});
