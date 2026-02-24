import {
	MultiSelect,
	SingleSelect,
	TextArea,
	TextInput,
} from "../components/index.ts";
import type { FieldDef } from "../types/index.ts";

interface FieldRendererProps {
	field: FieldDef;
	answers: Record<string, string | string[]>;
	terminalHeight: number;
	onSubmitAnswer: (key: string, value: string | string[]) => void;
	onAnswerChange: (key: string, value: string | string[]) => void;
	onHighlight?: (index: number) => void;
}

function getInitialValue(
	field: FieldDef,
	answers: Record<string, string | string[]>,
): string {
	const val = answers[field.key];
	if (typeof val === "string") return val;
	return "";
}

function getInitialIndex(
	field: FieldDef,
	answers: Record<string, string | string[]>,
): number {
	const val = answers[field.key];
	if (typeof val !== "string") return 0;

	if (field.type === "select") {
		const idx = field.options.findIndex((o) => o.value === val);
		return idx >= 0 ? idx : 0;
	}
	return 0;
}

function getInitialSelected(
	field: FieldDef,
	answers: Record<string, string | string[]>,
): number[] {
	const val = answers[field.key];
	if (!Array.isArray(val) || field.type !== "multi-select") return [];
	return val
		.map((v) => field.options.findIndex((o) => o.value === v))
		.filter((i) => i >= 0);
}

export function FieldRenderer({
	field,
	answers,
	terminalHeight,
	onSubmitAnswer,
	onAnswerChange,
}: FieldRendererProps) {
	switch (field.type) {
		case "text":
			return (
				<TextInput
					label={field.label}
					placeholder={field.placeholder ?? ""}
					focused={true}
					initialValue={getInitialValue(field, answers)}
					onChange={(value) => {
						onAnswerChange(field.key, value);
					}}
					onSubmit={(value) => {
						if (!value && field.optional) {
							onSubmitAnswer(field.key, "");
						} else if (value) {
							onSubmitAnswer(field.key, value);
						} else if (field.defaultValue) {
							onSubmitAnswer(field.key, field.defaultValue);
						}
					}}
				/>
			);

		case "textarea":
			return (
				<TextArea
					label={field.label}
					placeholder={field.placeholder ?? ""}
					initialValue={
						getInitialValue(field, answers) || field.defaultValue || ""
					}
					focused={true}
					height={field.height ?? Math.max(8, terminalHeight - 16)}
					onSubmit={() => {
						onSubmitAnswer(field.key, field.defaultValue ?? "");
					}}
				/>
			);

		case "select":
			return (
				<SingleSelect
					label={field.label}
					options={field.options.map((o) => ({
						label: o.label,
						description: o.description,
						disabled: o.disabled,
					}))}
					focused={true}
					initialIndex={getInitialIndex(field, answers)}
					onSelect={(_index, option) => {
						const match = field.options.find((o) => o.label === option.label);
						onSubmitAnswer(field.key, match?.value ?? option.label);
					}}
				/>
			);

		case "multi-select":
			return (
				<MultiSelect
					label={field.label}
					options={field.options.map((o) => ({
						label: o.label,
						description: o.description,
						disabled: o.disabled,
					}))}
					focused={true}
					initialSelected={getInitialSelected(field, answers)}
					onChange={(selectedIndices) => {
						const values = selectedIndices
							.map((i) => field.options[i]?.value)
							.filter((v): v is string => v != null);
						onAnswerChange(field.key, values);
					}}
					onSubmit={(selectedIndices) => {
						const values = selectedIndices
							.map((i) => field.options[i]?.value)
							.filter((v): v is string => v != null);
						onSubmitAnswer(field.key, values);
					}}
				/>
			);

		case "template":
			// Template fields are handled by TemplateManager in Wizard.tsx
			return null;
	}
}
