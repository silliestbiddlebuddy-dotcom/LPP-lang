import type {
	ASTType,
	Block,
	Declaration,
	FunctionDeclaration,
	Node,
	Parameter,
	Program,
	Statement,
	VariableDeclaration,
	Property as PropertyNode,
	GenericParameter,
	ClassDeclaration,
	InterfaceDeclaration,
	UserDefinedTypeDeclaration,
} from "../../Parser/Parser.types.ts";
import type { Method, Object, Property, UserDefinedType } from "../Environment/Builtins.ts";
import { TypeEnvironment } from "../Environment/TypeEnvironment.ts";
import { TypeChecker } from "../TypeChecker/TypeChecker.ts";
import { ScopeTable } from "./Scope.ts";
import type { ClassSymbol } from "./Symbol.ts";
export type BlockLikeScope = Block | ClassDeclaration | InterfaceDeclaration | UserDefinedTypeDeclaration;
export class Binder {
	private globalScope: ScopeTable;
	private currentScope: ScopeTable;

	private globalEnvironment: TypeEnvironment;
	private currentEnvironment: TypeEnvironment;

	private typeChecker: TypeChecker;

	public readonly scopes: Map<BlockLikeScope, ScopeTable>;
	public readonly environments: Map<BlockLikeScope, TypeEnvironment>;
	public readonly AST: ASTType;

	constructor(AST: ASTType) {
		this.globalScope = new ScopeTable({});
		this.currentScope = this.globalScope;

		this.globalEnvironment = new TypeEnvironment({});
		this.currentEnvironment = this.globalEnvironment;

		this.typeChecker = new TypeChecker(AST, this.currentEnvironment, this.currentScope, this);

		this.scopes = new Map<BlockLikeScope, ScopeTable>();
		this.environments = new Map<BlockLikeScope, TypeEnvironment>();

		this.AST = AST;
	}
	public bind() {
		const program: Program = this.AST[0];
		for (let index = 0; index < program.body.length; index++) {
			const statement = program.body[index]! as Statement;
			this.bindStatement(statement);
		}

		this.typeChecker.typeCheck();
	}
	private bindStatement(node: Statement) {
		switch (node.type) {
			case "VariableDeclaration": {
				this.currentScope.declareSymbol(node.name, {
					kind: "Variable",
					name: node.name,
					declaration: node,
					constant: node.constant,
				});
				break;
			}
			case "FunctionDeclaration": {
				this.currentScope.declareSymbol(node.name.value, {
					kind: "Function",
					name: node.name.value,
					declaration: node,
				});

				const functionEnvironment = new TypeEnvironment({ parent: this.currentEnvironment });
				this.environments.set(node.body, functionEnvironment);
				const oldEnv = this.currentEnvironment;
				this.currentEnvironment = functionEnvironment;

				const functionScope = new ScopeTable({ parent: this.currentScope });
				this.scopes.set(node.body, functionScope);
				this.bindGenerics(node.genericParameters, functionEnvironment);
				this.bindParameters(node.parameters, functionScope);
				this.bindBlock(node.body, functionScope);
				this.currentEnvironment = oldEnv;
				break;
			}
			case "ClassDeclaration": {
				const classSymbol: ClassSymbol = {
					kind: "Class",
					name: node.identifier,
					declaration: node,
				};
				this.currentScope.declareSymbol(node.identifier, classSymbol);

				this.currentEnvironment.declareType(node.identifier, classSymbol);
				const classEnvironment = new TypeEnvironment({ parent: this.currentEnvironment });
				this.environments.set(node, classEnvironment);
				const oldEnv = this.currentEnvironment;
				this.currentEnvironment = classEnvironment;

				const classScope = new ScopeTable({ parent: this.currentScope });
				this.bindGenerics(node.genericTypeParameters, classEnvironment);
				this.bindMembers({ properties: node.properties, methods: node.methods }, classScope);

				this.scopes.set(node, classScope);
				this.currentEnvironment = oldEnv;
				break;
			}
			case "IfStatement": {
				this.bindBlock(node.body, this.currentScope);
				for (let index = 0; index < node.elseIfs.length; index++) {
					const elseif = node.elseIfs[index]!;
					this.bindBlock(elseif.body, this.currentScope);
				}

				if (node.else) this.bindBlock(node.else, this.currentScope);
				break;
			}
			case "ForStatement": {
				const forScope = new ScopeTable({ parent: this.currentScope });
				forScope.declareSymbol(node.initializer.name, {
					kind: "Variable",
					name: node.initializer.name,
					declaration: node.initializer,
					constant: node.initializer.constant,
				});
				this.bindBlock(node.body, forScope);
				break;
			}
			case "WhileStatement": {
				this.bindBlock(node.body, this.currentScope);
				break;
			}

			case "UserDefinedTypeDeclaration": {
				const typeEnvironment = new TypeEnvironment({ parent: this.currentEnvironment });
				this.environments.set(node, typeEnvironment);
				const oldEnv = this.currentEnvironment;
				this.currentEnvironment = typeEnvironment;
				this.bindGenerics(node.genericTypeParameters, typeEnvironment);

				this.currentEnvironment.declareType(node.identifier, {
					kind: "UserDefinedType",
					name: node.identifier,
					declaration: node,
				});

				this.currentEnvironment = oldEnv;
				break;
			}

			case "InterfaceDeclaration": {
				const interfaceEnvironment = new TypeEnvironment({ parent: this.currentEnvironment });
				this.environments.set(node, interfaceEnvironment);
				const oldEnv = this.currentEnvironment;
				this.currentEnvironment = interfaceEnvironment;
				this.bindGenerics(node.genericTypeParameters, interfaceEnvironment);

				this.currentEnvironment.declareType(node.identifier, {
					kind: "Interface",
					name: node.identifier,
					declaration: node,
				});

				this.currentEnvironment = oldEnv;
				break;
			}
			case "TypeAliasDeclaration": {
				this.currentEnvironment.declareType(node.alias, {
					kind: "TypeAlias",
					name: node.alias,
					declaration: node,
				});
				break;
			}
			case "ElseifStatement":
			case "ReturnStatement":
			case "AssignmentStatement":
			case "BreakStatement":
			case "ContinueStatement":
			default:
				break;
		}
	}

	private bindBlock(node: Block, scope: ScopeTable) {
		const localScope = new ScopeTable({ parent: scope });
		this.scopes.set(node, localScope);
		const oldScope = this.currentScope;
		this.currentScope = localScope;

		for (let index = 0; index < node.body.length; index++) {
			const statement = node.body[index]! as Statement;
			this.bindStatement(statement);
		}

		this.currentScope = oldScope;
	}
	private bindParameters(parameters: Parameter[], scope: ScopeTable) {
		for (let index = 0; index < parameters.length; index++) {
			const parameter = parameters[index]!;
			scope.declareSymbol(parameter.name.value, {
				kind: "Parameter",
				name: parameter.name.value,
				declaration: parameter,
			});
		}
	}
	private bindMembers(members: { properties: PropertyNode[]; methods: FunctionDeclaration[] }, scope: ScopeTable) {
		for (let index = 0; index < members.properties.length; index++) {
			const property = members.properties[index]!;
			scope.declareSymbol(property.identifier, {
				kind: "Property",
				name: property.identifier,
				declaration: property,
			});
		}
		for (let index = 0; index < members.methods.length; index++) {
			const method = members.methods[index]!;
			const oldEnv = this.currentEnvironment;
			const methodEnvironment = new TypeEnvironment({ parent: this.currentEnvironment });
			this.currentEnvironment = methodEnvironment;
			this.environments.set(method.body, methodEnvironment);
			scope.declareSymbol(method.name.value, {
				kind: "Method",
				name: method.name.value,
				declaration: method,
			});
			const methodScope = new ScopeTable({ parent: scope });
			this.scopes.set(method.body, methodScope);
			this.bindGenerics(method.genericParameters, methodEnvironment);
			this.bindParameters(method.parameters, methodScope);
			this.bindBlock(method.body, methodScope);
			this.currentEnvironment = oldEnv;
		}
	}
	private bindGenerics(generics: GenericParameter[], environment: TypeEnvironment) {
		for (let index = 0; index < generics.length; index++) {
			const generic = generics[index]!;
			environment.declareType(generic.identifier, {
				kind: "GenericParameter",
				name: generic.identifier,
				declaration: generic,
			});
		}
	}
}
