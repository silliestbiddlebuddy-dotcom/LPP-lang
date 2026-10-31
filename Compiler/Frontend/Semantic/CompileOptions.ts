export interface CompileOptions {
	flags: {
		debug: boolean;
		tokens: boolean;
		ast: boolean;
		check: boolean;
	};
	ignoreFiles: string[]; //paths
}
