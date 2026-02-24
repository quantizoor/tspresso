import { useTerminalDimensions } from "@opentui/react";
import { useState } from "react";
import {
	MultiSelect,
	SingleSelect,
	TextArea,
	TextInput,
} from "./components/index.ts";

type Step = "name" | "framework" | "features" | "readme" | "done";

const FRAMEWORKS = [
	{ label: "React", description: "A library for building user interfaces" },
	{ label: "Vue", description: "The progressive JavaScript framework" },
	{ label: "Svelte", description: "Cybernetically enhanced web apps" },
	{ label: "Angular", description: "The modern web developer's platform" },
];

const FEATURES = [
	{ label: "TypeScript", description: "Type-safe JavaScript" },
	{ label: "ESLint", description: "Pluggable linting utility" },
	{ label: "Prettier", description: "Opinionated code formatter" },
	{ label: "Vitest", description: "Blazing fast unit testing" },
	{ label: "Tailwind CSS", description: "Utility-first CSS framework" },
	{ label: "Docker", description: "Container deployment" },
];

export function App() {
	const dimensions = useTerminalDimensions();
	const [step, setStep] = useState<Step>("name");
	const [projectName, setProjectName] = useState("");
	const [framework, setFramework] = useState("");
	const [features, setFeatures] = useState<string[]>([]);

	return (
		<box
			flexDirection="column"
			width={dimensions.width}
			height={dimensions.height}
			padding={1}
		>
			<box marginBottom={1}>
				<text>
					<b fg="#c084fc">tspresso</b>
					<span fg="#555555">{" - Project Setup Wizard"}</span>
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
				{/* Step 1: Project name */}
				{step === "name" && (
					<TextInput
						label="What is your project name?"
						placeholder="my-awesome-project"
						focused={true}
						onSubmit={(value) => {
							setProjectName(value || "my-awesome-project");
							setStep("framework");
						}}
					/>
				)}

				{/* Step 2: Framework selection */}
				{step === "framework" && (
					<box flexDirection="column" gap={1}>
						<box>
							<text fg="#555555">
								{"  Project: "}
								<b fg="#22c55e">{projectName}</b>
							</text>
						</box>
						<SingleSelect
							label="Which framework do you want to use?"
							options={FRAMEWORKS}
							focused={true}
							onSelect={(_index, option) => {
								setFramework(option.label);
								setStep("features");
							}}
						/>
					</box>
				)}

				{/* Step 3: Feature selection */}
				{step === "features" && (
					<box flexDirection="column" gap={1}>
						<box flexDirection="column">
							<text fg="#555555">
								{"  Project: "}
								<b fg="#22c55e">{projectName}</b>
							</text>
							<text fg="#555555">
								{"  Framework: "}
								<b fg="#22c55e">{framework}</b>
							</text>
						</box>
						<MultiSelect
							label="Which features would you like to enable?"
							options={FEATURES}
							focused={true}
							onSubmit={(selectedIndices) => {
								setFeatures(
									selectedIndices
										.map((i) => FEATURES[i]?.label)
										.filter((f): f is string => f != null),
								);
								setStep("readme");
							}}
						/>
					</box>
				)}

				{/* Step 4: README editor */}
				{step === "readme" && (
					<box flexDirection="column" gap={1}>
						<box flexDirection="column">
							<text fg="#555555">
								{"  Project: "}
								<b fg="#22c55e">{projectName}</b>
							</text>
							<text fg="#555555">
								{"  Framework: "}
								<b fg="#22c55e">{framework}</b>
							</text>
							<text fg="#555555">
								{"  Features: "}
								<b fg="#22c55e">
									{features.length > 0 ? features.join(", ") : "none"}
								</b>
							</text>
						</box>
						<TextArea
							label="Edit your README.md"
							placeholder="# My Project\n\nDescribe your project here..."
							initialValue={`# ${projectName}\n\nA ${framework} project.\n\n## Features\n\n${features.map((f) => `- ${f}`).join("\n") || "None selected."}\n`}
							focused={true}
							height={Math.max(8, dimensions.height - 16)}
							onSubmit={() => setStep("done")}
						/>
					</box>
				)}

				{/* Done */}
				{step === "done" && (
					<box flexDirection="column" gap={1}>
						<text>
							<b fg="#22c55e">{" \u2713 "}</b>
							<b>{"Project configured!"}</b>
						</text>
						<box
							flexDirection="column"
							border={true}
							borderStyle="rounded"
							borderColor="#333333"
							paddingX={1}
						>
							<text>
								<span fg="#888888">{"Name:      "}</span>
								<b fg="#ffffff">{projectName}</b>
							</text>
							<text>
								<span fg="#888888">{"Framework: "}</span>
								<b fg="#ffffff">{framework}</b>
							</text>
							<text>
								<span fg="#888888">{"Features:  "}</span>
								<b fg="#ffffff">
									{features.length > 0 ? features.join(", ") : "none"}
								</b>
							</text>
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
