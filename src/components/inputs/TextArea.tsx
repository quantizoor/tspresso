import { useKeyboard } from "@opentui/react";

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
				<b fg="#c084fc">{" ? "}</b>
				<b>{label}</b>
				<span fg="#555555">{" (ctrl+s to save)"}</span>
			</text>
			<box
				border={true}
				borderStyle="rounded"
				borderColor={focused ? "#c084fc" : "#555555"}
				width="100%"
				height={height + 2}
			>
				<textarea
					focused={focused}
					initialValue={initialValue}
					placeholder={placeholder}
					placeholderColor="#555555"
					textColor={focused ? "#ffffff" : "#aaaaaa"}
					backgroundColor={focused ? "#1a1a2e" : "#111111"}
					focusedTextColor="#ffffff"
					focusedBackgroundColor="#1a1a2e"
					cursorColor="#c084fc"
					selectionBg="#c084fc"
					selectionFg="#ffffff"
					wrapMode="word"
					width="100%"
					height={height}
				/>
			</box>
			<box flexDirection="row" gap={2} paddingX={1}>
				<text fg="#444444">
					{"arrows: move | "}
					{"shift+arrows: select | "}
					{"ctrl+z: undo | "}
					{"ctrl+s: save"}
				</text>
			</box>
		</box>
	);
}
