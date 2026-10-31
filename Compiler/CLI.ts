#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";

import * as fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { parse, printParseErrorCode, type ParseError } from "jsonc-parser";

import { SemanticAnalyzer } from "./Frontend/Semantic/SemanticAnalyzer.ts";
import type {
	CompileOptions,
	// Keep this import if TypedSourceFile is exported by SemanticAnalyzer.ts.
} from "./Frontend/Semantic/CompileOptions.ts";
import type { TypedSourceFile } from "./Frontend/Semantic/SemanticAnalyzer.ts";

import { LLVMBackend } from "./Backend/LLVM/LLVMBackend.ts";

// ============================================================
// Types
// ============================================================

type OptimizationLevel = "0" | "1" | "2" | "3" | "s" | "z";

interface LppConfig {
	outDir?: string;
	output?: string;
	target?: string;
	optimization?: OptimizationLevel;

	runtime?: boolean;
	runtimeFile?: string;

	flags?: Partial<CompileOptions["flags"]>;
	ignoreFiles?: string[];
}

interface CLIOptions {
	config?: string;
	outDir?: string;
	output?: string;
	target?: string;
	optimization?: string;

	debug?: boolean;
	tokens?: boolean;
	ast?: boolean;
	check?: boolean;

	run?: boolean;
	emit?: boolean;

	withoutRuntime?: boolean;
	clangWarnings?: boolean;
	warningsAsErrors?: boolean;
	strip?: boolean;
	keepLLVM?: boolean;

	verbose?: boolean;
	quiet?: boolean;
}

interface BuildSettings {
	projectRoot: string;
	configDirectory: string;

	outDir: string;
	output: string | undefined;

	target: string;
	optimization: OptimizationLevel;

	runtime: boolean;
	runtimeFile: string | undefined;

	debug: boolean;
	tokens: boolean;
	ast: boolean;
	check: boolean;

	emit: boolean;
	run: boolean;

	clangWarnings: boolean;
	warningsAsErrors: boolean;
	strip: boolean;
	keepLLVM: boolean;

	verbose: boolean;
	quiet: boolean;

	ignoreFiles: string[];
}

interface SourceFile {
	path: string;
	name: string;
	source: string;
}

interface GeneratedLLVMFile {
	sourcePath: string;
	llvmPath: string;
}

// ============================================================
// Constants
// ============================================================

const VERSION = "0.1.0";

const DEFAULT_CONFIG: Required<Pick<LppConfig, "outDir" | "target" | "optimization" | "runtime">> = {
	outDir: "./build",
	target: "",
	optimization: "2",
	runtime: true,
};

const DEFAULT_IGNORES = ["node_modules", ".git", ".vscode", "build", "dist"];

const CONFIG_NAMES = ["LppConfig.jsonc", "LppConfig.json"];

const CONFIG_TEMPLATE = `// https://github.com/silliestbiddlebuddy-dotcom/LPP-lang

{
    // General project configuration
    "outDir": "./build",
    "target": "",
    "optimization": "2",

    // Runtime configuration
    "runtime": true,

    // Set this if runtime.c is not in a default location.
    // "runtimeFile": "./runtime/runtime.c",

    // Files and directories ignored by "lpp build"
    "ignoreFiles": [
        "node_modules",
        "build",
        "dist"
    ],

    // Compiler flags
    "flags": {
        "debug": false,
        "tokens": false,
        "ast": false,
        "check": false
    }

    // Linux target example:
    // "target": "x86_64-unknown-linux-gnu",

    // Windows target example:
    // "target": "x86_64-pc-windows-msvc",

    // Release configuration:
    // "optimization": "3",

    // Compiler development configuration:
    // "flags": {
    //     "debug": true,
    //     "tokens": true,
    //     "ast": true
    // }
}
`;

// ============================================================
// Logging
// ============================================================

const log = {
	info(message: string, quiet = false): void {
		if (!quiet) {
			console.log(chalk.blue("info"), message);
		}
	},

	success(message: string, quiet = false): void {
		if (!quiet) {
			console.log(chalk.green("success"), message);
		}
	},

	warning(message: string): void {
		console.warn(chalk.yellow("warning"), message);
	},

	error(message: string): void {
		console.error(chalk.red("error"), message);
	},

	verbose(message: string, enabled: boolean): void {
		if (enabled) {
			console.log(chalk.gray("[verbose]"), message);
		}
	},
};

// ============================================================
// General utilities
// ============================================================

function isOptimizationLevel(value: string): value is OptimizationLevel {
	return ["0", "1", "2", "3", "s", "z"].includes(value);
}

function isInsideDirectory(parent: string, child: string): boolean {
	const relative = path.relative(parent, child);

	return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function resolveOutputPath(output: string | undefined, defaultPath: string, baseDirectory: string): string {
	return path.resolve(baseDirectory, output ?? defaultPath);
}

function runExecutable(executable: string): void {
	log.info(`Running ${executable}`);

	const result = spawnSync(executable, [], {
		stdio: "inherit",
	});

	if (result.error) {
		throw new Error(`Could not execute ${executable}: ${result.error.message}`);
	}

	if (result.status !== 0) {
		throw new Error(`Program exited with status ${result.status ?? "unknown"}.`);
	}
}

// ============================================================
// Configuration
// ============================================================

function getConfigParseErrors(content: string, errors: ParseError[]): string[] {
	return errors.map((error) => {
		const before = content.slice(0, error.offset);
		const line = before.split("\n").length;
		const lastNewline = before.lastIndexOf("\n");
		const column = error.offset - lastNewline;

		return `${printParseErrorCode(error.error)} ` + `at line ${line}, column ${column}`;
	});
}

function validateConfig(value: unknown): LppConfig {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		throw new Error("The configuration root must be an object.");
	}

	const config = value as Record<string, unknown>;

	if (config.outDir !== undefined && typeof config.outDir !== "string") {
		throw new Error('"outDir" must be a string.');
	}

	if (config.output !== undefined && typeof config.output !== "string") {
		throw new Error('"output" must be a string.');
	}

	if (config.target !== undefined && typeof config.target !== "string") {
		throw new Error('"target" must be a string.');
	}

	if (config.optimization !== undefined && (typeof config.optimization !== "string" || !isOptimizationLevel(config.optimization))) {
		throw new Error('"optimization" must be one of: 0, 1, 2, 3, s, z.');
	}

	if (config.runtime !== undefined && typeof config.runtime !== "boolean") {
		throw new Error('"runtime" must be a boolean.');
	}

	if (config.runtimeFile !== undefined && typeof config.runtimeFile !== "string") {
		throw new Error('"runtimeFile" must be a string.');
	}

	if (config.ignoreFiles !== undefined) {
		if (!Array.isArray(config.ignoreFiles) || !config.ignoreFiles.every((entry) => typeof entry === "string")) {
			throw new Error('"ignoreFiles" must be an array of strings.');
		}
	}

	if (config.flags !== undefined && (config.flags === null || typeof config.flags !== "object" || Array.isArray(config.flags))) {
		throw new Error('"flags" must be an object.');
	}

	return config as LppConfig;
}

async function findConfigFile(startDirectory: string, explicitConfig?: string): Promise<string | undefined> {
	if (explicitConfig) {
		const configPath = path.resolve(explicitConfig);

		if (!existsSync(configPath)) {
			throw new Error(`Configuration file not found: ${configPath}`);
		}

		return configPath;
	}

	let currentDirectory = path.resolve(startDirectory);

	while (true) {
		for (const configName of CONFIG_NAMES) {
			const candidate = path.join(currentDirectory, configName);

			if (existsSync(candidate)) {
				return candidate;
			}
		}

		const parent = path.dirname(currentDirectory);

		if (parent === currentDirectory) {
			break;
		}

		currentDirectory = parent;
	}

	return undefined;
}

async function loadConfig(
	startDirectory: string,
	explicitConfig?: string
): Promise<{
	config: LppConfig;
	configDirectory: string;
}> {
	const configPath = await findConfigFile(startDirectory, explicitConfig);

	if (!configPath) {
		return {
			config: {},
			configDirectory: startDirectory,
		};
	}

	const content = await fs.readFile(configPath, "utf8");
	const parseErrors: ParseError[] = [];

	const parsed = parse(content, parseErrors, {
		allowTrailingComma: true,
		disallowComments: false,
	});

	if (parseErrors.length > 0) {
		const messages = getConfigParseErrors(content, parseErrors);

		throw new Error(`Invalid configuration file:\n${messages.join("\n")}`);
	}

	return {
		config: validateConfig(parsed),
		configDirectory: path.dirname(configPath),
	};
}

// ============================================================
// Option resolution
// ============================================================

async function resolveSettings(projectRoot: string, cli: CLIOptions): Promise<BuildSettings> {
	const absoluteRoot = path.resolve(projectRoot);

	const { config, configDirectory } = await loadConfig(absoluteRoot, cli.config);

	const optimization = cli.optimization ?? config.optimization ?? DEFAULT_CONFIG.optimization;

	if (!isOptimizationLevel(optimization)) {
		throw new Error(`Invalid optimization level: ${optimization}`);
	}

	const settings: BuildSettings = {
		projectRoot: absoluteRoot,
		configDirectory,

		outDir: cli.outDir ?? config.outDir ?? DEFAULT_CONFIG.outDir,

		output: cli.output ?? config.output,

		target: cli.target ?? config.target ?? DEFAULT_CONFIG.target,

		optimization,

		runtime: cli.withoutRuntime ? false : config.runtime ?? DEFAULT_CONFIG.runtime,

		runtimeFile: config.runtimeFile ? path.resolve(configDirectory, config.runtimeFile) : undefined,

		debug: cli.debug ?? config.flags?.debug ?? false,

		tokens: cli.tokens ?? config.flags?.tokens ?? false,

		ast: cli.ast ?? config.flags?.ast ?? false,

		check: cli.check ?? config.flags?.check ?? false,

		emit: cli.emit !== false,
		run: cli.run ?? false,

		clangWarnings: cli.clangWarnings ?? false,
		warningsAsErrors: cli.warningsAsErrors ?? false,
		strip: cli.strip ?? false,
		keepLLVM: cli.keepLLVM ?? false,

		verbose: cli.verbose ?? false,
		quiet: cli.quiet ?? false,

		ignoreFiles: config.ignoreFiles ?? [],
	};

	if (settings.run && !settings.emit) {
		throw new Error("--run cannot be used with --no-emit.");
	}

	return settings;
}

function createCompileOptions(settings: BuildSettings): CompileOptions {
	return {
		flags: {
			debug: settings.debug,
			tokens: settings.tokens,
			ast: settings.ast,
			check: settings.check,
		},

		ignoreFiles: settings.ignoreFiles,
	};
}

// ============================================================
// Source discovery
// ============================================================

async function collectSourceFiles(projectRoot: string, settings: BuildSettings): Promise<SourceFile[]> {
	const root = path.resolve(projectRoot);
	const outputDirectory = path.resolve(root, settings.outDir);

	const ignoredPaths = [...DEFAULT_IGNORES.map((entry) => path.resolve(root, entry)), ...settings.ignoreFiles.map((entry) => path.resolve(root, entry))];

	const files: SourceFile[] = [];

	async function walk(directory: string): Promise<void> {
		const entries = await fs.readdir(directory, {
			withFileTypes: true,
		});

		for (const entry of entries) {
			const absolutePath = path.resolve(directory, entry.name);

			if (ignoredPaths.some((ignoredPath) => isInsideDirectory(ignoredPath, absolutePath))) {
				continue;
			}

			if (isInsideDirectory(outputDirectory, absolutePath)) {
				continue;
			}

			if (entry.isDirectory()) {
				await walk(absolutePath);
				continue;
			}

			if (!entry.isFile() || path.extname(entry.name) !== ".lpp") {
				continue;
			}

			files.push({
				path: absolutePath,
				name: path.basename(entry.name, ".lpp"),
				source: await fs.readFile(absolutePath, "utf8"),
			});
		}
	}

	await walk(root);

	files.sort((a, b) => a.path.localeCompare(b.path));

	return files;
}

async function loadSingleSourceFile(filePath: string): Promise<SourceFile> {
	const absolutePath = path.resolve(filePath);

	if (path.extname(absolutePath) !== ".lpp") {
		throw new Error(`Expected a .lpp file: ${filePath}`);
	}

	const stats = await fs.stat(absolutePath);

	if (!stats.isFile()) {
		throw new Error(`Not a file: ${filePath}`);
	}

	return {
		path: absolutePath,
		name: path.basename(absolutePath, ".lpp"),
		source: await fs.readFile(absolutePath, "utf8"),
	};
}

// ============================================================
// Semantic analysis and LLVM generation
// ============================================================

function generateLLVM(typedFile: TypedSourceFile): string {
	/*
	 * LLVMBackend is constructed with the file's Binder.
	 *
	 * This uses the one-argument constructor and passes the TypedAST
	 * to generate(), rather than passing the AST to the constructor.
	 */
	const backend = new LLVMBackend(typedFile.binder, typedFile.typedAST);

	const llvmIR = backend.generate();

	if (typeof llvmIR !== "string") {
		throw new Error(`LLVM backend did not return IR for ${typedFile.path}.`);
	}

	return llvmIR;
}

async function analyzeAndGenerateLLVM(
	sourceFiles: SourceFile[],
	compileOptions: CompileOptions,
	projectRoot: string,
	temporaryDirectory: string,
	settings: BuildSettings
): Promise<GeneratedLLVMFile[]> {
	if (sourceFiles.length === 0) {
		throw new Error("No .lpp source files were found.");
	}

	log.info(`Analyzing ${sourceFiles.length} source file(s).`, settings.quiet);

	/*
	 * Important: one SemanticAnalyzer for the whole project.
	 * This lets the analyzer see the entire collection of files.
	 */
	const analyzer = new SemanticAnalyzer(sourceFiles);

	const typedFiles = analyzer.startSemanticAnalysis(compileOptions);

	if (!typedFiles || typedFiles.length !== sourceFiles.length) {
		throw new Error("Semantic analysis did not return a typed file for every source file.");
	}

	const generatedFiles: GeneratedLLVMFile[] = [];

	for (const typedFile of typedFiles) {
		const llvmIR = generateLLVM(typedFile);

		const relativePath = path.relative(projectRoot, typedFile.path);

		const llvmPath = path.join(temporaryDirectory, `${relativePath}.ll`);

		await fs.mkdir(path.dirname(llvmPath), {
			recursive: true,
		});

		await fs.writeFile(llvmPath, llvmIR, "utf8");

		generatedFiles.push({
			sourcePath: typedFile.path,
			llvmPath,
		});

		log.verbose(`Generated LLVM IR: ${llvmPath}`, settings.verbose);
	}

	return generatedFiles;
}

// ============================================================
// Runtime discovery
// ============================================================

function findRuntimeFile(settings: BuildSettings): string | undefined {
	const cliDirectory = path.dirname(fileURLToPath(import.meta.url));

	const candidates = [
		settings.runtimeFile,

		path.resolve(settings.projectRoot, "runtime.c"),
		path.resolve(settings.projectRoot, "runtime/runtime.c"),

		path.join(cliDirectory, "runtime.c"),
		path.join(cliDirectory, "../runtime.c"),
		path.join(cliDirectory, "runtime/runtime.c"),
	].filter((candidate): candidate is string => candidate !== undefined);

	return candidates.find((candidate) => existsSync(candidate));
}

// ============================================================
// LLVM -> native executable
// ============================================================

function compileLLVMFiles(llvmFiles: string[], outputFile: string, settings: BuildSettings): void {
	if (llvmFiles.length === 0) {
		throw new Error("No LLVM files were provided to Clang.");
	}

	const args: string[] = [];

	if (settings.target) {
		args.push("-target", settings.target);
	}

	args.push(`-O${settings.optimization}`, "-Wno-override-module");

	if (settings.debug) {
		args.push("-g");
	}

	if (settings.clangWarnings || settings.warningsAsErrors) {
		args.push("-Wall", "-Wextra");
	}

	if (settings.warningsAsErrors) {
		args.push("-Werror");
	}

	if (settings.strip) {
		args.push("-s");
	}

	args.push(...llvmFiles);

	if (settings.runtime) {
		const runtimeFile = findRuntimeFile(settings);

		if (!runtimeFile) {
			throw new Error("runtime.c was not found. Configure runtimeFile in LppConfig.jsonc or use --without-runtime.");
		}

		args.push(runtimeFile);
	}

	args.push("-o", outputFile);

	log.verbose(`clang ${args.join(" ")}`, settings.verbose);

	const result = spawnSync("clang", args, {
		encoding: "utf8",
	});

	if (result.error) {
		throw new Error(`Could not start Clang: ${result.error.message}`);
	}

	if (result.stdout) {
		process.stdout.write(result.stdout);
	}

	if (result.stderr) {
		process.stderr.write(result.stderr);
	}

	if (result.status !== 0) {
		throw new Error(`Clang failed with exit code ${result.status ?? "unknown"}.`);
	}
}

// ============================================================
// LLVM file output helpers
// ============================================================

async function copyLLVMFiles(generatedFiles: GeneratedLLVMFile[], temporaryDirectory: string, outputDirectory: string): Promise<void> {
	for (const generatedFile of generatedFiles) {
		const relativePath = path.relative(temporaryDirectory, generatedFile.llvmPath);

		const destination = path.join(outputDirectory, relativePath);

		await fs.mkdir(path.dirname(destination), {
			recursive: true,
		});

		await fs.copyFile(generatedFile.llvmPath, destination);
	}
}

// ============================================================
// build <directory>
// ============================================================

async function buildProject(directory: string, settings: BuildSettings): Promise<void> {
	const projectRoot = path.resolve(directory);
	const stats = await fs.stat(projectRoot);

	if (!stats.isDirectory()) {
		throw new Error(`build expects a project directory, got: ${directory}`);
	}

	const compileOptions = createCompileOptions(settings);

	const sourceFiles = await collectSourceFiles(projectRoot, settings);

	if (sourceFiles.length === 0) {
		throw new Error(`No .lpp files found in ${projectRoot}.`);
	}

	log.info(`Found ${sourceFiles.length} source file(s).`, settings.quiet);

	if (settings.check) {
		const analyzer = new SemanticAnalyzer(sourceFiles);

		analyzer.startSemanticAnalysis(compileOptions);

		log.success("Project check completed.", settings.quiet);
		return;
	}

	const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "lpp-build-"));

	try {
		const generatedFiles = await analyzeAndGenerateLLVM(sourceFiles, compileOptions, projectRoot, temporaryDirectory, settings);

		const outputDirectory = path.resolve(projectRoot, settings.outDir);

		await fs.mkdir(outputDirectory, {
			recursive: true,
		});

		if (settings.keepLLVM) {
			await copyLLVMFiles(generatedFiles, temporaryDirectory, outputDirectory);
		}

		if (!settings.emit) {
			log.success("LLVM generation completed; native output was disabled.", settings.quiet);
			return;
		}

		const executableName = path.basename(projectRoot) + (process.platform === "win32" ? ".exe" : "");

		const executablePath = resolveOutputPath(settings.output, executableName, outputDirectory);

		await fs.mkdir(path.dirname(executablePath), {
			recursive: true,
		});

		compileLLVMFiles(
			generatedFiles.map((file) => file.llvmPath),
			executablePath,
			settings
		);

		log.success(`Built ${executablePath}`, settings.quiet);

		if (settings.run) {
			runExecutable(executablePath);
		}
	} finally {
		await fs.rm(temporaryDirectory, {
			recursive: true,
			force: true,
		});
	}
}

// ============================================================
// compile <file.lpp>
// ============================================================

async function compileSingleFile(filePath: string, settings: BuildSettings): Promise<void> {
	const sourceFile = await loadSingleSourceFile(filePath);
	const compileOptions = createCompileOptions(settings);

	if (settings.check) {
		const analyzer = new SemanticAnalyzer([sourceFile]);

		analyzer.startSemanticAnalysis(compileOptions);

		log.success("File check completed.", settings.quiet);
		return;
	}

	const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "lpp-compile-"));

	try {
		const generatedFiles = await analyzeAndGenerateLLVM([sourceFile], compileOptions, path.dirname(sourceFile.path), temporaryDirectory, settings);

		const outputDirectory = path.resolve(path.dirname(sourceFile.path), settings.outDir);

		await fs.mkdir(outputDirectory, {
			recursive: true,
		});

		if (settings.keepLLVM) {
			await copyLLVMFiles(generatedFiles, temporaryDirectory, outputDirectory);
		}

		if (!settings.emit) {
			log.success("LLVM generation completed; native output was disabled.", settings.quiet);
			return;
		}

		const executableName = sourceFile.name + (process.platform === "win32" ? ".exe" : "");

		const executablePath = resolveOutputPath(settings.output, executableName, outputDirectory);

		await fs.mkdir(path.dirname(executablePath), {
			recursive: true,
		});

		compileLLVMFiles(
			generatedFiles.map((file) => file.llvmPath),
			executablePath,
			settings
		);

		log.success(`Compiled ${executablePath}`, settings.quiet);

		if (settings.run) {
			runExecutable(executablePath);
		}
	} finally {
		await fs.rm(temporaryDirectory, {
			recursive: true,
			force: true,
		});
	}
}

// ============================================================
// compileToLLVM <file.lpp>
// ============================================================

async function compileSourceToLLVM(filePath: string, settings: BuildSettings): Promise<void> {
	const sourceFile = await loadSingleSourceFile(filePath);
	const compileOptions = createCompileOptions(settings);

	const analyzer = new SemanticAnalyzer([sourceFile]);

	const typedFiles = analyzer.startSemanticAnalysis(compileOptions);

	const typedFile = typedFiles[0];

	if (!typedFile) {
		throw new Error("Semantic analysis did not produce a typed file.");
	}

	const llvmIR = generateLLVM(typedFile);

	const outputDirectory = path.resolve(path.dirname(sourceFile.path), settings.outDir);

	await fs.mkdir(outputDirectory, {
		recursive: true,
	});

	const defaultOutput = `${sourceFile.name}.lpp.ll`;

	const outputPath = resolveOutputPath(settings.output, defaultOutput, outputDirectory);

	await fs.mkdir(path.dirname(outputPath), {
		recursive: true,
	});

	await fs.writeFile(outputPath, llvmIR, "utf8");

	log.success(`Generated ${outputPath}`, settings.quiet);
}

// ============================================================
// compileLLVM <file.ll...>
// ============================================================

async function compileExistingLLVM(files: string[], settings: BuildSettings): Promise<void> {
	if (files.length === 0) {
		throw new Error("Provide at least one .ll file.");
	}

	const llvmFiles = files.map((file) => path.resolve(file));

	for (const file of llvmFiles) {
		if (path.extname(file) !== ".ll") {
			throw new Error(`Expected an LLVM .ll file: ${file}`);
		}

		const stats = await fs.stat(file);

		if (!stats.isFile()) {
			throw new Error(`Not a file: ${file}`);
		}
	}

	const firstFile = llvmFiles[0];

	if (!firstFile) {
		throw new Error("No LLVM files were provided.");
	}

	const outputDirectory = path.resolve(path.dirname(firstFile), settings.outDir);

	await fs.mkdir(outputDirectory, {
		recursive: true,
	});

	const defaultName = path
		.basename(firstFile)
		.replace(/\.lpp\.ll$/, "")
		.replace(/\.ll$/, "");

	const executableName = defaultName + (process.platform === "win32" ? ".exe" : "");

	const executablePath = resolveOutputPath(settings.output, executableName, outputDirectory);

	await fs.mkdir(path.dirname(executablePath), {
		recursive: true,
	});

	compileLLVMFiles(llvmFiles, executablePath, settings);

	log.success(`Compiled ${executablePath}`, settings.quiet);

	if (settings.run) {
		runExecutable(executablePath);
	}
}

// ============================================================
// init-config [directory]
// ============================================================

async function initializeConfig(directory: string, force: boolean): Promise<void> {
	const projectRoot = path.resolve(directory);
	const configPath = path.join(projectRoot, "LppConfig.jsonc");

	await fs.mkdir(projectRoot, {
		recursive: true,
	});

	if (existsSync(configPath) && !force) {
		throw new Error(`${configPath} already exists. Use --force to overwrite it.`);
	}

	await fs.writeFile(configPath, CONFIG_TEMPLATE, "utf8");

	log.success(`Created ${configPath}`);
}

// ============================================================
// Commander setup
// ============================================================

function addCommonOptions(command: Command): Command {
	return command
		.option("-c, --config <path>", "Configuration file")
		.option("-o, --out-dir <directory>", "Output directory")
		.option("--output <path>", "Output file path")
		.option("-t, --target <triple>", "LLVM target triple")
		.option("-O, --optimization <level>", "Optimization: 0, 1, 2, 3, s, z")

		.option("--debug", "Generate debug information")
		.option("--tokens", "Print lexer tokens")
		.option("--ast", "Print the AST")
		.option("--check", "Only perform semantic analysis")

		.option("--run", "Run the resulting executable")
		.option("--no-emit", "Do not produce a native executable")

		.option("--without-runtime", "Do not link the default L++ runtime")

		.option("--clang-warnings", "Enable Clang warnings")
		.option("--warnings-as-errors", "Treat Clang warnings as errors")

		.option("--strip", "Strip the resulting executable")
		.option("--keep-llvm", "Keep generated LLVM IR files")

		.option("--verbose", "Show verbose compiler information")
		.option("--quiet", "Suppress informational output");
}

const program = new Command();

program.name("lpp").description("The L++ compiler").version(VERSION).showHelpAfterError().showSuggestionAfterError();

// build <directory>

const buildCommand = program.command("build <directory>").description("Build an entire L++ project");

addCommonOptions(buildCommand);

buildCommand.action(async (directory: string) => {
	try {
		const cli = buildCommand.opts<CLIOptions>();

		const settings = await resolveSettings(directory, cli);

		await buildProject(directory, settings);
	} catch (error) {
		log.error(error instanceof Error ? error.message : String(error));

		process.exitCode = 1;
	}
});

// compile <file.lpp>

const compileCommand = program.command("compile <file>").description("Compile one L++ source file");

addCommonOptions(compileCommand);

compileCommand.action(async (file: string) => {
	try {
		const absolutePath = path.resolve(file);

		const settings = await resolveSettings(path.dirname(absolutePath), compileCommand.opts<CLIOptions>());

		await compileSingleFile(absolutePath, settings);
	} catch (error) {
		log.error(error instanceof Error ? error.message : String(error));

		process.exitCode = 1;
	}
});

// compileToLLVM <file.lpp>

const compileToLLVMCommand = program.command("compileToLLVM <file>").description("Compile one L++ source file to LLVM IR");

addCommonOptions(compileToLLVMCommand);

compileToLLVMCommand.action(async (file: string) => {
	try {
		const absolutePath = path.resolve(file);

		const settings = await resolveSettings(path.dirname(absolutePath), compileToLLVMCommand.opts<CLIOptions>());

		if (settings.run) {
			throw new Error("--run cannot be used with compileToLLVM.");
		}

		await compileSourceToLLVM(absolutePath, settings);
	} catch (error) {
		log.error(error instanceof Error ? error.message : String(error));

		process.exitCode = 1;
	}
});

// compileLLVM <files...>

const compileLLVMCommand = program.command("compileLLVM <files...>").description("Compile existing LLVM IR files into a native executable");

addCommonOptions(compileLLVMCommand);

compileLLVMCommand.action(async (files: string[]) => {
	try {
		const firstFile = files[0];

		if (!firstFile) {
			throw new Error("Provide at least one LLVM file.");
		}

		const settings = await resolveSettings(path.dirname(path.resolve(firstFile)), compileLLVMCommand.opts<CLIOptions>());

		if (settings.check) {
			throw new Error("--check is not supported by compileLLVM.");
		}

		compileExistingLLVM(files, settings).catch((error: unknown) => {
			log.error(error instanceof Error ? error.message : String(error));

			process.exitCode = 1;
		});
	} catch (error) {
		log.error(error instanceof Error ? error.message : String(error));

		process.exitCode = 1;
	}
});

// init-config [directory]

program
	.command("init-config [directory]")
	.description("Create a default LppConfig.jsonc file")
	.option("-f, --force", "Overwrite an existing config")
	.action(async (directory = ".", options: { force?: boolean }) => {
		try {
			await initializeConfig(directory, options.force ?? false);
		} catch (error) {
			log.error(error instanceof Error ? error.message : String(error));

			process.exitCode = 1;
		}
	});

// ============================================================
// Run
// ============================================================

await program.parseAsync(process.argv);
