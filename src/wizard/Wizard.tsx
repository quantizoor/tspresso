import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useState } from "react";
import {
	MultiSelect,
	SingleSelect,
	TextArea,
	TextInput,
} from "../components/index.ts";
import type { FieldDef, TemplateField } from "../types/index.ts";
import { getTemplateOptions, isFieldVisible } from "../utils/index.ts";
import { AnswersPanel } from "./AnswersPanel.tsx";
import { NavigationHints } from "./NavigationHints.tsx";
import { TemplatePreview } from "./TemplatePreview.tsx";

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
	const [hoveredOptionIndex, setHoveredOptionIndex] = useState(0);
	const [renderKey, setRenderKey] = useState(0);

	// Compute visible fields based on current answers
	const visibleFields = fields.filter((f) => isFieldVisible(f, answers));
	const currentField = visibleFields[stepIndex];

	// Back navigation via Escape
	useKeyboard((event) => {
		if (done) return;
		if (event.name === "escape" && stepIndex > 0) {
			setStepIndex((prev) => prev - 1);
			setHoveredOptionIndex(0);
			setRenderKey((prev) => prev + 1);
		}
	});

	function advance(key: string, value: string | string[]) {
		const next = { ...answers, [key]: value };

		// Prune answers for fields that are no longer visible with the new answers
		const nowVisible = fields.filter((f) => isFieldVisible(f, next));
		const nowVisibleKeys = new Set(nowVisible.map((f) => f.key));
		for (const k of Object.keys(next)) {
			if (!nowVisibleKeys.has(k)) {
				delete next[k];
			}
		}

		setAnswers(next);

		// Find the next visible field after this one
		const allVisible = fields.filter((f) => isFieldVisible(f, next));
		const remaining = allVisible.filter(
			(f) => !allVisible.slice(0, stepIndex + 1).includes(f),
		);

		if (remaining.length === 0) {
			setDone(true);
			onComplete?.(next);
		} else {
			const nextField = remaining[0];
			const nextIndex = nextField ? allVisible.indexOf(nextField) : -1;
			setStepIndex(nextIndex >= 0 ? nextIndex : stepIndex + 1);
			setHoveredOptionIndex(0);
			setRenderKey((prev) => prev + 1);
		}
	}

	function getInitialValue(field: FieldDef): string {
		const val = answers[field.key];
		if (typeof val === "string") return val;
		return "";
	}

	function getInitialIndex(field: FieldDef): number {
		const val = answers[field.key];
		if (typeof val !== "string") return 0;

		if (field.type === "select") {
			const idx = field.options.findIndex((o) => o.value === val);
			return idx >= 0 ? idx : 0;
		}
		if (field.type === "template") {
			const options = getTemplateOptions(field);
			const idx = options.findIndex((o) => o.value === val);
			return idx >= 0 ? idx : 0;
		}
		return 0;
	}

	function getInitialSelected(field: FieldDef): number[] {
		const val = answers[field.key];
		if (!Array.isArray(val) || field.type !== "multi-select") return [];
		return val
			.map((v) => field.options.findIndex((o) => o.value === v))
			.filter((i) => i >= 0);
	}

	function renderField(field: FieldDef) {
		switch (field.type) {
			case "text":
				return (
					<TextInput
						label={field.label}
						placeholder={field.placeholder ?? ""}
						focused={true}
						initialValue={getInitialValue(field)}
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
						initialValue={getInitialValue(field) || field.defaultValue || ""}
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
						initialIndex={getInitialIndex(field)}
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
						initialSelected={getInitialSelected(field)}
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
				const initial = getInitialIndex(field);
				return (
					<SingleSelect
						label={field.label}
						options={options.map((o) => ({
							label: o.label,
							description: o.description,
						}))}
						focused={true}
						initialIndex={initial}
						onSelect={(_index, option) => {
							const match = options.find((o) => o.label === option.label);
							advance(field.key, match?.value ?? option.label);
						}}
						onHighlight={(index) => {
							setHoveredOptionIndex(index);
						}}
					/>
				);
			}
		}
	}

	// Answered fields for the answers panel (all visible fields before current step)
	const answeredFields = visibleFields.slice(0, stepIndex);

	// Inner width of the main container: outer padding(1*2) + border(2) + inner padding(1*2) = 6
	const innerWidth = dimensions.width - 6;
	// Each side-by-side panel: subtract gap(1) then split in half
	const halfWidth = Math.floor((innerWidth - 1) / 2);

	return (
		<box
			flexDirection="column"
			width={dimensions.width}
			height={dimensions.height}
			padding={1}
		>
			{/* Title */}
			<box marginBottom={1}>
				<text>
					<b fg="#c084fc">{title}</b>
					{subtitle && <span fg="#555555">{` - ${subtitle}`}</span>}
				</text>
			</box>

			{/* Main container */}
			<box
				flexDirection="column"
				border={true}
				borderStyle="rounded"
				borderColor="#333333"
				padding={1}
				width="100%"
				flexGrow={1}
			>
				{!done && currentField && (
					<box flexDirection="column" flexGrow={1}>
						{/* Panel 1: Answers (scrollable, never shrinks) */}
						{answeredFields.length > 0 && (
							<box marginBottom={1} flexShrink={0}>
								<AnswersPanel
									fields={answeredFields}
									answers={answers}
									maxHeight={Math.min(
										answeredFields.length + 2,
										Math.floor(dimensions.height / 4),
									)}
								/>
							</box>
						)}

						{/* Panel 2 + 3: Input and Preview side-by-side for template fields */}
						{currentField.type === "template" ? (
							<box
								flexDirection="row"
								gap={1}
								flexGrow={1}
								flexShrink={1}
								flexWrap="no-wrap"
							>
								{/* Input (left half) */}
								<box
									key={renderKey}
									flexDirection="column"
									width={halfWidth}
									overflow="hidden"
								>
									{renderField(currentField)}
								</box>
								{/* Preview (right half, fills height) */}
								<box flexDirection="column" width={halfWidth} overflow="hidden">
									<TemplatePreview
										field={currentField as TemplateField}
										hoveredOptionIndex={hoveredOptionIndex}
									/>
								</box>
							</box>
						) : (
							<>
								{/* Input (full width for non-template fields) */}
								<box key={renderKey} flexDirection="column">
									{renderField(currentField)}
								</box>
								{/* Spacer pushes hints to bottom */}
								<box flexGrow={1} />
							</>
						)}

						{/* Navigation hints + step counter (never shrinks) */}
						<box flexShrink={0}>
							<NavigationHints
								currentField={currentField}
								stepIndex={stepIndex}
								totalSteps={visibleFields.length}
							/>
						</box>
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
