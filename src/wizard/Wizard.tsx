import { useTerminalDimensions } from "@opentui/react";
import { useState } from "react";
import {
	MultiSelect,
	SingleSelect,
	TextArea,
	TextInput,
} from "../components/index.ts";
import type { FieldDef } from "../types/index.ts";
import { getTemplateOptions, isFieldVisible } from "../utils/index.ts";

interface WizardProps {
	readonly title: string;
	readonly subtitle?: string;
	readonly fields: readonly FieldDef[];
	readonly onComplete?: (answers: Record<string, string | string[]>) => void;
}

export function Wizard({ title, subtitle, fields, onComplete }: WizardProps) {
	const dimensions = useTerminalDimensions();
	const [stepIndex, setStepIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
	const [done, setDone] = useState(false);

	// Compute visible fields based on current answers
	const visibleFields = fields.filter((f) => isFieldVisible(f, answers));
	const currentField = visibleFields[stepIndex];

	function advance(key: string, value: string | string[]) {
		const next = { ...answers, [key]: value };
		setAnswers(next);

		// Find the next visible field after this one
		const remaining = fields.filter(
			(f) =>
				isFieldVisible(f, next) &&
				!visibleFields.slice(0, stepIndex + 1).includes(f),
		);

		if (remaining.length === 0) {
			setDone(true);
			onComplete?.(next);
		} else {
			// Recalculate visible fields with updated answers and find the index
			const allVisible = fields.filter((f) => isFieldVisible(f, next));
			const nextField = remaining[0];
			const nextIndex = nextField ? allVisible.indexOf(nextField) : -1;
			setStepIndex(nextIndex >= 0 ? nextIndex : stepIndex + 1);
		}
	}

	function renderField(field: FieldDef) {
		switch (field.type) {
			case "text":
				return (
					<TextInput
						label={field.label}
						placeholder={field.placeholder ?? ""}
						focused={true}
						onSubmit={(value) => {
							if (!value && field.optional) {
								advance(field.key, "");
							} else if (value) {
								advance(field.key, value);
							} else if (field.defaultValue) {
								advance(field.key, field.defaultValue);
							}
						}}
					/>
				);

			case "textarea":
				return (
					<TextArea
						label={field.label}
						placeholder={field.placeholder ?? ""}
						initialValue={field.defaultValue ?? ""}
						focused={true}
						height={field.height ?? Math.max(8, dimensions.height - 16)}
						onSubmit={() => {
							advance(field.key, field.defaultValue ?? "");
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
						}))}
						focused={true}
						onSelect={(_index, option) => {
							const match = field.options.find((o) => o.label === option.label);
							advance(field.key, match?.value ?? option.label);
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
						}))}
						focused={true}
						onSubmit={(selectedIndices) => {
							const values = selectedIndices
								.map((i) => field.options[i]?.value)
								.filter((v): v is string => v != null);
							advance(field.key, values);
						}}
					/>
				);

			case "template": {
				const options = getTemplateOptions(field);
				return (
					<SingleSelect
						label={field.label}
						options={options.map((o) => ({
							label: o.label,
							description: o.description,
						}))}
						focused={true}
						onSelect={(_index, option) => {
							const match = options.find((o) => o.label === option.label);
							advance(field.key, match?.value ?? option.label);
						}}
					/>
				);
			}
		}
	}

	// Summary row component
	function Summary() {
		const answered = visibleFields.slice(0, stepIndex);
		if (answered.length === 0) return null;
		return (
			<box flexDirection="column">
				{answered.map((f) => {
					const val = answers[f.key];
					const display = Array.isArray(val)
						? val.length > 0
							? val.join(", ")
							: "none"
						: (val ?? "");
					return (
						<text key={f.key} fg="#555555">
							{"  "}
							{f.label}
							{": "}
							<b fg="#22c55e">{display}</b>
						</text>
					);
				})}
			</box>
		);
	}

	return (
		<box
			flexDirection="column"
			width={dimensions.width}
			height={dimensions.height}
			padding={1}
		>
			<box marginBottom={1}>
				<text>
					<b fg="#c084fc">{title}</b>
					{subtitle && <span fg="#555555">{` - ${subtitle}`}</span>}
				</text>
			</box>

			<box
				flexDirection="column"
				gap={1}
				border={true}
				borderStyle="rounded"
				borderColor="#333333"
				padding={1}
				width={Math.min(dimensions.width - 2, 72)}
				flexGrow={1}
			>
				{!done && currentField && (
					<box key={currentField.key} flexDirection="column" gap={1}>
						<Summary />
						{renderField(currentField)}
					</box>
				)}

				{done && (
					<box flexDirection="column" gap={1}>
						<text>
							<b fg="#22c55e">{" \u2713 "}</b>
							<b>{"All done!"}</b>
						</text>
						<box
							flexDirection="column"
							border={true}
							borderStyle="rounded"
							borderColor="#333333"
							paddingX={1}
						>
							{visibleFields.map((f) => {
								const val = answers[f.key];
								const display = Array.isArray(val)
									? val.length > 0
										? val.join(", ")
										: "none"
									: (val ?? "");
								return (
									<text key={f.key}>
										<span fg="#888888">{`${f.label}: `.padEnd(20)}</span>
										<b fg="#ffffff">{display}</b>
									</text>
								);
							})}
						</box>
						<text fg="#555555">
							{"  Press "}
							<b fg="#dddddd">ctrl+c</b>
							{" to exit"}
						</text>
					</box>
				)}
			</box>
		</box>
	);
}
