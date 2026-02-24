import { useKeyboard } from "@opentui/react";
import { useState } from "react";

interface MultiSelectOption {
	label: string;
	description?: string;
	disabled?: boolean;
}

interface MultiSelectProps {
	label: string;
	options: MultiSelectOption[];
	focused?: boolean;
	initialSelected?: number[];
	onSubmit?: (selected: number[]) => void;
	onChange?: (selected: number[]) => void;
}

export function MultiSelect({
	label,
	options,
	focused = false,
	initialSelected = [],
	onSubmit,
	onChange,
}: MultiSelectProps) {
	const [cursorIndex, setCursorIndex] = useState(0);
	const [selected, setSelected] = useState<Set<number>>(
		new Set(initialSelected),
	);

	function findNextEnabled(from: number, direction: 1 | -1): number {
		const len = options.length;
		for (let i = 1; i <= len; i++) {
			const idx = (from + direction * i + len) % len;
			if (!options[idx]?.disabled) return idx;
		}
		return from; // all disabled, don't move
	}

	useKeyboard((event) => {
		if (!focused) return;
		if (event.name === "up" || event.name === "k") {
			setCursorIndex((prev) => findNextEnabled(prev, -1));
		} else if (event.name === "down" || event.name === "j") {
			setCursorIndex((prev) => findNextEnabled(prev, 1));
		} else if (event.name === "space") {
			if (options[cursorIndex]?.disabled) return;
			setSelected((prev) => {
				const next = new Set(prev);
				if (next.has(cursorIndex)) {
					next.delete(cursorIndex);
				} else {
					next.add(cursorIndex);
				}
				onChange?.([...next].sort());
				return next;
			});
		} else if (event.name === "a") {
			setSelected((prev) => {
				const enabledIndices = options
					.map((o, i) => (!o.disabled ? i : -1))
					.filter((i) => i >= 0);
				const allEnabled = enabledIndices.every((i) => prev.has(i));
				if (allEnabled) {
					const next = new Set(prev);
					for (const i of enabledIndices) next.delete(i);
					onChange?.([...next].sort());
					return next;
				}
				const next = new Set(prev);
				for (const i of enabledIndices) next.add(i);
				onChange?.([...next].sort());
				return next;
			});
		} else if (event.name === "return") {
			onSubmit?.([...selected].sort());
		}
	});

	return (
		<box flexDirection="column" gap={0}>
			<text>
				<b fg="#c084fc">{" ? "}</b>
				<b>{label}</b>
				<span fg="#555555">
					{" (space to toggle, a to toggle all, enter to confirm)"}
				</span>
			</text>
			<box
				flexDirection="column"
				border={true}
				borderStyle="rounded"
				borderColor={focused ? "#c084fc" : "#555555"}
				paddingX={1}
				width="100%"
			>
				{options.map((option, i) => {
					const isAtCursor = i === cursorIndex;
					const isChecked = selected.has(i);
					if (option.disabled) {
						return (
							<box key={`opt-${option.label}`} flexDirection="row" gap={1}>
								<text fg="#444444"> </text>
								<text fg="#444444">{"[-]"}</text>
								<text fg="#444444">{option.label} (coming soon)</text>
							</box>
						);
					}
					return (
						<box key={`opt-${option.label}`} flexDirection="row" gap={1}>
							<text fg={isAtCursor && focused ? "#c084fc" : "#555555"}>
								{isAtCursor && focused ? ">" : " "}
							</text>
							<text
								fg={isChecked ? "#22c55e" : "#555555"}
								attributes={isChecked ? 1 : 0}
							>
								{isChecked ? "[x]" : "[ ]"}
							</text>
							<text
								fg={
									isAtCursor && focused
										? "#c084fc"
										: isChecked
											? "#22c55e"
											: "#dddddd"
								}
								attributes={isAtCursor && focused ? 1 : 0}
							>
								{option.label}
							</text>
							{option.description && (
								<text fg="#777777">{` - ${option.description}`}</text>
							)}
						</box>
					);
				})}
			</box>
		</box>
	);
}
