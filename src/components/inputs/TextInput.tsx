import { useState } from "react";
import { colors } from "../../styles/colors.ts";

interface TextInputProps {
	label: string;
	placeholder?: string;
	focused?: boolean;
	maxLength?: number;
	initialValue?: string;
	onSubmit?: (value: string) => void;
	onChange?: (value: string) => void;
}

export function TextInput({
	label,
	placeholder = "",
	focused = false,
	maxLength,
	initialValue = "",
	onSubmit,
	onChange,
}: TextInputProps) {
	const [value, setValue] = useState(initialValue);

	function handleChange(v: string) {
		setValue(v);
		onChange?.(v);
	}

	return (
		<box flexDirection="column" gap={0}>
			<text>
				<b fg={colors.accent}>{" ? "}</b>
				<b>{label}</b>
			</text>
			<box
				border={true}
				borderStyle="rounded"
				borderColor={focused ? colors.accent : colors.hint}
				paddingX={1}
				width="100%"
			>
				<input
					focused={focused}
					value={value}
					placeholder={placeholder}
					maxLength={maxLength}
					onChange={handleChange}
					onSubmit={(v) => onSubmit?.(v as string)}
					textColor={focused ? colors.textActive : colors.description}
					width="100%"
				/>
			</box>
		</box>
	);
}
