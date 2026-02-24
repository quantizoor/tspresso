import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import { colors } from "../../styles/colors.ts";
import { findNextEnabled } from "../../utils/navigation.ts";
import type { InputOption } from "./types.ts";

interface SingleSelectProps {
	label: string;
	options: InputOption[];
	focused?: boolean;
	initialIndex?: number;
	onSelect?: (index: number, option: InputOption) => void;
	onHighlight?: (index: number, option: InputOption) => void;
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

	useKeyboard((event) => {
		if (!focused) return;
		if (event.name === "up" || event.name === "k") {
			setSelectedIndex((prev) => {
				const next = findNextEnabled(options, prev, -1);
				const opt = options[next];
				if (opt) onHighlight?.(next, opt);
				return next;
			});
		} else if (event.name === "down" || event.name === "j") {
			setSelectedIndex((prev) => {
				const next = findNextEnabled(options, prev, 1);
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
				<b fg={colors.accent}>{" ? "}</b>
				<b>{label}</b>
				<span fg={colors.hint}>{" (arrow keys to move, enter to select)"}</span>
			</text>
			<box
				flexDirection="column"
				border={true}
				borderStyle="rounded"
				borderColor={focused ? colors.accent : colors.hint}
				paddingX={1}
				width="100%"
			>
				{options.map((option, i) => {
					const isSelected = i === selectedIndex;
					if (option.disabled) {
						return (
							<box key={`opt-${option.label}`} flexDirection="row" gap={1}>
								<text fg={colors.disabled}> </text>
								<text fg={colors.disabled}>{option.label} (coming soon)</text>
							</box>
						);
					}
					return (
						<box key={`opt-${option.label}`} flexDirection="row" gap={1}>
							<text fg={isSelected && focused ? colors.accent : colors.hint}>
								{isSelected && focused ? ">" : " "}
							</text>
							<text
								fg={isSelected && focused ? colors.accent : colors.text}
								attributes={isSelected && focused ? 1 : 0}
							>
								{option.label}
							</text>
							{option.description && (
								<text
									fg={colors.description}
								>{` - ${option.description}`}</text>
							)}
						</box>
					);
				})}
			</box>
		</box>
	);
}
