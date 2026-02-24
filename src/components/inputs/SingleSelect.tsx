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
	onSelect?: (index: number, option: SingleSelectOption) => void;
}

export function SingleSelect({
	label,
	options,
	focused = false,
	onSelect,
}: SingleSelectProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);

	useKeyboard((event) => {
		if (!focused) return;
		if (event.name === "up" || event.name === "k") {
			setSelectedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
		} else if (event.name === "down" || event.name === "j") {
			setSelectedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
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
