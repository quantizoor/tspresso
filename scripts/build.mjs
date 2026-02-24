import { mkdir } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";

const ALL_TARGETS = [
	{ bunTarget: "bun-darwin-arm64", pkg: "cli-darwin-arm64", bin: "tspresso" },
	{ bunTarget: "bun-linux-arm64", pkg: "cli-linux-arm64", bin: "tspresso" },
	{ bunTarget: "bun-linux-x64", pkg: "cli-linux-x64", bin: "tspresso" },
	{ bunTarget: "bun-windows-x64", pkg: "cli-win-x64", bin: "tspresso.exe" },
];

const root = `${import.meta.dirname}/..`;
const filter = process.argv[2];

const targets = filter
	? ALL_TARGETS.filter((t) => t.bunTarget === filter || t.pkg === filter)
	: ALL_TARGETS;

if (targets.length === 0) {
	console.error(`Unknown target: ${filter}`);
	console.error(`Available: ${ALL_TARGETS.map((t) => t.bunTarget).join(", ")}`);
	process.exit(1);
}

for (const { bunTarget, pkg, bin } of targets) {
	const outDir = path.join(root, "packages", pkg, "bin");
	const outFile = path.join(outDir, bin);

	console.log(`Building ${bunTarget} → ${outFile}`);
	await mkdir(outDir, { recursive: true });

	await $`bun build --compile --target=${bunTarget} ${root}/src/main.tsx --outfile ${outFile}`;
}

console.log("Done.");
