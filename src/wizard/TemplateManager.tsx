import type { TextareaRenderable } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useRef, useState } from "react";
import { SingleSelect, TextInput } from "../components/index.ts";
import { colors } from "../styles/colors.ts";
import type { TemplateField } from "../types/index.ts";
import { deleteTemplate, loadTemplates, saveTemplate } from "../utils/index.ts";

type Mode = "browse" | "create" | "naming" | "edit" | "confirm-delete";

interface EnrichedOption {
	label: string;
	value: string;
	content?: string;
	isCustom: boolean;
	isAddNew?: boolean;
	rawLabel?: string;
}

interface TemplateManagerProps {
	field: TemplateField;
	answers: Record<string, string | string[]>;
	halfWidth: number;
	stepIndex: number;
	totalSteps: number;
	canGoBack: boolean;
	canGoForward: boolean;
	onGoBack: () => void;
	onGoForward: () => void;
	onSelect: (value: string) => void;
	onModeChange: (mode: string) => void;
}

function buildOptions(field: TemplateField): EnrichedOption[] {
	const builtIn: EnrichedOption[] = field.options.map((o) => ({
		label: o.label,
		value: o.value,
		content: o.content,
		isCustom: false,
	}));
	const custom: EnrichedOption[] = loadTemplates(field.storeName).map((t) => ({
		label: `✦ ${t.label}`,
		value: t.label,
		content: t.content,
		isCustom: true,
		rawLabel: t.label,
	}));
	const addNew: EnrichedOption = {
		label: "＋ Add new",
		value: "__add_new__",
		isCustom: false,
		isAddNew: true,
	};
	return [...builtIn, ...custom, addNew];
}

export function TemplateManager({
	field,
	halfWidth,
	stepIndex,
	totalSteps,
	canGoBack,
	canGoForward,
	onGoBack,
	onGoForward,
	onSelect,
	onModeChange,
}: TemplateManagerProps) {
	const [mode, setMode] = useState<Mode>("browse");
	const [highlightIndex, setHighlightIndex] = useState(0);
	const [draftName, setDraftName] = useState("");
	const [nameError, setNameError] = useState("");
	const [listKey, setListKey] = useState(0);
	const [options, setOptions] = useState(() => buildOptions(field));
	const [editTarget, setEditTarget] = useState<string | null>(null);
	const [draftContent, setDraftContent] = useState("");

	const textareaRef = useRef<TextareaRenderable>(null);

	function changeMode(next: Mode) {
		setMode(next);
		onModeChange(next);
	}

	function refreshOptions(targetIndex?: number) {
		const newOptions = buildOptions(field);
		setOptions(newOptions);
		if (targetIndex !== undefined) {
			setHighlightIndex(
				Math.min(targetIndex, Math.max(0, newOptions.length - 1)),
			);
		}
		setListKey((prev) => prev + 1);
	}

	// Keyboard handler dispatching on mode
	useKeyboard((event) => {
		if (mode === "browse") {
			const currentOption = options[highlightIndex];
			if (!currentOption) return;

			// Custom template actions
			if (currentOption.isCustom) {
				if (event.name === "e") {
					event.preventDefault();
					setEditTarget(currentOption.rawLabel ?? null);
					changeMode("edit");
					return;
				}
				if (event.name === "d") {
					event.preventDefault();
					changeMode("confirm-delete");
					return;
				}
				if (event.name === "c") {
					event.preventDefault();
					duplicateTemplate(currentOption);
					return;
				}
			}

			// Navigation keys for wizard
			if (event.name === "escape" || event.name === "left") {
				if (canGoBack) {
					onGoBack();
				}
				return;
			}
			if (event.name === "right") {
				if (canGoForward) {
					onGoForward();
				}
				return;
			}
			return;
		}

		if (mode === "create" || mode === "edit") {
			if (event.ctrl && event.name === "s") {
				event.preventDefault();
				const content = textareaRef.current?.plainText?.trim() ?? "";
				if (!content) return;

				if (mode === "create") {
					setDraftContent(content);
					setDraftName("");
					setNameError("");
					changeMode("naming");
				} else {
					// Edit mode: save in-place
					if (editTarget) {
						saveTemplate(field.storeName, {
							label: editTarget,
							content,
						});
						refreshOptions(highlightIndex);
					}
					setEditTarget(null);
					changeMode("browse");
				}
				return;
			}
			if (event.name === "escape") {
				event.preventDefault();
				setEditTarget(null);
				changeMode("browse");
				return;
			}
			// All other keys go to the textarea
			return;
		}

		if (mode === "naming") {
			if (event.name === "escape") {
				event.preventDefault();
				// Go back to create mode, preserving draft content
				changeMode("create");
				return;
			}
			// Enter handled by TextInput's onSubmit
			return;
		}

		if (mode === "confirm-delete") {
			if (event.name === "y") {
				event.preventDefault();
				const currentOption = options[highlightIndex];
				if (currentOption?.rawLabel) {
					deleteTemplate(field.storeName, currentOption.rawLabel);
					const newIndex = Math.max(0, highlightIndex - 1);
					refreshOptions(newIndex);
				}
				changeMode("browse");
				return;
			}
			if (event.name === "n" || event.name === "escape") {
				event.preventDefault();
				changeMode("browse");
				return;
			}
			return;
		}
	});

	function duplicateTemplate(option: EnrichedOption) {
		if (!option.rawLabel || !option.content) return;
		const existingLabels = new Set(
			loadTemplates(field.storeName).map((t) => t.label.toLowerCase()),
		);
		for (const o of field.options) {
			existingLabels.add(o.label.toLowerCase());
		}

		let copyName = `Copy of ${option.rawLabel}`;
		if (existingLabels.has(copyName.toLowerCase())) {
			let counter = 2;
			while (
				existingLabels.has(
					`Copy of ${option.rawLabel} (${counter})`.toLowerCase(),
				)
			) {
				counter++;
			}
			copyName = `Copy of ${option.rawLabel} (${counter})`;
		}

		saveTemplate(field.storeName, { label: copyName, content: option.content });
		const newOptions = buildOptions(field);
		const newIndex = newOptions.findIndex((o) => o.rawLabel === copyName);
		refreshOptions(newIndex >= 0 ? newIndex : highlightIndex);
	}

	function handleNameSubmit(name: string) {
		const trimmed = name.trim();
		if (!trimmed) {
			setNameError("Name cannot be empty");
			return;
		}

		// Check for duplicates (case-insensitive) against built-in and custom
		const allLabels = [
			...field.options.map((o) => o.label.toLowerCase()),
			...loadTemplates(field.storeName).map((t) => t.label.toLowerCase()),
		];
		if (allLabels.includes(trimmed.toLowerCase())) {
			setNameError("A template with this name already exists");
			return;
		}

		saveTemplate(field.storeName, { label: trimmed, content: draftContent });
		const newOptions = buildOptions(field);
		const newIndex = newOptions.findIndex((o) => o.rawLabel === trimmed);
		refreshOptions(newIndex >= 0 ? newIndex : highlightIndex);
		changeMode("browse");
	}

	function handleSelectInBrowse(_index: number, option: { label: string }) {
		const match = options.find((o) => o.label === option.label);
		if (!match) return;

		if (match.isAddNew) {
			changeMode("create");
			return;
		}

		// Submit value to wizard
		onSelect(match.value);
	}

	// Right panel content
	function renderRightPanel() {
		if (mode === "create") {
			return (
				<box
					flexDirection="column"
					border={true}
					borderStyle="rounded"
					borderColor={colors.accent}
					width="100%"
					flexGrow={1}
					title=" New template "
				>
					<textarea
						ref={textareaRef}
						focused={true}
						placeholder="Enter template content..."
						placeholderColor={colors.hint}
						textColor={colors.textActive}
						backgroundColor={colors.bgFocused}
						focusedTextColor={colors.textActive}
						focusedBackgroundColor={colors.bgFocused}
						cursorColor={colors.accent}
						selectionBg={colors.accent}
						selectionFg={colors.textActive}
						wrapMode="word"
						width="100%"
						flexGrow={1}
					/>
				</box>
			);
		}

		if (mode === "naming") {
			return (
				<box flexDirection="column" gap={1}>
					<TextInput
						label="Template name"
						placeholder="Enter a name for the template"
						focused={true}
						initialValue={draftName}
						onChange={(v) => {
							setDraftName(v);
							setNameError("");
						}}
						onSubmit={handleNameSubmit}
					/>
					{nameError && <text fg="#ef4444">{`  \u2717 ${nameError}`}</text>}
				</box>
			);
		}

		if (mode === "edit") {
			const currentOption = options[highlightIndex];
			const editContent = currentOption?.content ?? "";
			const editLabel = editTarget ?? currentOption?.rawLabel ?? "";
			return (
				<box
					flexDirection="column"
					border={true}
					borderStyle="rounded"
					borderColor={colors.accent}
					width="100%"
					flexGrow={1}
					title={` Edit: ${editLabel} `}
				>
					<textarea
						ref={textareaRef}
						focused={true}
						initialValue={editContent}
						placeholderColor={colors.hint}
						textColor={colors.textActive}
						backgroundColor={colors.bgFocused}
						focusedTextColor={colors.textActive}
						focusedBackgroundColor={colors.bgFocused}
						cursorColor={colors.accent}
						selectionBg={colors.accent}
						selectionFg={colors.textActive}
						wrapMode="word"
						width="100%"
						flexGrow={1}
					/>
				</box>
			);
		}

		if (mode === "confirm-delete") {
			const currentOption = options[highlightIndex];
			const deleteLabel = currentOption?.rawLabel ?? "";
			return (
				<box
					flexDirection="column"
					border={true}
					borderStyle="rounded"
					borderColor="#ef4444"
					paddingX={1}
					width="100%"
				>
					<text>
						<b fg="#ef4444">{`Delete "${deleteLabel}"?`}</b>
					</text>
					<text fg={colors.textDim}>{""}</text>
					<text fg={colors.textDim}>
						{"This will permanently remove this template."}
					</text>
					<text fg={colors.textDim}>{""}</text>
					<text>
						<span fg={colors.hint}>{"Press "}</span>
						<b fg="#ef4444">{"y"}</b>
						<span fg={colors.hint}>{" to confirm, "}</span>
						<b fg={colors.textDim}>{"n"}</b>
						<span fg={colors.hint}>{" to cancel"}</span>
					</text>
				</box>
			);
		}

		// Browse mode: preview
		const currentOption = options[highlightIndex];
		if (currentOption?.isAddNew) {
			return (
				<box
					flexDirection="column"
					border={true}
					borderStyle="rounded"
					borderColor={colors.border}
					paddingX={1}
					width="100%"
					flexGrow={1}
					title=" Preview "
				>
					<text fg={colors.hint}>
						{"Create a custom template that will be saved for future use."}
					</text>
				</box>
			);
		}

		const content = currentOption?.content;
		if (!content) {
			return (
				<box
					flexDirection="column"
					border={true}
					borderStyle="rounded"
					borderColor={colors.border}
					paddingX={1}
					width="100%"
					flexGrow={1}
					title=" Preview "
				>
					<text fg={colors.hint}>{"No preview available"}</text>
				</box>
			);
		}

		const previewLines = content
			.split("\n")
			.map((line, idx) => ({ line, key: `${idx}:${line}` }));
		return (
			<scrollbox
				flexDirection="row"
				border={true}
				borderStyle="rounded"
				borderColor={colors.border}
				title=" Preview "
				paddingX={1}
				width="100%"
				flexGrow={1}
				scrollY={true}
			>
				{previewLines.map(({ line, key }) => (
					<text key={key} fg={colors.textDim}>
						{line}
					</text>
				))}
			</scrollbox>
		);
	}

	// Hints bar
	function renderHints() {
		const hints: string[] = [];
		const currentOption = options[highlightIndex];

		if (mode === "browse") {
			if (canGoBack) hints.push("Esc back");
			hints.push("\u2191\u2193 navigate");
			hints.push("Enter select");
			if (currentOption?.isCustom) {
				hints.push("e edit");
				hints.push("d delete");
				hints.push("c duplicate");
			}
		} else if (mode === "create" || mode === "edit") {
			hints.push("Ctrl+S save");
			hints.push("Esc cancel");
		} else if (mode === "naming") {
			hints.push("Enter confirm");
			hints.push("Esc back");
		} else if (mode === "confirm-delete") {
			hints.push("y confirm");
			hints.push("n cancel");
		}

		const prevLabel = "Previous (\u2190)";
		const nextLabel = "Next (\u2192)";
		const showNav = mode === "browse";

		return (
			<box flexDirection="row" gap={0} marginTop={1}>
				<box flexDirection="row" gap={3} flexGrow={1}>
					{showNav && (
						<>
							{/* biome-ignore lint/a11y/noStaticElementInteractions: TUI click handler */}
							<box onMouseUp={canGoBack ? onGoBack : undefined}>
								<text
									fg={canGoBack ? colors.accent : colors.border}
									attributes={canGoBack ? 1 : 0}
								>
									{prevLabel}
								</text>
							</box>
							{/* biome-ignore lint/a11y/noStaticElementInteractions: TUI click handler */}
							<box onMouseUp={canGoForward ? onGoForward : undefined}>
								<text
									fg={canGoForward ? colors.accent : colors.border}
									attributes={canGoForward ? 1 : 0}
								>
									{nextLabel}
								</text>
							</box>
						</>
					)}
				</box>
				<text fg={colors.hint}>
					{hints.join("  \u2502  ")}
					{"  "}
				</text>
				<text fg={colors.disabled}>
					{"Step "}
					{stepIndex + 1}
					{" of "}
					{totalSteps}
				</text>
			</box>
		);
	}

	return (
		<box flexDirection="column" flexGrow={1}>
			<box
				flexDirection="row"
				gap={1}
				flexGrow={1}
				flexShrink={1}
				flexWrap="no-wrap"
			>
				{/* Left panel: SingleSelect */}
				<box flexDirection="column" width={halfWidth} overflow="hidden">
					<SingleSelect
						key={listKey}
						label={field.label}
						options={options.map((o) => ({
							label: o.label,
						}))}
						focused={mode === "browse"}
						initialIndex={highlightIndex}
						onSelect={handleSelectInBrowse}
						onHighlight={(index) => {
							setHighlightIndex(index);
						}}
					/>
				</box>
				{/* Right panel: varies by mode */}
				<box flexDirection="column" width={halfWidth} overflow="hidden">
					{renderRightPanel()}
				</box>
			</box>
			{/* Hints bar */}
			<box flexShrink={0}>{renderHints()}</box>
		</box>
	);
}
