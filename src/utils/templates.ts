import type { SelectOption, Template, TemplateField } from "../types/index.ts";
import { readStore, writeStore } from "./storage.ts";

export function loadTemplates(storeName: string): Template[] {
	return readStore(storeName, { templates: [] as Template[] }).templates;
}

export function saveTemplate(storeName: string, template: Template): void {
	const templates = loadTemplates(storeName).filter(
		(t) => t.label !== template.label,
	);
	templates.push(template);
	writeStore(storeName, { templates });
}

export function deleteTemplate(storeName: string, label: string): boolean {
	const templates = loadTemplates(storeName);
	const filtered = templates.filter((t) => t.label !== label);
	if (filtered.length === templates.length) return false;
	writeStore(storeName, { templates: filtered });
	return true;
}

export function getTemplateOptions(field: TemplateField): SelectOption[] {
	return [
		...field.options.map((o) => ({ label: o.label, value: o.value })),
		...loadTemplates(field.storeName).map((t) => ({
			label: t.label,
			value: t.label,
		})),
	];
}
