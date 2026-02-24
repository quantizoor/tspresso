import type { ScrollBoxRenderable } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useEffect, useRef, useState } from "react";
import { colors } from "../../styles/colors.ts";
import { findNextEnabled } from "../../utils/navigation.ts";
import type { InputOption } from "./types.ts";

interface MultiSelectProps {
	label: string;
	options: InputOption[];
	focused?: boolean;
	initialSelected?: number[];
	onSubmit?: (selected: number[]) => void;
	onChange?: (selected: number[]) => void;
}

export function MultiSelect({
	label,
	options,
	focused = false,
	initialSelected = [],
	onSubmit,
	onChange,
}: MultiSelectProps) {
	const [cursorIndex, setCursorIndex] = useState(0);
	const [selected, setSelected] = useState<Set<number>>(
		new Set(initialSelected),
	);
	const scrollRef = useRef<ScrollBoxRenderable>(null);

	useEffect(() => {
		const sb = scrollRef.current;
		if (!sb) return;
		const viewportHeight = sb.viewport.height;
		const scrollTop = sb.scrollTop;
		if (cursorIndex < scrollTop) {
			sb.scrollTo({ x: 0, y: cursorIndex });
		} else if (cursorIndex >= scrollTop + viewportHeight) {
			sb.scrollTo({ x: 0, y: cursorIndex - viewportHeight + 1 });
		}
	}, [cursorIndex]);

	useKeyboard((event) => {
		if (!focused) return;
		if (event.name === "up" || event.name === "k") {
			setCursorIndex((prev) => findNextEnabled(options, prev, -1));
		} else if (event.name === "down" || event.name === "j") {
			setCursorIndex((prev) => findNextEnabled(options, prev, 1));
		} else if (event.name === "space") {
			if (options[cursorIndex]?.disabled) return;
			setSelected((prev) => {
				const next = new Set(prev);
				if (next.has(cursorIndex)) {
					next.delete(cursorIndex);
				} else {
					next.add(cursorIndex);
				}
				onChange?.([...next].sort());
				return next;
			});
		} else if (event.name === "a") {
			setSelected((prev) => {
				const enabledIndices = options
					.map((o, i) => (!o.disabled ? i : -1))
					.filter((i) => i >= 0);
				const allEnabled = enabledIndices.every((i) => prev.has(i));
				if (allEnabled) {
					const next = new Set(prev);
					for (const i of enabledIndices) next.delete(i);
					onChange?.([...next].sort());
					return next;
				}
				const next = new Set(prev);
				for (const i of enabledIndices) next.add(i);
				onChange?.([...next].sort());
				return next;
			});
		} else if (event.name === "return") {
			onSubmit?.([...selected].sort());
		}
	});

	return (
		<box flexDirection="column" gap={0}>
			<box flexShrink={0}>
				<text>
					<b fg={colors.accent}>{" ? "}</b>
					<b>{label}</b>
					<span fg={colors.hint}>
						{" (space to toggle, a to toggle all, enter to confirm)"}
					</span>
				</text>
			</box>
			<scrollbox
				ref={scrollRef}
				flexDirection="row"
				border={true}
				borderStyle="rounded"
				borderColor={focused ? colors.accent : colors.hint}
				paddingX={1}
				width="100%"
			>
				{options.map((option, i) => {
					const isAtCursor = i === cursorIndex;
					const isChecked = selected.has(i);
					if (option.disabled) {
						return (
							<box key={`opt-${option.label}`} flexDirection="row" gap={1}>
								<text fg={colors.disabled}> </text>
								<text fg={colors.disabled}>{"[-]"}</text>
								<text fg={colors.disabled}>{option.label} (coming soon)</text>
							</box>
						);
					}
					return (
						<box key={`opt-${option.label}`} flexDirection="row" gap={1}>
							<text fg={isAtCursor && focused ? colors.accent : colors.hint}>
								{isAtCursor && focused ? ">" : " "}
							</text>
							<text
								fg={isChecked ? colors.success : colors.hint}
								attributes={isChecked ? 1 : 0}
							>
								{isChecked ? "[x]" : "[ ]"}
							</text>
							<text
								fg={
									isAtCursor && focused
										? isChecked
											? colors.success
											: colors.accent
										: isChecked
											? colors.success
											: colors.text
								}
								attributes={isAtCursor && focused ? 1 : 0}
							>
								{option.label}
							</text>
							{option.description && (
								<text
									fg={colors.description}
								>{` - ${option.description}`}</text>
							)}
						</box>
					);
				})}
			</scrollbox>
		</box>
	);
}
