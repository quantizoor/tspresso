import { useKeyboard } from "@opentui/react";
import { colors } from "../../styles/colors.ts";

interface TextAreaProps {
	label: string;
	placeholder?: string;
	focused?: boolean;
	initialValue?: string;
	height?: number;
	onSubmit?: () => void;
}

export function TextArea({
	label,
	placeholder = "",
	focused = false,
	initialValue = "",
	height = 10,
	onSubmit,
}: TextAreaProps) {
	useKeyboard((event) => {
		if (!focused) return;
		if (event.ctrl && event.name === "s") {
			event.preventDefault();
			onSubmit?.();
		}
	});

	return (
		<box flexDirection="column" gap={0}>
			<text>
				<b fg={colors.accent}>{" ? "}</b>
				<b>{label}</b>
				<span fg={colors.hint}>{" (ctrl+s to save)"}</span>
			</text>
			<box
				border={true}
				borderStyle="rounded"
				borderColor={focused ? colors.accent : colors.hint}
				width="100%"
				height={height + 2}
			>
				<textarea
					focused={focused}
					initialValue={initialValue}
					placeholder={placeholder}
					placeholderColor={colors.hint}
					textColor={focused ? colors.textActive : colors.textDim}
					backgroundColor={focused ? colors.bgFocused : colors.bgUnfocused}
					focusedTextColor={colors.textActive}
					focusedBackgroundColor={colors.bgFocused}
					cursorColor={colors.accent}
					selectionBg={colors.accent}
					selectionFg={colors.textActive}
					wrapMode="word"
					width="100%"
					height={height}
				/>
			</box>
			<box flexDirection="row" gap={2} paddingX={1}>
				<text fg={colors.disabled}>
					{"arrows: move | "}
					{"shift+arrows: select | "}
					{"ctrl+z: undo | "}
					{"ctrl+s: save"}
				</text>
			</box>
		</box>
	);
}
