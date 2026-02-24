import type { FieldDef } from "../types/index.ts";

interface NavigationHintsProps {
	currentField: FieldDef;
	stepIndex: number;
	totalSteps: number;
}

export function NavigationHints({
	currentField,
	stepIndex,
	totalSteps,
}: NavigationHintsProps) {
	const hints: string[] = [];

	if (stepIndex > 0) {
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

	return (
		<box flexDirection="row" gap={0} marginTop={1}>
			<text fg="#555555">
				{"  "}
				{hints.join("  \u2502  ")}
			</text>
			<text fg="#444444">
				{"  Step "}
				{stepIndex + 1}
				{" of "}
				{totalSteps}
			</text>
		</box>
	);
}
