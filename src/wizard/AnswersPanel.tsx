import { colors } from "../styles/colors.ts";
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
			borderColor={colors.border}
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
						<span fg={isCurrent ? colors.accent : colors.hint}>
							{isCurrent ? "> " : "  "}
						</span>
						<span fg={isCurrent ? colors.accent : colors.label}>
							{f.label}:{" "}
						</span>
						{isCurrent ? (
							<b fg={colors.accent}>{display || "..."}</b>
						) : display ? (
							<b fg={colors.success}>{display}</b>
						) : (
							<span fg={colors.hint}>...</span>
						)}
					</text>
				);
			})}
		</scrollbox>
	);
}
