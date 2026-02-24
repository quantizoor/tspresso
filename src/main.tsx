import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./app.tsx";

const renderer = await createCliRenderer({
	exitOnCtrlC: true,
	useAlternateScreen: true,
	onDestroy: () => {
		// Clear any junk escape sequences (e.g. ^[[I focus reports) that get
		// echoed to the terminal during OpenTUI's cleanup.
		process.stdout.write("\r\x1b[J");
	},
});

createRoot(renderer).render(<App />);
