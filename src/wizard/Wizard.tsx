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
	const [visitedKeys] = useState<Set<string>>(() => {
		const first = fields.filter((f) => isFieldVisible(f, {}))[0];
		return new Set(first ? [first.key] : []);
	});

	// Compute visible fields based on current answers
	const visibleFields = fields.filter((f) => isFieldVisible(f, answers));
	const currentField = visibleFields[stepIndex];

	const isTextField =
		currentField?.type === "text" || currentField?.type === "textarea";

	function navigateTo(index: number, fieldKey?: string) {
		const key = fieldKey ?? visibleFields[index]?.key;
		if (key) visitedKeys.add(key);
		setStepIndex(index);
		setHoveredOptionIndex(0);
		setRenderKey((prev) => prev + 1);
	}

	// Navigation: Escape back, left/right arrows on non-text fields
	useKeyboard((event) => {
		if (done) {
			if (event.name === "escape" || event.name === "left") {
				setDone(false);
				navigateTo(visibleFields.length - 1);
			} else if (event.name === "return") {
				onComplete?.(answers);
			}
			return;
		}
		const isBack =
			event.name === "escape" || (!isTextField && event.name === "left");
		const isForward = !isTextField && event.name === "right";

		if (isBack && stepIndex > 0) {
			navigateTo(stepIndex - 1);
		} else if (isForward) {
			const next = visibleFields[stepIndex + 1];
			if (next && visitedKeys.has(next.key)) {
				navigateTo(stepIndex + 1);
			}
		}
	});

	function advance(key: string, value: string | string[]) {
		const next = { ...answers, [key]: value };

		// Prune answers and visited keys for fields no longer visible
		const nowVisible = fields.filter((f) => isFieldVisible(f, next));
		const nowVisibleKeys = new Set(nowVisible.map((f) => f.key));
		for (const k of Object.keys(next)) {
			if (!nowVisibleKeys.has(k)) {
				delete next[k];
			}
		}
		for (const k of visitedKeys) {
			if (!nowVisibleKeys.has(k)) {
				visitedKeys.delete(k);
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
			navigateTo(nextIndex >= 0 ? nextIndex : stepIndex + 1, nextField?.key);
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
						onChange={(value) => {
							setAnswers((prev) => ({ ...prev, [field.key]: value }));
						}}
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
							disabled: o.disabled,
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
							disabled: o.disabled,
						}))}
						focused={true}
						initialSelected={getInitialSelected(field)}
						onChange={(selectedIndices) => {
							const values = selectedIndices
								.map((i) => field.options[i]?.value)
								.filter((v): v is string => v != null);
							setAnswers((prev) => ({ ...prev, [field.key]: values }));
						}}
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
							disabled: o.disabled,
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

	const canGoBack = stepIndex > 0;
	const nextStepField = visibleFields[stepIndex + 1];
	const canGoForward =
		!done && !!nextStepField && visitedKeys.has(nextStepField.key);

	function goBack() {
		if (!canGoBack) return;
		navigateTo(stepIndex - 1);
	}

	function goForward() {
		if (!canGoForward) return;
		navigateTo(stepIndex + 1);
	}

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
						{visibleFields.length > 1 && (
							<box marginBottom={1} flexShrink={0}>
								<AnswersPanel
									fields={visibleFields}
									answers={answers}
									currentKey={currentField?.key}
									visitedKeys={visitedKeys}
									maxHeight={Math.min(
										visibleFields.length + 2,
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
								canGoBack={canGoBack}
								canGoForward={canGoForward}
								onPrevious={goBack}
								onNext={goForward}
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
						<box flexDirection="row" gap={3} marginTop={1}>
							{/* biome-ignore lint/a11y/noStaticElementInteractions: TUI click handler */}
							<box
								onMouseUp={() => {
									setDone(false);
									navigateTo(visibleFields.length - 1);
								}}
							>
								<text fg="#c084fc" attributes={1}>
									{"\u2190 Go Back"}
								</text>
							</box>
							{/* biome-ignore lint/a11y/noStaticElementInteractions: TUI click handler */}
							<box onMouseUp={() => onComplete?.(answers)}>
								<text fg="#22c55e" attributes={1}>
									{"Confirm (Enter) \u2713"}
								</text>
							</box>
						</box>
						<text fg="#444444">
							{"  Esc go back  \u2502  Enter confirm  \u2502  Ctrl+C exit"}
						</text>
					</box>
				)}
			</box>
		</box>
	);
}
