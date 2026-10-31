import { llvmSymbolTable } from "../../Declarations.ts";
import { LPPError } from "../../Frontend/Errors/LPPError.ts";
import type { Expression } from "../../Frontend/Parser/Parser.types.ts";
import type { Binder } from "../../Frontend/Semantic/Binder/Binder.ts";
import type { ScopeTable } from "../../Frontend/Semantic/Binder/Scope.ts";
import type { VariableSymbol } from "../../Frontend/Semantic/Binder/Symbol.ts";
import type { Type } from "../../Frontend/Semantic/Environment/Builtins.ts";
import type {
	TypedAssignmentStatement,
	TypedASTType,
	TypedElseifStatement,
	TypedExpression,
	TypedFunctionCallExpression,
	TypedStatement,
	TypedVariableDeclaration,
} from "../../Frontend/Semantic/TypeChecker/TypedAST.ts";
import { operatorToLLVM, typeToLLVM } from "./toLLVM.ts";

export class LLVMBackend {
	// Binder
	private binder: Binder;
	private currentScope: ScopeTable;
	// Formatting
	private indentLevel: number = 0;
	// IR
	private readonly runtimeDeclarations: string;
	private IRGlobals: string = "";
	private IRMainFunction = "";
	private IRCode: string = "";
	private temporaryLevel: number = 0;
	private expressionLevel: number = 0;
	private AST: TypedASTType;
	// Utilities
	private stringPool: Map<string, string> = new Map<string, string>();
	private stringCount: number = 0;

	constructor(binder: Binder, AST: TypedASTType) {
		this.binder = binder;
		this.currentScope = binder.globalScope;
		this.AST = AST;
		let declarations = "";
		for (const value of Object.values(llvmSymbolTable)) {
			declarations += value.llvm + "\n";
		}
		this.runtimeDeclarations = declarations;
		this.IRMainFunction = `define i32 @main() {\nentry:\n`;
	}
	// ============================================================================
	//  Utilities
	// ============================================================================
	private indent(text: string, tabWidth: number = 4, indentLevel: number = this.indentLevel) {
		return " ".repeat(indentLevel * tabWidth) + text;
	}
	private getOrCreateString(text: string): string {
		const existing = this.stringPool.get(text);
		if (existing !== undefined) return existing;

		const bytes = new TextEncoder().encode(text);
		const result = `@.str.${this.stringCount++}`;

		const escaped = Array.from(bytes)
			.map((byte) => `\\${byte.toString(16).toUpperCase().padStart(2, "0")}`)
			.join("");

		const length = bytes.length + 1;

		this.IRGlobals += `${result} = private unnamed_addr constant ` + `[${length} x i8] c"${escaped}\\00", align 1\n`;

		this.stringPool.set(text, result);
		return result;
	}
	// ============================================================================
	//  Program
	// ============================================================================
	public generate(): string {
		for (let index = 0; index < this.AST[0].body.length; index++) {
			const node = this.AST[0].body[index]!;
			this.constructStatement(node as Exclude<TypedStatement, TypedElseifStatement> | TypedFunctionCallExpression);
		}
		this.IRMainFunction += "    ret i32 0\n" + "}";
		return this.runtimeDeclarations + "\n" + this.IRGlobals + "\n" + this.IRMainFunction + "\n" + this.IRCode;
	}
	// ============================================================================
	//  Statements
	// ============================================================================
	private constructStatement(node: Exclude<TypedStatement, TypedElseifStatement> | TypedFunctionCallExpression): void {
		switch (node.type) {
			case "VariableDeclaration":
				this.IRMainFunction += this.indent(this.constructVariableDeclaration(node), 4, 1);
				return;
			case "AssignmentStatement":
				this.IRMainFunction += this.indent(this.constructAssignmentStatement(node), 4, 1);
				return;
			case "FunctionCallExpression":
				this.IRMainFunction += this.indent(this.constructFunctionCallExpression(node), 4, 1);
				return;

			case "IfStatement":
			case "ReturnStatement":
			case "BreakStatement":
			case "ContinueStatement":
			case "ForStatement":
			case "WhileStatement":

			case "FunctionDeclaration":
			case "UserDefinedTypeDeclaration":
			case "TypeAliasDeclaration":
			case "ClassDeclaration":
			case "InterfaceDeclaration":
				throw new LPPError("Not supported blah blah: " + node.type);
		}
	}
	private constructVariableDeclaration(node: TypedVariableDeclaration) {
		if (node.scope === "global") {
			//idk bro
			const text = this.indent(`@${node.name} = global ${typeToLLVM(node.resolvedType)} ${this.lowerValue}`);
			return text;
		} else {
			const text =
				this.indent(`%${node.name} = alloca ${typeToLLVM(node.resolvedType)}\n`) +
				this.indent(`store ${typeToLLVM(node.resolvedType)} ${this.lowerValue(node.initializer)}, ptr %${node.name}\n`);
			return text;
		}
	}
	private constructAssignmentStatement(node: TypedAssignmentStatement) {
		const text = this.indent(`store ${typeToLLVM(node.value.resolvedType)} ${this.lowerValue(node.value)}, ptr ${this.lowerAddress(node.target)}\n`);
		return text;
	}
	private constructFunctionCallExpression(node: TypedFunctionCallExpression) {
		const callee = this.lowerValue(node.callee);
		const length = node.arguments.length;
		let args = "";
		for (let index = 0; index < length; index++) {
			const element = node.arguments[index]!;
			args += `${typeToLLVM(element.value.resolvedType)} ${this.lowerValue(element.value)}${index + 1 === length ? "" : ", "}`;
		}

		return this.indent(`call ${typeToLLVM(node.resolvedType)} ${callee}(${args})\n`);
	}
	// ============================================================================
	//  Expressions
	// ============================================================================
	private lowerValue(value: TypedExpression): string {
		switch (value.type) {
			case "NumberLiteral":
				return "" + value.value;
			case "BooleanLiteral":
				return value.value === true ? "true" : "false";
			case "StringLiteral":
				return this.getOrCreateString(value.value);
			case "Identifier": {
				const symbol = this.currentScope.lookup(value.value)!;
				if (symbol.kind === "BuiltinDeclaration") return "@" + symbol.name;
				if (symbol.scope === this.binder.globalScope) {
					if (symbol.kind === "Variable") {
						return this.loadGlobal(value.value, value.resolvedType);
					} else return "@" + value.value;
				} else {
					if (symbol.kind === "Variable") {
						return this.loadLocal(value.value, value.resolvedType);
					} else return "%" + value.value;
				}
			}
			//needs refining
			case "BinaryExpression": {
				const left = this.lowerValue(value.left);
				const right = this.lowerValue(value.right);
				this.IRCode += this.indent(
					`%${this.expressionLevel++} = ${operatorToLLVM(value.operator, value.resolvedType)} ${typeToLLVM(value.left.resolvedType)} ${left}, ${right}`
				);
				return "%" + (this.expressionLevel - 1);
			}
			case "PrefixUnaryExpression": {
				switch (value.operator) {
					case "!": {
						const operand = this.lowerValue(value.value);
						this.IRCode += this.indent(
							`%${this.expressionLevel++} = ${operatorToLLVM(value.operator, value.value.resolvedType)} ${typeToLLVM(value.value.resolvedType)} ${operand}, true`
						);
						return "%" + (this.expressionLevel - 1);
					}

					case "-": {
						if (value.value.resolvedType.kind === "numberLiteral") return "-" + value.value.resolvedType.value;
						const operand = this.lowerValue(value.value);
						this.IRCode += this.indent(
							`%${this.expressionLevel++} = ${operatorToLLVM(value.operator, value.value.resolvedType)} ${typeToLLVM(value.value.resolvedType)} 0, ${operand}`
						);
						return "%" + (this.expressionLevel - 1);
					}
					case "++":
					case "--":
						throw new LPPError("Operator " + value.operator + " not supported (yet?)");
				}
			}
			case "AssertionExpression":
				return this.lowerValue(value.value);
			//methods todo
			case "FunctionCallExpression": {
				const callee = this.lowerValue(value.callee);
				const length = value.arguments.length;
				let args = "";
				for (let index = 0; index < length; index++) {
					const element = value.arguments[index]!;
					args += `${typeToLLVM(element.value.resolvedType)} ${this.lowerValue(element.value)}${index + 1 === length ? "" : ", "}`;
				}

				this.IRCode += this.indent(`%${this.expressionLevel++} = call ${typeToLLVM(value.resolvedType)} ${callee}(${args})`);
				return "%" + (this.expressionLevel - 1);
			}
			//need more work
			case "ArrayLiteralExpression":
			case "IndexExpression":
			case "ObjectExpression":
			case "ConstructorExpression":
			case "PostfixUnaryExpression":
			case "MemberAccessExpression":
				throw new LPPError("Expression " + value.type + " not supported");
		}
	}

	private lowerAddress(address: TypedExpression) {
		switch (address.type) {
			case "Identifier": {
				const symbol = this.currentScope.lookup(address.value)!;
				if (symbol.kind === "BuiltinDeclaration") return;
				if (symbol.scope === this.binder.globalScope) {
					return "@" + address.value;
				} else {
					return "%" + address.value;
				}
			}
			//isnt possible yet
			case "NumberLiteral":
			case "BooleanLiteral":
			case "StringLiteral":
			case "BinaryExpression":
			case "PrefixUnaryExpression":
			case "PostfixUnaryExpression":
			case "FunctionCallExpression":
			case "ArrayLiteralExpression":
			case "MemberAccessExpression":
			case "IndexExpression":
			case "AssertionExpression":
			case "ObjectExpression":
			case "ConstructorExpression":
				throw new LPPError("Expression " + address.type + " not supported");
		}
	}
	private loadGlobal(name: string, type: Type): string {
		return this.createTempVariable("load " + typeToLLVM(type) + ", ptr " + "@" + name);
	}
	private loadLocal(name: string, type: Type): string {
		return this.createTempVariable("load " + typeToLLVM(type) + ", ptr " + "%" + name);
	}
	private createTempVariable(value: string, location: string): string {
		this.IRCode += this.indent("%temp" + this.temporaryLevel + " = " + value) + "\n";
		this.temporaryLevel += 1;
		return "%temp" + (this.temporaryLevel - 1);
	}
}
