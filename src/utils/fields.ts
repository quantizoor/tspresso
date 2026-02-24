import type { FieldDef } from "../types/index.ts";

export function isFieldVisible(
	field: FieldDef,
	answers: Record<string, string | string[]>,
): boolean {
	if (!field.showWhen) return true;
	return answers[field.showWhen.field] === field.showWhen.equals;
}

export function getVisibleFields<const T extends readonly FieldDef[]>(
	fields: T,
	answers: Record<string, string | string[]>,
): FieldDef[] {
	return fields.filter((f) => isFieldVisible(f, answers));
}
