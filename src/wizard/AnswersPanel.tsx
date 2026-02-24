import type { FieldDef } from "../types/index.ts";

interface AnswersPanelProps {
	fields: readonly FieldDef[];
	answers: Record<string, string | string[]>;
	currentKey?: string;
	visitedKeys?: Set<string>;
	maxHeight?: number;
}

export function AnswersPanel({
	fields,
	answers,
	currentKey,
	visitedKeys,
	maxHeight = 8,
}: AnswersPanelProps) {
	// Show fields that have been visited or have an answer
	const visible = fields.filter(
		(f) =>
			answers[f.key] !== undefined ||
			f.key === currentKey ||
			visitedKeys?.has(f.key),
	);
	if (visible.length === 0) return null;

	return (
		<scrollbox
			key={currentKey}
			flexDirection="row"
			border={true}
			borderStyle="rounded"
			borderColor="#333333"
			title=" Answers "
			paddingX={1}
			width="100%"
			maxHeight={maxHeight}
			scrollY={true}
			stickyScroll={true}
			stickyStart="bottom"
		>
			{visible.map((f) => {
				const isCurrent = f.key === currentKey;
				const val = answers[f.key];
				const display = Array.isArray(val)
					? val.length > 0
						? val.join(", ")
						: "none"
					: (val ?? "");
				return (
					<text key={f.key}>
						<span fg={isCurrent ? "#c084fc" : "#555555"}>
							{isCurrent ? "> " : "  "}
						</span>
						<span fg={isCurrent ? "#c084fc" : "#888888"}>{f.label}: </span>
						{isCurrent ? (
							<b fg="#c084fc">{display || "..."}</b>
						) : display ? (
							<b fg="#22c55e">{display}</b>
						) : (
							<span fg="#555555">...</span>
						)}
					</text>
				);
			})}
		</scrollbox>
	);
}
