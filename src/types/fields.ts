// Shared option shape (readonly for as-const compatibility)
export interface SelectOption {
	readonly label: string;
	readonly value: string;
	readonly description?: string;
}

// Base — every field has key, label, optional condition, optional skip
interface BaseField {
	readonly key: string;
	readonly label: string;
	readonly optional?: boolean;
	readonly showWhen?: {
		readonly field: string;
		readonly equals: string;
	};
}

// Fixed single-select
export interface SelectField extends BaseField {
	readonly type: "select";
	readonly options: readonly SelectOption[];
}

// Fixed multi-select
export interface MultiSelectField extends BaseField {
	readonly type: "multi-select";
	readonly options: readonly SelectOption[];
}

// Single-select with persistable custom options
export interface TemplateField extends BaseField {
	readonly type: "template";
	readonly options: readonly SelectOption[];
	readonly storeName: string;
}

// Single-line text
export interface TextField extends BaseField {
	readonly type: "text";
	readonly placeholder?: string;
	readonly defaultValue?: string;
}

// Multi-line text
export interface TextAreaField extends BaseField {
	readonly type: "textarea";
	readonly placeholder?: string;
	readonly defaultValue?: string;
	readonly height?: number;
}

export type FieldDef =
	| SelectField
	| MultiSelectField
	| TemplateField
	| TextField
	| TextAreaField;

// --- Type-safe answer extraction ---

// Map a single field to its answer type
type FieldValue<F extends FieldDef> = F extends {
	type: "select";
	options: readonly { readonly value: infer V }[];
}
	? V
	: F extends {
				type: "multi-select";
				options: readonly { readonly value: infer V }[];
			}
		? V[]
		: F extends { type: "template" }
			? string
			: string;

// A field is optional in the answers if it has showWhen OR optional: true
type IsOptionalField<F extends FieldDef> = F extends { showWhen: unknown }
	? true
	: F extends { optional: true }
		? true
		: false;

// Extract typed answers object from a fields tuple.
// Fields with showWhen or optional: true become optional properties.
export type ExtractAnswers<T extends readonly FieldDef[]> = {
	[F in T[number] as IsOptionalField<F> extends true
		? never
		: F["key"]]: FieldValue<F>;
} & {
	[F in T[number] as IsOptionalField<F> extends true
		? F["key"]
		: never]?: FieldValue<F>;
};
