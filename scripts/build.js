import { cp, mkdir, rm } from "node:fs/promises";

const outputDir = "dist";
const driverVendorDir = "src/vendor/driverjs";
const driverVendorFiles = [
  ["node_modules/driver.js/dist/driver.js.iife.js", `${driverVendorDir}/driver.js.iife.js`],
  ["node_modules/driver.js/dist/driver.css", `${driverVendorDir}/driver.css`],
  ["node_modules/driver.js/license", `${driverVendorDir}/LICENSE`]
];
const entries = [
  "manifest.json",
  "src"
];

await mkdir(driverVendorDir, { recursive: true });
for (const [source, target] of driverVendorFiles) {
  await cp(source, target);
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const entry of entries) {
  await cp(entry, `${outputDir}/${entry}`, { recursive: true });
}

console.log(`Extension build written to ${outputDir}/`);
