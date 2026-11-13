import { Lexer } from "../Lexer/Lexer.ts";
import { Parser } from "../Parser/Parser.ts";
import { Binder } from "./Binder/Binder.ts";
import type { CompileOptions } from "./CompileOptions.ts";
import { Module } from "./Modules/Module.ts";
import { ModuleLoader } from "./Modules/ModuleLoader.ts";
import { ModuleResolver } from "./Modules/ModuleResolver.ts";
import { TypeChecker, type TypedModule } from "./TypeChecker/TypeChecker.ts";
import type { TypedASTType } from "./TypeChecker/TypedAST.ts";
import * as fs from "node:fs";
import * as path from "node:path";
import { Chalk } from "chalk";
const chalk = new Chalk();

export class SemanticAnalyzer {
	private moduleLoader: ModuleLoader = new ModuleLoader();

	constructor() {}
	public analyzeDir(directory: string, compileOptions: CompileOptions): Set<TypedModule> {
		try {
			const files = this.resolveFiles(directory, fs.readdirSync(directory, { encoding: "utf-8", recursive: true }));
			return this.analyzeFiles(files);
		} catch (error) {
			throw error;
		}
	}
	private resolveFiles(directory: string, files: string[]): string[] {
		const absolutePaths: string[] = [];
		for (let index = 0; index < files.length; index++) {
			const file = files[index]!;
			absolutePaths.push(fs.realpathSync(path.resolve(directory, file)));
		}
		return absolutePaths;
	}
	private analyzeFiles(files: string[]): Set<TypedModule> {
		const modules: Module[] = [];
		for (let index = 0; index < files.length; index++) {
			const file = files[index]!;
			modules.push(this.moduleLoader.loadModule(file));
		}
		const binder = new Binder(modules, this.moduleLoader.resolver);
		binder.bind;
		const typeChecker = new TypeChecker(binder);
		typeChecker.typeCheck();
		return typeChecker.typedModules;
	}
}
