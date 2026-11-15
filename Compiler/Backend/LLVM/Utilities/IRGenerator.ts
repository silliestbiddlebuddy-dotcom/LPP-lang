import { TextEncoder } from "node:util";
import type {
	TypedAssignmentStatement,
	TypedASTType,
	TypedBreakStatement,
	TypedClassDeclaration,
	TypedContinueStatement,
	TypedElseifStatement,
	TypedForStatement,
	TypedFunctionDeclaration,
	TypedIfStatement,
	TypedImportSourceStatement,
	TypedImportStdlibStatement,
	TypedInterfaceDeclaration,
	TypedReturnStatement,
	TypedStatement,
	TypedTypeAliasDeclaration,
	TypedUserDefinedTypeDeclaration,
	TypedVariableDeclaration,
	TypedWhileStatement,
} from "../../../Frontend/Semantic/TypeChecker/TypedAST.ts";
import { NodeKind, type ElseifStatement } from "../../../Frontend/Parser/Parser.types.ts";
type CleanTypedStatement = Exclude<TypedStatement, ElseifStatement>;

class FunctionContext {
	public stringCounter: number = 0;
	public tempCounter: number = 0;
	public name: string;
	public labelCounter: number = 0;
	public code: string[] = [];
	constructor(name: string, code: string[]) {
		this.name = name;
		this.code = code;
	}
}

class IRGenerator {
	private encoder: TextEncoder = new TextEncoder();
	private globals: string[] = [];
	private declarations: string[] = [];
	private mainFunction: FunctionContext = new FunctionContext("main", []);
	private code: string[] = [];
	private currentFunction: FunctionContext = this.mainFunction;
	public generateIR(typedAST: TypedASTType): string {
		const program = typedAST[0]!;
		for (let index = 0; index < program.body.length; index++) {
			const node = program.body[index]!;
			this.generateStatementIR(node as CleanTypedStatement);
		}
		const declarations = this.declarations.join("\n") + "\n\n";
		const globals = this.globals.join("\n") + "\n\n";
		const mainFunction = this.mainFunction.code.join("\n") + "\n\n";
		const code = this.code.join("\n") + "\n\n";
		return `${declarations}${globals}${mainFunction}${code}`;
	}
	private changeFunctionContext(newFunction: FunctionContext): void {
		this.currentFunction = newFunction;
	}

	private generateStatementIR(node: CleanTypedStatement): void {
		switch (node.type) {
			case NodeKind.IfStatement:
				this.generateIfStatementIR(node);
				break;
			case NodeKind.VariableDeclaration:
				this.generateVariableDeclarationIR(node);
				break;
			case NodeKind.ClassDeclaration:
				this.generateClassDeclarationIR(node);
				break;
			case NodeKind.FunctionDeclaration:
				this.generateFunctionDeclarationIR(node);
				break;
			case NodeKind.UserDefinedTypeDeclaration:
				this.generateUserDefinedTypeDeclarationIR(node);
				break;
			case NodeKind.TypeAliasDeclaration:
				this.generateTypeAliasDeclarationIR(node);
				break;
			case NodeKind.ReturnStatement:
				this.generateReturnStatementIR(node);
				break;
			case NodeKind.BreakStatement:
				this.generateBreakStatementIR(node);
				break;
			case NodeKind.ContinueStatement:
				this.generateContinueStatementIR(node);
				break;
			case NodeKind.ForStatement:
				this.generateForStatementIR(node);
				break;
			case NodeKind.WhileStatement:
				this.generateWhileStatementIR(node);
				break;
			case NodeKind.AssignmentStatement:
				this.generateAssignmentStatementIR(node);
				break;
			case NodeKind.InterfaceDeclaration:
				this.generateInterfaceDeclarationIR(node);
				break;
			case NodeKind.ImportSourceStatement:
				this.generateImportSourceStatementIR(node);
				break;
			case NodeKind.ImportStdlibStatement:
				this.generateImportStdlibStatementIR(node);
				break;
		}
	}

	private generateIfStatementIR(node: TypedIfStatement): void {}
	private generateElseifStatementIR(node: TypedElseifStatement): void {}
	private generateVariableDeclarationIR(node: TypedVariableDeclaration): void {}
	private generateFunctionDeclarationIR(node: TypedFunctionDeclaration): void {}
	private generateClassDeclarationIR(node: TypedClassDeclaration): void {}

	private generateTypeAliasDeclarationIR(node: TypedTypeAliasDeclaration): void {}
	private generateUserDefinedTypeDeclarationIR(node: TypedUserDefinedTypeDeclaration): void {}
	private generateInterfaceDeclarationIR(node: TypedInterfaceDeclaration): void {}

	private generateAssignmentStatementIR(node: TypedAssignmentStatement): void {}
	private generateForStatementIR(node: TypedForStatement): void {}
	private generateWhileStatementIR(node: TypedWhileStatement): void {}

	private generateImportSourceStatementIR(node: TypedImportSourceStatement): void {}\
	private generateImportStdlibStatementIR(node: TypedImportStdlibStatement): void {}

	private generateReturnStatementIR(node: TypedReturnStatement): void {}
	private generateBreakStatementIR(node: TypedBreakStatement): void {}
	private generateContinueStatementIR(node: TypedContinueStatement): void {}

	private createTemporary(): string {
		return `%temp${this.currentFunction.tempCounter++}`;
	}
	private createStringGlobal(text: string): string {
		const encodedText = this.encoder.encode(text);
		const stringName = `@str${this.currentFunction.stringCounter++}`;
		this.globals.push(`${stringName} = private unnamed_addr constant [${encodedText.byteLength + 1} x i8] c"${encodedText}\\00"`);
		return stringName;
	}
	private createGlobal(name: string, value: string, constant: boolean): string {
		this.globals.push(`@${name} = ${constant ? "constant" : "global"} ${value}`);
		return `@${name}`;
	}
}
