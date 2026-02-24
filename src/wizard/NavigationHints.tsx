import type { FieldDef } from "../types/index.ts";

interface NavigationHintsProps {
	currentField: FieldDef;
	stepIndex: number;
	totalSteps: number;
	canGoBack?: boolean;
	canGoForward?: boolean;
	onPrevious?: () => void;
	onNext?: () => void;
}

export function NavigationHints({
	currentField,
	stepIndex,
	totalSteps,
	canGoBack = false,
	canGoForward = false,
	onPrevious,
	onNext,
}: NavigationHintsProps) {
	const hints: string[] = [];
	const isTextField =
		currentField.type === "text" || currentField.type === "textarea";

	if (canGoBack) {
		hints.push("Esc back");
	}

	switch (currentField.type) {
		case "select":
		case "template":
			hints.push("\u2191\u2193 navigate");
			hints.push("Enter select");
			break;
		case "multi-select":
			hints.push("\u2191\u2193 navigate");
			hints.push("Space toggle");
			hints.push("a all");
			hints.push("Enter confirm");
			break;
		case "text":
			hints.push("Enter submit");
			break;
		case "textarea":
			hints.push("Ctrl+S save");
			break;
	}

	const prevLabel = isTextField ? "Previous" : "Previous (\u2190)";
	const nextLabel = isTextField ? "Next" : "Next (\u2192)";

	return (
		<box flexDirection="row" gap={0} marginTop={1}>
			<box flexDirection="row" gap={3} flexGrow={1}>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: TUI click handler */}
				<box onMouseUp={canGoBack ? onPrevious : undefined}>
					<text
						fg={canGoBack ? "#c084fc" : "#333333"}
						attributes={canGoBack ? 1 : 0}
					>
						{prevLabel}
					</text>
				</box>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: TUI click handler */}
				<box onMouseUp={canGoForward ? onNext : undefined}>
					<text
						fg={canGoForward ? "#c084fc" : "#333333"}
						attributes={canGoForward ? 1 : 0}
					>
						{nextLabel}
					</text>
				</box>
			</box>
			<text fg="#555555">
				{hints.join("  \u2502  ")}
				{"  "}
			</text>
			<text fg="#444444">
				{"Step "}
				{stepIndex + 1}
				{" of "}
				{totalSteps}
			</text>
		</box>
	);
}
