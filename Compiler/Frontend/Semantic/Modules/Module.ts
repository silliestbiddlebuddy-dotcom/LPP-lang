import { NodeKind, type ASTType, type DeclarationUnion, type Import, type ImportSourceStatement, type ImportStdlibStatement } from "../../Parser/Parser.types.ts";
export type ProcessingState = "Loading" | "Loaded" | "Failed";
type ModuleOrigin = "source" | "stdlib" | "native";

export class Module {
	public readonly filePath: string;
	public readonly origin: ModuleOrigin;
	public readonly AST: ASTType;

	private imports: Map<string, Module>;
	public storedError: Error | undefined;
	private readonly exports: DeclarationUnion[];
	private state: ProcessingState = "Loading";
	constructor(filePath: string, AST: ASTType, imports: Map<string, Module>, exports: DeclarationUnion[], origin: ModuleOrigin) {
		this.origin = origin;
		this.filePath = filePath;
		this.AST = AST;
		this.imports = imports;
		this.exports = exports;
	}
	public setImports(imports: Map<string, Module>): void {
		this.imports = imports;
	}
	public addImport(path: string, importStatement: Module): void {
		this.imports.set(path, importStatement);
	}
	public getImports(): Map<string, Module> {
		return this.imports;
	}
	public getExports(): DeclarationUnion[] {
		return this.exports;
	}
	public findExportWithName(name: string): DeclarationUnion | undefined {
		for (let index = 0; index < this.exports.length; index++) {
			const element = this.exports[index]!;
			switch (element.type) {
				case NodeKind.VariableDeclaration:
				case NodeKind.FunctionDeclaration: {
					if (element.name === name) {
						return element;
					} else continue;
				}

				case NodeKind.UserDefinedTypeDeclaration:
				case NodeKind.InterfaceDeclaration:
				case NodeKind.ClassDeclaration: {
					if (element.identifier === name) {
						return element;
					} else continue;
				}
				case NodeKind.TypeAliasDeclaration: {
					if (element.alias === name) {
						return element;
					} else continue;
				}
			}
		}
	}
	public changeState(to: ProcessingState): void {
		this.state = to;
	}
	public failModule(error: Error): void {
		this.changeState("Failed");
		this.storedError = error;
	}
	public getState(): ProcessingState {
		return this.state;
	}
}
