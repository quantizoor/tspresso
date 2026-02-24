#!/usr/bin/env node

const { execFileSync } = require("node:child_process");
const path = require("node:path");

const PLATFORMS = {
	"darwin-arm64": { pkg: "@tspresso/cli-darwin-arm64", bin: "bin/tspresso" },
	"linux-arm64": { pkg: "@tspresso/cli-linux-arm64", bin: "bin/tspresso" },
	"linux-x64": { pkg: "@tspresso/cli-linux-x64", bin: "bin/tspresso" },
	"win32-x64": { pkg: "@tspresso/cli-win-x64", bin: "bin/tspresso.exe" },
};

const platformKey = `${process.platform}-${process.arch}`;
const platform = PLATFORMS[platformKey];

if (!platform) {
	console.error(`tspresso: unsupported platform ${platformKey}`);
	console.error("Supported: darwin-arm64, linux-arm64, linux-x64, win32-x64");
	process.exit(1);
}

let binPath;
try {
	const pkgDir = path.dirname(require.resolve(`${platform.pkg}/package.json`));
	binPath = path.join(pkgDir, platform.bin);
} catch {
	console.error(`tspresso: platform package ${platform.pkg} is not installed.`);
	console.error("Try reinstalling: npm install tspresso");
	process.exit(1);
}

try {
	execFileSync(binPath, process.argv.slice(2), { stdio: "inherit" });
} catch (e) {
	process.exit(e.status ?? 1);
}
