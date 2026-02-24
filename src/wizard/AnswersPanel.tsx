import type { FieldDef } from "../types/index.ts";

interface AnswersPanelProps {
	fields: readonly FieldDef[];
	answers: Record<string, string | string[]>;
	maxHeight?: number;
}

export function AnswersPanel({
	fields,
	answers,
	maxHeight = 8,
}: AnswersPanelProps) {
	const answered = fields.filter((f) => answers[f.key] !== undefined);
	if (answered.length === 0) return null;

	return (
		<scrollbox
			flexDirection="column"
			border={true}
			borderStyle="rounded"
			borderColor="#333333"
			title=" Answers "
			paddingX={1}
			width="100%"
			maxHeight={maxHeight}
			scrollY={true}
			stickyScroll={true}
		>
			{answered.map((f) => {
				const val = answers[f.key];
				const display = Array.isArray(val)
					? val.length > 0
						? val.join(", ")
						: "none"
					: (val ?? "");
				return (
					<text key={f.key}>
						<span fg="#888888">{f.label}: </span>
						<b fg="#22c55e">{display}</b>
					</text>
				);
			})}
		</scrollbox>
	);
}
