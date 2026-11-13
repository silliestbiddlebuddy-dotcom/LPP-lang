import { llvmSymbolTable } from "../../../Declarations.ts";
import { LPPTypeError } from "../../Errors/LPPTypeError.ts";
import { LPPModuleNotFoundError } from "../../Errors/Modules/LPPModuleNotFoundError.ts";
import {
	type ASTType,
	type Block,
	type Declaration,
	type FunctionDeclaration,
	type Node,
	type Parameter,
	type Program,
	type Statement,
	type VariableDeclaration,
	type Property as PropertyNode,
	type GenericParameter,
	type ClassDeclaration,
	type InterfaceDeclaration,
	type UserDefinedTypeDeclaration,
	type FunctionCallExpression,
	type Import,
	type DeclarationUnion,
	type Expression,
	NodeKind,
} from "../../Parser/Parser.types.ts";
import { BuiltinTypes, type Method, type Object, type Property, type UserDefinedType } from "../Environment/Builtins.ts";
import { TypeEnvironment } from "../Environment/TypeEnvironment.ts";
import { Module } from "../Modules/Module.ts";
import type { ModuleResolver } from "../Modules/ModuleResolver.ts";
import { TypeChecker } from "../TypeChecker/TypeChecker.ts";
import { ScopeTable } from "./Scope.ts";
import type { ClassSymbol, ImportedSymbol, Symbol } from "./Symbol.ts";
export type BlockLikeScope = Block | ClassDeclaration | InterfaceDeclaration | UserDefinedTypeDeclaration;
export interface ModuleBinder {
	globalScope: ScopeTable;
	currentScope: ScopeTable;

	globalEnvironment: TypeEnvironment;
	currentEnvironment: TypeEnvironment;

	readonly scopes: Map<BlockLikeScope, ScopeTable>;
	readonly environments: Map<BlockLikeScope, TypeEnvironment>;
}

export class Binder {
	public globalScope: ScopeTable;
	public globalEnvironment: TypeEnvironment;
	public modules: Module[];
	public moduleBinders: Map<Module, ModuleBinder> = new Map<Module, ModuleBinder>();
	private moduleResolver: ModuleResolver;
	private imports: Import[] = [];

	constructor(modules: Module[], moduleResolver: ModuleResolver) {
		this.globalScope = new ScopeTable({});

		for (const value of Object.values(llvmSymbolTable)) {
			this.globalScope.declareSymbol(value.symbol.name, value.symbol);
		}

		this.globalEnvironment = new TypeEnvironment({
			builtin: BuiltinTypes,
		});
		this.modules = modules;
		this.moduleResolver = moduleResolver;
	}
	public bind() {
		for (let index = 0; index < this.modules.length; index++) {
			const module = this.modules[index]!;
			const globalEnvironment = new TypeEnvironment({ parent: this.globalEnvironment });
			const globalScope = new ScopeTable({ parent: this.globalScope });
			const moduleBinder: ModuleBinder = {
				globalEnvironment,
				globalScope,
				currentEnvironment: globalEnvironment,
				currentScope: globalScope,
				scopes: new Map<BlockLikeScope, ScopeTable>(),
				environments: new Map<BlockLikeScope, TypeEnvironment>(),
			};
			this.moduleBinders.set(module, moduleBinder);
			this.bindModule(moduleBinder, module);
		}
		this.bindImports();
	}
	private bindModule(moduleBinder: ModuleBinder, module: Module) {
		const program: Program = module.AST[0];
		for (let index = 0; index < program.body.length; index++) {
			const statement = program.body[index]! as Statement | FunctionCallExpression;
			this.bindStatement(statement, moduleBinder);
		}
	}

	private bindStatement(node: Statement | FunctionCallExpression, moduleBinder: ModuleBinder) {
		switch (node.type) {
			case NodeKind.VariableDeclaration: {
				moduleBinder.currentScope.declareSymbol(node.name, {
					kind: "Variable",
					name: node.name,
					declaration: node,
					constant: node.constant,
					scope: moduleBinder.currentScope,
				});
				break;
			}
			case NodeKind.FunctionDeclaration: {
				moduleBinder.currentScope.declareSymbol(node.name.value, {
					kind: "Function",
					name: node.name.value,
					declaration: node,
					scope: moduleBinder.currentScope,
				});

				const functionEnvironment = new TypeEnvironment({ parent: moduleBinder.currentEnvironment });
				moduleBinder.environments.set(node.body, functionEnvironment);
				const oldEnv = moduleBinder.currentEnvironment;
				moduleBinder.currentEnvironment = functionEnvironment;

				const functionScope = new ScopeTable({ parent: moduleBinder.currentScope });
				moduleBinder.scopes.set(node.body, functionScope);
				this.bindGenerics(node.genericParameters, functionEnvironment, moduleBinder);
				this.bindParameters(node.parameters, functionScope, moduleBinder);
				this.bindBlock(node.body, functionScope, moduleBinder);
				moduleBinder.currentEnvironment = oldEnv;
				break;
			}
			case NodeKind.ClassDeclaration: {
				const classSymbol: ClassSymbol = {
					kind: "Class",
					name: node.identifier,
					declaration: node,
					scope: moduleBinder.currentScope,
					environment: moduleBinder.currentEnvironment,
				};
				moduleBinder.currentScope.declareSymbol(node.identifier, classSymbol);

				moduleBinder.currentEnvironment.declareType(node.identifier, classSymbol);
				const classEnvironment = new TypeEnvironment({ parent: moduleBinder.currentEnvironment });
				moduleBinder.environments.set(node, classEnvironment);
				const oldEnv = moduleBinder.currentEnvironment;
				moduleBinder.currentEnvironment = classEnvironment;

				const classScope = new ScopeTable({ parent: moduleBinder.currentScope });
				this.bindGenerics(node.genericTypeParameters, classEnvironment, moduleBinder);
				this.bindMembers({ properties: node.properties, methods: node.methods }, classScope, moduleBinder);

				moduleBinder.scopes.set(node, classScope);
				moduleBinder.currentEnvironment = oldEnv;
				break;
			}
			case NodeKind.IfStatement: {
				this.bindBlock(node.body, moduleBinder.currentScope, moduleBinder);
				for (let index = 0; index < node.elseIfs.length; index++) {
					const elseif = node.elseIfs[index]!;
					this.bindBlock(elseif.body, moduleBinder.currentScope, moduleBinder);
				}

				if (node.else) this.bindBlock(node.else, moduleBinder.currentScope, moduleBinder);
				break;
			}
			case NodeKind.ForStatement: {
				const forScope = new ScopeTable({ parent: moduleBinder.currentScope });
				forScope.declareSymbol(node.initializer.name, {
					kind: "Variable",
					name: node.initializer.name,
					declaration: node.initializer,
					constant: node.initializer.constant,
					scope: moduleBinder.currentScope,
				});
				this.bindBlock(node.body, forScope, moduleBinder);
				break;
			}
			case NodeKind.WhileStatement: {
				this.bindBlock(node.body, moduleBinder.currentScope, moduleBinder);
				break;
			}

			case NodeKind.UserDefinedTypeDeclaration: {
				const typeEnvironment = new TypeEnvironment({ parent: moduleBinder.currentEnvironment });
				moduleBinder.environments.set(node, typeEnvironment);
				const oldEnv = moduleBinder.currentEnvironment;
				moduleBinder.currentEnvironment = typeEnvironment;
				this.bindGenerics(node.genericTypeParameters, typeEnvironment, moduleBinder);

				moduleBinder.currentEnvironment.declareType(node.identifier, {
					kind: "UserDefinedType",
					name: node.identifier,
					declaration: node,
					environment: moduleBinder.currentEnvironment,
				});

				moduleBinder.currentEnvironment = oldEnv;
				break;
			}

			case NodeKind.InterfaceDeclaration: {
				const interfaceEnvironment = new TypeEnvironment({ parent: moduleBinder.currentEnvironment });
				moduleBinder.environments.set(node, interfaceEnvironment);
				const oldEnv = moduleBinder.currentEnvironment;
				moduleBinder.currentEnvironment = interfaceEnvironment;
				this.bindGenerics(node.genericTypeParameters, interfaceEnvironment, moduleBinder);

				moduleBinder.currentEnvironment.declareType(node.identifier, {
					kind: "Interface",
					name: node.identifier,
					declaration: node,
					environment: moduleBinder.currentEnvironment,
				});

				moduleBinder.currentEnvironment = oldEnv;
				break;
			}
			case NodeKind.TypeAliasDeclaration: {
				moduleBinder.currentEnvironment.declareType(node.alias, {
					kind: "TypeAlias",
					name: node.alias,
					declaration: node,
					environment: moduleBinder.currentEnvironment,
				});
				break;
			}
			case NodeKind.ImportSourceStatement:
				this.imports.push(node);
				break;
			case NodeKind.ImportStdlibStatement:
				this.imports.push(node);
				break;
			case NodeKind.ElseifStatement:
			case NodeKind.ReturnStatement:
			case NodeKind.AssignmentStatement:
			case NodeKind.BreakStatement:
			case NodeKind.ContinueStatement:
			case NodeKind.FunctionCallExpression:
			default:
				break;
		}
	}
	private bindImports() {
		for (let index = 0; index < this.imports.length; index++) {
			const importStatement = this.imports[index]!;
		}
	}
	private bindImportStatement(importStatement: Import, module: Module, moduleBinder: ModuleBinder) {
		switch (importStatement.type) {
			case NodeKind.ImportSourceStatement: {
				for (let index = 0; index < importStatement.imports.length; index++) {
					const name = importStatement.imports[index]!;
					const path = this.moduleResolver.resolvePath(module.filePath, importStatement.source, importStatement);
					const importedModule = module.getImports().get(path!);
					if (!importedModule) throw new LPPModuleNotFoundError("Module " + name + " not found.");
					const exportedDeclaration = importedModule.findExportWithName(name.value);
					if (!exportedDeclaration) throw new LPPTypeError("Declaration " + name + " could not be found (or isn't exported) in module " + importStatement.source);
					const importedModuleBinder = this.moduleBinders.get(importedModule);
					if (!importedModuleBinder) throw new LPPModuleNotFoundError("Module " + name + " not found.");
					const importedSymbol = this.getSymbolFromNode(exportedDeclaration, importedModuleBinder);
					if (!importedSymbol) throw new LPPTypeError("Couldn't find imported symbol.");
					const symbol: ImportedSymbol = {
						kind: "Import",
						name: name.value,
						symbol: importedSymbol,
						scope: importedModuleBinder.currentScope,
						environment: importedModuleBinder.currentEnvironment,
					};
					moduleBinder.currentScope.declareSymbol(name.value, symbol);
				}
				break;
			}

			case NodeKind.ImportStdlibStatement: {
				for (let index = 0; index < importStatement.imports.length; index++) {
					const name = importStatement.imports[index]!;
					const path = this.moduleResolver.resolvePath(module.filePath, importStatement.stdlib, importStatement);
					const importedModule = module.getImports().get(path!);
					if (!importedModule) throw new LPPModuleNotFoundError("Module " + name + " not found.");
					const exportedDeclaration = importedModule.findExportWithName(name.value);
					if (!exportedDeclaration) throw new LPPTypeError("Declaration " + name + " could not be found (or isn't exported) in module " + importStatement.stdlib);
					const importedModuleBinder = this.moduleBinders.get(importedModule);
					if (!importedModuleBinder) throw new LPPModuleNotFoundError("Module " + name + " not found.");
					const importedSymbol = this.getSymbolFromNode(exportedDeclaration, importedModuleBinder);
					if (!importedSymbol) throw new LPPTypeError("Couldn't find imported symbol.");
					const symbol: ImportedSymbol = {
						kind: "Import",
						name: name.value,
						symbol: importedSymbol,
						scope: importedModuleBinder.currentScope,
						environment: importedModuleBinder.currentEnvironment,
					};
					moduleBinder.currentScope.declareSymbol(name.value, symbol);
				}
				break;
			}
		}
	}
	private getSymbolFromNode(node: DeclarationUnion | Statement | Expression, moduleBinder: ModuleBinder): Symbol | null {
		switch (node.type) {
			case NodeKind.VariableDeclaration: {
				return moduleBinder.currentScope.lookup(node.name);
			}

			case NodeKind.ClassDeclaration: {
				return moduleBinder.currentScope.lookup(node.identifier);
			}
			case NodeKind.FunctionDeclaration: {
				return moduleBinder.currentScope.lookup(node.name.value);
			}
			case NodeKind.Identifier: {
				return moduleBinder.currentScope.lookup(node.value);
			}
			case NodeKind.UserDefinedTypeDeclaration:
				return moduleBinder.currentEnvironment.lookup(node.identifier);
			case NodeKind.InterfaceDeclaration:
				return moduleBinder.currentEnvironment.lookup(node.identifier);
			case NodeKind.TypeAliasDeclaration:
				return moduleBinder.currentEnvironment.lookup(node.alias);
			case NodeKind.IfStatement:
			case NodeKind.ElseifStatement:
			case NodeKind.ReturnStatement:
			case NodeKind.BreakStatement:
			case NodeKind.ContinueStatement:
			case NodeKind.ForStatement:
			case NodeKind.WhileStatement:
			case NodeKind.AssignmentStatement:
			case NodeKind.NumberLiteral:
			case NodeKind.BooleanLiteral:
			case NodeKind.StringLiteral:
			case NodeKind.BinaryExpression:
			case NodeKind.PrefixUnaryExpression:
			case NodeKind.PostfixUnaryExpression:
			case NodeKind.MemberAccessExpression:
			case NodeKind.FunctionCallExpression:
			case NodeKind.ArrayLiteralExpression:
			case NodeKind.IndexExpression:
			case NodeKind.AssertionExpression:
			case NodeKind.ObjectExpression:
			default:
				return null;
		}
	}
	private bindBlock(node: Block, scope: ScopeTable, moduleBinder: ModuleBinder) {
		const localScope = new ScopeTable({ parent: scope });
		moduleBinder.scopes.set(node, localScope);
		const oldScope = moduleBinder.currentScope;
		moduleBinder.currentScope = localScope;

		for (let index = 0; index < node.body.length; index++) {
			const statement = node.body[index]! as Statement;
			this.bindStatement(statement, moduleBinder);
		}

		moduleBinder.currentScope = oldScope;
	}
	private bindParameters(parameters: Parameter[], scope: ScopeTable, moduleBinder: ModuleBinder) {
		for (let index = 0; index < parameters.length; index++) {
			const parameter = parameters[index]!;
			scope.declareSymbol(parameter.name.value, {
				kind: "Parameter",
				name: parameter.name.value,
				declaration: parameter,
				scope: moduleBinder.currentScope,
			});
		}
	}
	private bindMembers(members: { properties: PropertyNode[]; methods: FunctionDeclaration[] }, scope: ScopeTable, moduleBinder: ModuleBinder) {
		for (let index = 0; index < members.properties.length; index++) {
			const property = members.properties[index]!;
			scope.declareSymbol(property.identifier, {
				kind: "Property",
				name: property.identifier,
				declaration: property,
				scope: moduleBinder.currentScope,
			});
		}
		for (let index = 0; index < members.methods.length; index++) {
			const method = members.methods[index]!;
			const oldEnv = moduleBinder.currentEnvironment;
			const methodEnvironment = new TypeEnvironment({ parent: moduleBinder.currentEnvironment });
			moduleBinder.currentEnvironment = methodEnvironment;
			moduleBinder.environments.set(method.body, methodEnvironment);
			scope.declareSymbol(method.name.value, {
				kind: "Method",
				name: method.name.value,
				declaration: method,
				scope: moduleBinder.currentScope,
			});
			const methodScope = new ScopeTable({ parent: scope });
			moduleBinder.scopes.set(method.body, methodScope);
			this.bindGenerics(method.genericParameters, methodEnvironment, moduleBinder);
			this.bindParameters(method.parameters, methodScope, moduleBinder);
			this.bindBlock(method.body, methodScope, moduleBinder);
			moduleBinder.currentEnvironment = oldEnv;
		}
	}
	private bindGenerics(generics: GenericParameter[], environment: TypeEnvironment, moduleBinder: ModuleBinder) {
		for (let index = 0; index < generics.length; index++) {
			const generic = generics[index]!;
			environment.declareType(generic.identifier, {
				kind: "GenericParameter",
				name: generic.identifier,
				declaration: generic,
				scope: moduleBinder.currentScope,
			});
		}
	}
}
