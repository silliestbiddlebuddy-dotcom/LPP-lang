export class CLIOptions {
	constructor(flags: Flags[]) {
		return { Flags: flags };
	}
}
type Flags = "debug";
