import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const version = process.argv[2];
if (!version) {
	console.error("Usage: bun run scripts/version.mjs <version>");
	console.error("Example: bun run scripts/version.mjs 0.2.0");
	process.exit(1);
}

const root = `${import.meta.dirname}/..`;

const platformPkgs = [
	"cli-darwin-arm64",
	"cli-linux-arm64",
	"cli-linux-x64",
	"cli-win-x64",
];

// Update each platform package version
for (const pkg of platformPkgs) {
	const pkgPath = path.join(root, "packages", pkg, "package.json");
	const json = JSON.parse(readFileSync(pkgPath, "utf-8"));
	json.version = version;
	writeFileSync(pkgPath, `${JSON.stringify(json, null, "\t")}\n`);
	console.log(`Updated ${json.name} → ${version}`);
}

// Update main tspresso package version + optionalDependencies
const mainPkgPath = path.join(root, "packages", "tspresso", "package.json");
const mainJson = JSON.parse(readFileSync(mainPkgPath, "utf-8"));
mainJson.version = version;
for (const dep of Object.keys(mainJson.optionalDependencies)) {
	mainJson.optionalDependencies[dep] = version;
}
writeFileSync(mainPkgPath, `${JSON.stringify(mainJson, null, "\t")}\n`);
console.log(`Updated ${mainJson.name} → ${version}`);

console.log(`\nAll packages set to ${version}`);
console.log(`Next steps:`);
console.log(`  git add -A && git commit -m "v${version}"`);
console.log(`  git tag v${version}`);
console.log(`  git push && git push --tags`);
