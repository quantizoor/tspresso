import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useRef, useState } from "react";
import { colors } from "../styles/colors.ts";
import type { FieldDef, TemplateField } from "../types/index.ts";
import { isFieldVisible } from "../utils/index.ts";
import { AnswersPanel } from "./AnswersPanel.tsx";
import { FieldRenderer } from "./FieldRenderer.tsx";
import { NavigationHints } from "./NavigationHints.tsx";
import { TemplateManager } from "./TemplateManager.tsx";

interface WizardProps {
	readonly title: string;
	readonly subtitle?: string;
	readonly fields: readonly FieldDef[];
	readonly onComplete?: (answers: Record<string, string | string[]>) => void;
}

export function Wizard({ fields, onComplete }: WizardProps) {
	const dimensions = useTerminalDimensions();
	const [stepIndex, setStepIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
	const [done, setDone] = useState(false);
	const [fieldMountKey, setFieldMountKey] = useState(0);
	const templateModeRef = useRef("browse");
	const [visitedKeys, setVisitedKeys] = useState<Set<string>>(() => {
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
		if (key) setVisitedKeys((prev) => new Set(prev).add(key));
		setStepIndex(index);
		setFieldMountKey((prev) => prev + 1);
	}

	// Navigation: Escape back, left/right arrows on non-text fields
	useKeyboard((event) => {
		// Let TemplateManager handle its own keyboard when not in browse mode
		if (
			currentField?.type === "template" &&
			templateModeRef.current !== "browse"
		) {
			return;
		}

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

	function submitFieldAnswer(key: string, value: string | string[]) {
		const next = { ...answers, [key]: value };

		// Compute new visible fields based on updated answers
		const allVisible = fields.filter((f) => isFieldVisible(f, next));
		const allVisibleKeys = new Set(allVisible.map((f) => f.key));

		// Prune answers for fields no longer visible
		for (const k of Object.keys(next)) {
			if (!allVisibleKeys.has(k)) {
				delete next[k];
			}
		}

		// Clear visited keys for fields after the current one (path may have changed)
		const currentPos = allVisible.findIndex((f) => f.key === key);
		const keysUpToCurrent = new Set(
			allVisible.slice(0, currentPos + 1).map((f) => f.key),
		);
		setVisitedKeys((prev) => {
			const updated = new Set<string>();
			for (const k of prev) {
				if (keysUpToCurrent.has(k)) {
					updated.add(k);
				}
			}
			return updated;
		});

		setAnswers(next);

		// Find the next visible field after this one
		const remaining = allVisible.slice(currentPos + 1);

		if (remaining.length === 0) {
			setDone(true);
			onComplete?.(next);
		} else {
			const nextField = remaining[0];
			const nextIndex = nextField ? allVisible.indexOf(nextField) : -1;
			navigateTo(nextIndex >= 0 ? nextIndex : currentPos + 1, nextField?.key);
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
			paddingBottom={1}
		>
			{/* Main container */}
			<box
				flexDirection="column"
				border={true}
				borderStyle="rounded"
				borderColor={colors.border}
				padding={1}
				paddingBottom={0}
				width="100%"
				flexGrow={1}
				title="tspresso - Project Setup Wizard"
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

						{/* Template fields use TemplateManager with its own layout + hints */}
						{currentField.type === "template" ? (
							<TemplateManager
								key={fieldMountKey}
								field={currentField as TemplateField}
								answers={answers}
								halfWidth={halfWidth}
								stepIndex={stepIndex}
								totalSteps={visibleFields.length}
								canGoBack={canGoBack}
								canGoForward={canGoForward}
								onGoBack={goBack}
								onGoForward={goForward}
								onSelect={(value) => submitFieldAnswer(currentField.key, value)}
								onModeChange={(m) => {
									templateModeRef.current = m;
								}}
							/>
						) : (
							<>
								{/* Input (full width for non-template fields) */}
								<box key={fieldMountKey} flexDirection="column">
									<FieldRenderer
										field={currentField}
										answers={answers}
										terminalHeight={dimensions.height}
										onSubmitAnswer={submitFieldAnswer}
										onAnswerChange={(key, value) => {
											setAnswers((prev) => ({ ...prev, [key]: value }));
										}}
									/>
								</box>
								{/* Spacer pushes hints to bottom */}
								<box flexGrow={1} />
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
							</>
						)}
					</box>
				)}

				{done && (
					<box flexDirection="column" gap={1}>
						<text>
							<b fg={colors.success}>{" \u2713 "}</b>
							<b>{"All done!"}</b>
						</text>
						<box
							flexDirection="column"
							border={true}
							borderStyle="rounded"
							borderColor={colors.border}
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
										<span fg={colors.label}>{`${f.label}: `.padEnd(20)}</span>
										<b fg={colors.textActive}>{display}</b>
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
								<text fg={colors.accent} attributes={1}>
									{"\u2190 Go Back"}
								</text>
							</box>
							{/* biome-ignore lint/a11y/noStaticElementInteractions: TUI click handler */}
							<box onMouseUp={() => onComplete?.(answers)}>
								<text fg={colors.success} attributes={1}>
									{"Confirm (Enter) \u2713"}
								</text>
							</box>
						</box>
						<text fg={colors.disabled}>
							{"  Esc go back  \u2502  Enter confirm  \u2502  Ctrl+C exit"}
						</text>
					</box>
				)}
			</box>
		</box>
	);
}
