import type { TemplateField } from "../types/index.ts";
import { getTemplateOptions, loadTemplates } from "../utils/index.ts";

interface TemplatePreviewProps {
	field: TemplateField;
	hoveredOptionIndex: number;
}

export function TemplatePreview({
	field,
	hoveredOptionIndex,
}: TemplatePreviewProps) {
	const allOptions = getTemplateOptions(field);
	const option = allOptions[hoveredOptionIndex];
	if (!option) return null;

	// Try to find content: first from custom templates, then from built-in options
	const customTemplates = loadTemplates(field.storeName);
	const customMatch = customTemplates.find((t) => t.label === option.label);

	let content: string | undefined;
	if (customMatch) {
		content = customMatch.content;
	} else {
		const builtIn = field.options[hoveredOptionIndex];
		content = builtIn?.content;
	}

	if (!content) return null;

	const lines = content.split("\n");

	return (
		<scrollbox
			flexDirection="row"
			border={true}
			borderStyle="rounded"
			borderColor="#333333"
			title=" Preview "
			paddingX={1}
			width="100%"
			flexGrow={1}
			scrollY={true}
		>
			{lines.map((line, i) => (
				<text key={`${option.label}-${i}`} fg="#aaaaaa">
					{line}
				</text>
			))}
		</scrollbox>
	);
}
