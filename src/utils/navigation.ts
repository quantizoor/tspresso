export function findNextEnabled(
	options: readonly { disabled?: boolean }[],
	from: number,
	direction: 1 | -1,
): number {
	const len = options.length;
	for (let i = 1; i <= len; i++) {
		const idx = (from + direction * i + len) % len;
		if (!options[idx]?.disabled) return idx;
	}
	return from; // all disabled, don't move
}
