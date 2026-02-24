import type { FieldDef } from "./types/index.ts";
import { Wizard } from "./wizard/index.ts";

const fields = [
	{
		type: "text",
		key: "name",
		label: "Project name",
		placeholder: "my-awesome-project",
	},
	{
		type: "text",
		key: "description",
		label: "Description",
		placeholder: "A short description of your project",
		optional: true,
	},
	{
		type: "select",
		key: "framework",
		label: "Framework",
		options: [
			{
				label: "React",
				value: "react",
				description: "A library for building user interfaces",
			},
			{
				label: "Vue",
				value: "vue",
				description: "The progressive JavaScript framework",
			},
			{
				label: "Svelte",
				value: "svelte",
				description: "Cybernetically enhanced web apps",
			},
			{
				label: "Angular",
				value: "angular",
				description: "The modern web developer's platform",
			},
		],
	},
	{
		type: "multi-select",
		key: "features",
		label: "Features",
		options: [
			{
				label: "TypeScript",
				value: "typescript",
				description: "Type-safe JavaScript",
			},
			{
				label: "ESLint",
				value: "eslint",
				description: "Pluggable linting utility",
			},
			{
				label: "Prettier",
				value: "prettier",
				description: "Opinionated code formatter",
			},
			{
				label: "Vitest",
				value: "vitest",
				description: "Blazing fast unit testing",
			},
			{
				label: "Tailwind CSS",
				value: "tailwindcss",
				description: "Utility-first CSS framework",
			},
			{
				label: "Docker",
				value: "docker",
				description: "Container deployment",
			},
			{
				label: "Storybook",
				value: "storybook",
				description: "Component explorer",
				disabled: true,
			},
		],
	},
	{
		type: "select",
		key: "ci",
		label: "Set up CI?",
		options: [
			{ label: "Yes", value: "yes" },
			{ label: "No", value: "no" },
		],
	},
	{
		type: "select",
		key: "ciProvider",
		label: "CI Provider",
		options: [
			{
				label: "GitHub Actions",
				value: "github-actions",
				description: "CI/CD built into GitHub",
			},
			{
				label: "GitLab CI",
				value: "gitlab-ci",
				description: "GitLab's integrated CI/CD",
			},
		],
		showWhen: { field: "ci", equals: "yes" },
	},
	{
		type: "template",
		key: "readme",
		label: "README template",
		options: [
			{
				label: "Minimal",
				value: "minimal",
				content: "# {{name}}\n\n{{description}}",
			},
			{
				label: "Detailed",
				value: "detailed",
				content:
					"# {{name}}\n\n## Overview\n{{description}}\n\n## Getting Started\n\n```bash\nnpm install\nnpm run dev\n```\n\n## License\nMIT",
			},
		],
		storeName: "readme-templates",
	},
] as const satisfies readonly FieldDef[];

export function App() {
	return (
		<Wizard
			title="tspresso"
			subtitle="Project Setup Wizard"
			fields={fields}
			onComplete={(answers) => {
				// answers is the collected wizard data
				void answers;
			}}
		/>
	);
}
