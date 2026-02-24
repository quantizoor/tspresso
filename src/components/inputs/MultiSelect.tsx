import { useKeyboard } from "@opentui/react";
import { useState } from "react";

interface MultiSelectOption {
	label: string;
	description?: string;
}

interface MultiSelectProps {
	label: string;
	options: MultiSelectOption[];
	focused?: boolean;
	onSubmit?: (selected: number[]) => void;
	onChange?: (selected: number[]) => void;
}

export function MultiSelect({
	label,
	options,
	focused = false,
	onSubmit,
	onChange,
}: MultiSelectProps) {
	const [cursorIndex, setCursorIndex] = useState(0);
	const [selected, setSelected] = useState<Set<number>>(new Set());

	useKeyboard((event) => {
		if (!focused) return;
		if (event.name === "up" || event.name === "k") {
			setCursorIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
		} else if (event.name === "down" || event.name === "j") {
			setCursorIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
		} else if (event.name === "space") {
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
				if (prev.size === options.length) {
					onChange?.([]);
					return new Set();
				}
				const all = new Set(options.map((_, i) => i));
				onChange?.([...all].sort());
				return all;
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
