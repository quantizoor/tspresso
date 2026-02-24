import { useKeyboard } from "@opentui/react";
import { useState } from "react";

interface SingleSelectOption {
	label: string;
	description?: string;
	disabled?: boolean;
}

interface SingleSelectProps {
	label: string;
	options: SingleSelectOption[];
	focused?: boolean;
	initialIndex?: number;
	onSelect?: (index: number, option: SingleSelectOption) => void;
	onHighlight?: (index: number, option: SingleSelectOption) => void;
}

export function SingleSelect({
	label,
	options,
	focused = false,
	initialIndex = 0,
	onSelect,
	onHighlight,
}: SingleSelectProps) {
	const [selectedIndex, setSelectedIndex] = useState(initialIndex);

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
			setSelectedIndex((prev) => {
				const next = findNextEnabled(prev, -1);
				const opt = options[next];
				if (opt) onHighlight?.(next, opt);
				return next;
			});
		} else if (event.name === "down" || event.name === "j") {
			setSelectedIndex((prev) => {
				const next = findNextEnabled(prev, 1);
				const opt = options[next];
				if (opt) onHighlight?.(next, opt);
				return next;
			});
		} else if (event.name === "return") {
			const option = options[selectedIndex];
			if (option && !option.disabled) onSelect?.(selectedIndex, option);
		}
	});

	return (
		<box flexDirection="column" gap={0}>
			<text>
				<b fg="#c084fc">{" ? "}</b>
				<b>{label}</b>
				<span fg="#555555">{" (arrow keys to move, enter to select)"}</span>
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
					const isSelected = i === selectedIndex;
					if (option.disabled) {
						return (
							<box key={`opt-${option.label}`} flexDirection="row" gap={1}>
								<text fg="#444444"> </text>
								<text fg="#444444">{option.label} (coming soon)</text>
							</box>
						);
					}
					return (
						<box key={`opt-${option.label}`} flexDirection="row" gap={1}>
							<text fg={isSelected && focused ? "#c084fc" : "#555555"}>
								{isSelected && focused ? ">" : " "}
							</text>
							<text
								fg={isSelected && focused ? "#c084fc" : "#dddddd"}
								attributes={isSelected && focused ? 1 : 0}
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
