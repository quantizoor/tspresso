import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

export function getDataDir(): string {
	const home = homedir();
	switch (platform()) {
		case "darwin":
			return join(home, "Library", "Application Support", "tspresso");
		case "win32":
			return join(
				process.env.APPDATA ?? join(home, "AppData", "Roaming"),
				"tspresso",
			);
		case "linux":
			return join(
				process.env.XDG_DATA_HOME ?? join(home, ".local", "share"),
				"tspresso",
			);
		default:
			return join(home, ".tspresso");
	}
}

export function readStore<T extends Record<string, unknown>>(
	name: string,
	defaults: T,
): T {
	try {
		const raw = readFileSync(join(getDataDir(), `${name}.json`), "utf-8");
		return { ...defaults, ...JSON.parse(raw) };
	} catch {
		return defaults;
	}
}

export function writeStore<T extends Record<string, unknown>>(
	name: string,
	data: T,
): void {
	const dir = getDataDir();
	mkdirSync(dir, { recursive: true });
	writeFileSync(
		join(dir, `${name}.json`),
		`${JSON.stringify(data, null, "\t")}\n`,
	);
}

export function deleteStore(name: string): boolean {
	const file = join(getDataDir(), `${name}.json`);
	if (!existsSync(file)) return false;
	rmSync(file);
	return true;
}

export function listStores(): string[] {
	const dir = getDataDir();
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((f) => f.endsWith(".json"))
		.map((f) => f.slice(0, -5));
}
