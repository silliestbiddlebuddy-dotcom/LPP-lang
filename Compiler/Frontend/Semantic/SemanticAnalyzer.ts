import { Lexer } from "../Lexer/Lexer.ts";
import { Parser } from "../Parser/Parser.ts";
import { Binder } from "./Binder/Binder.ts";
import type { CompileOptions } from "./CompileOptions.ts";
import { TypeChecker } from "./TypeChecker/TypeChecker.ts";
import type { TypedASTType } from "./TypeChecker/TypedAST.ts";
import { Chalk } from "chalk";
const chalk = new Chalk();
export interface SourceFile {
	path: string;
	name: string;
	source: string;
}
export interface TypedSourceFile {
	path: string;
	name: string;
	source: string;
	typedAST: TypedASTType;
	binder: Binder;
}
export class SemanticAnalyzer {
	private sourceFiles: SourceFile[];
	private typedSourceFiles: TypedSourceFile[];
	constructor(files: SourceFile[]) {
		this.sourceFiles = files;
		this.typedSourceFiles = [];
	}
	public startSemanticAnalysis(compileOptions: CompileOptions): TypedSourceFile[] {
		const typedSourceFiles: TypedSourceFile[] = [];
		for (let index = 0; index < this.sourceFiles.length; index++) {
			const sourceFile = this.sourceFiles[index]!;
			typedSourceFiles.push(this.compileSourceFile(sourceFile, compileOptions));
		}
		return typedSourceFiles;
	}
	private compileSourceFile(sourceFile: SourceFile, compileOptions: CompileOptions): TypedSourceFile {
		const lexer = new Lexer(sourceFile.source);
		const tokens = lexer.readSource();
		if (compileOptions.flags.tokens)
			console.log(
				chalk.greenBright(
					"======================================================\n " +
						chalk.underlineWhite("Tokens") +
						"\n======================================================\n\n" +
						JSON.stringify(tokens)
				)
			);

		const parser = new Parser(tokens, sourceFile.name);
		const AST = parser.parse();
		if (compileOptions.flags.ast)
			console.log(
				chalk.greenBright(
					"======================================================\n " +
						chalk.underlineWhite("Abstract Syntax Tree") +
						"\n======================================================\n\n" +
						JSON.stringify(AST)
				)
			);

		const binder = new Binder(AST);
		binder.bind();

		const typeChecker = new TypeChecker(AST, binder.globalEnvironment, binder.globalScope, binder);
		const typedAST = typeChecker.typeCheck();
		return this.createTypedSourceFile(sourceFile, typedAST, binder);
	}
	private createTypedSourceFile(sourceFile: SourceFile, typedAST: TypedASTType, binder: Binder): TypedSourceFile {
		return {
			path: sourceFile.path,
			name: sourceFile.name,
			source: sourceFile.source,
			typedAST: typedAST,
			binder: binder,
		};
	}
}
