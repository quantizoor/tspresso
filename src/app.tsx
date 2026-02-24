import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useState } from "react";

export function App() {
	const [message, setMessage] = useState("Press any key...");
	const dimensions = useTerminalDimensions();

	useKeyboard((event) => {
		if (event.name === "q") process.exit(0);
		setMessage(`Key pressed: ${event.name}`);
	});

	return (
		<box
			flexDirection="column"
			alignItems="center"
			justifyContent="center"
			width={dimensions.width}
			height={dimensions.height}
			border={true}
			borderStyle="rounded"
			padding={1}
		>
			<text>
				<b>tspresso</b>
			</text>
			<text fg="#888888">
				Terminal size: {dimensions.width}x{dimensions.height}
			</text>
			<box marginTop={1}>
				<text fg="#00ff88">{message}</text>
			</box>
			<box marginTop={1}>
				<text fg="#666666">
					Press <b>q</b> to quit
				</text>
			</box>
		</box>
	);
}
