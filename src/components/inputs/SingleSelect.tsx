import { useKeyboard } from "@opentui/react";
import { useState } from "react";

interface SingleSelectOption {
	label: string;
	description?: string;
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

	useKeyboard((event) => {
		if (!focused) return;
		if (event.name === "up" || event.name === "k") {
			setSelectedIndex((prev) => {
				const next = prev > 0 ? prev - 1 : options.length - 1;
				const opt = options[next];
				if (opt) onHighlight?.(next, opt);
				return next;
			});
		} else if (event.name === "down" || event.name === "j") {
			setSelectedIndex((prev) => {
				const next = prev < options.length - 1 ? prev + 1 : 0;
				const opt = options[next];
				if (opt) onHighlight?.(next, opt);
				return next;
			});
		} else if (event.name === "return") {
			const option = options[selectedIndex];
			if (option) onSelect?.(selectedIndex, option);
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
