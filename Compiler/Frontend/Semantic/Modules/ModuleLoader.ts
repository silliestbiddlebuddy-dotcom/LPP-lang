import { Lexer } from "../../Lexer/Lexer.ts";
import { isExportedDeclaration, isImport } from "../../Parser/ASTGuards.ts";
import { Parser } from "../../Parser/Parser.ts";
import { NodeKind, type DeclarationUnion, type Import, type Program } from "../../Parser/Parser.types.ts";
import { Module } from "./Module.ts";
import { ModuleGraph } from "./ModuleGraph.ts";
import { ModuleRegistry } from "./ModuleRegistry.ts";
import * as fs from "node:fs";
import * as path from "node:path";
import { ModuleResolver } from "./ModuleResolver.ts";
type ImportPair = { importer: string; specifier: string };
export class ModuleLoader {
	private registry: ModuleRegistry = new ModuleRegistry();
	private graph: ModuleGraph = new ModuleGraph();
	public resolver: ModuleResolver = new ModuleResolver();
	public loadModule(filePath: string): Module {
		if (this.registry.hasModule(filePath)) {
			const module = this.registry.retrieveModule(filePath)!;
			if (module.getState() === "Failed") throw module.storedError!;
			return module;
		}
		const text = fs.readFileSync(filePath, "utf-8");
		const lexer = new Lexer(text);
		const tokens = lexer.readSource();
		const parser = new Parser(tokens, path.basename(filePath, path.extname(filePath)), text);
		const AST = parser.parse();
		const program = AST[0]!;

		const exports: DeclarationUnion[] = [];
		for (let index = 0; index < program.body.length; index++) {
			const element = program.body[index]!;
			if (isExportedDeclaration(element)) exports.push(element);
		}

		const module = new Module(filePath, AST, new Map<string, Module>(), exports, "source");
		this.graph.addModule(module, new Set<string>());
		module.changeState("Loading");
		this.registry.registerModule(module);

		try {
			const imports = this.loadDependencies(program, filePath);

			module.setImports(imports);
			module.changeState("Loaded");

			return module;
		} catch (error) {
			module.changeState("Failed");
			throw error;
		}
	}
	private loadDependencies(program: Program, from: string): Map<string, Module> {
		const imports: Map<string, Module> = new Map<string, Module>();
		for (let index = 0; index < program.body.length; index++) {
			const element = program.body[index]!;
			if (!isImport(element)) continue;
			let fullPath: string;
			switch (element.type) {
				case NodeKind.ImportSourceStatement:
					fullPath = this.resolver.resolvePath(from, element.source, element)!;
					break;
				case NodeKind.ImportStdlibStatement:
					fullPath = this.resolver.resolvePath(from, element.stdlib, element)!;
					break;
			}
			this.graph.addDependency(from, fullPath);
			imports.set(fullPath, this.loadModule(fullPath));
		}
		return imports;
	}
}
