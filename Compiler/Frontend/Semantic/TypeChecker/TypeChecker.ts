import { LPPTypeError } from "../../Errors/LPPTypeError.ts";
import {
	NodeKind,
	type AssignmentStatement,
	type ASTType,
	type BinaryOperator,
	type Block,
	type ClassDeclaration,
	type Declaration,
	type DeclarationUnion,
	type ElseifStatement,
	type Expression,
	type ForStatement,
	type FunctionCallExpression,
	type FunctionDeclaration,
	type HierarchyType,
	type Identifier,
	type IfStatement,
	type ImportSourceStatement,
	type ImportStdlibStatement,
	type InterfaceDeclaration,
	type Node,
	type PrefixUnaryOperator,
	type ReturnStatement,
	type Statement,
	type TypeAliasDeclaration,
	type Type as TypeNode,
	type UserDefinedTypeDeclaration,
	type VariableDeclaration,
	type WhileStatement,
} from "../../Parser/Parser.types.ts";
import { Binder, type BlockLikeScope, type ModuleBinder } from "../Binder/Binder.ts";
import type { ScopeTable } from "../Binder/Scope.ts";
import type { ClassSymbol, Symbol } from "../Binder/Symbol.ts";
import {
	BinaryOperatorTable,
	floatingNumericTypes,
	integerNumericTypes,
	numericTypes,
	PrefixUnaryOperatorTable,
	type Class,
	type Function,
	type Interface,
	type Intersection,
	type Literal,
	type Method,
	type Object,
	type ObjectLike,
	type Parameter,
	type Property,
	type Type,
	type TypeParameter,
	type Union,
} from "../Environment/Builtins.ts";
import { TypeEnvironment } from "../Environment/TypeEnvironment.ts";
import type { Module } from "../Modules/Module.ts";
import { Resolver } from "../Resolver/Resolver.ts";
import { isLiteral, isNumber, isPrimitive } from "./Assignability.ts";
import {
	createTypedArgument,
	createTypedArrayLiteralExpression,
	createTypedAssertionExpression,
	createTypedAssignmentStatement,
	createTypedBinaryExpression,
	createTypedBlock,
	createTypedBooleanLiteral,
	createTypedBreakStatement,
	createTypedClassDeclaration,
	createTypedConstructorExpression,
	createTypedContinueStatement,
	createTypedElseifStatement,
	createTypedForStatement,
	createTypedFunctionCallExpression,
	createTypedFunctionDeclaration,
	createTypedFunctionType,
	createTypedGenericParameter,
	createTypedHierarchyType,
	createTypedIdentifier,
	createTypedIfStatement,
	createTypedImportSourceStatement,
	createTypedImportStdlibStatement,
	createTypedIndexExpression,
	createTypedInterfaceDeclaration,
	createTypedIntersectionType,
	createTypedMemberAccessExpression,
	createTypedNumberLiteral,
	createTypedObjectExpression,
	createTypedParameter,
	createTypedPostfixUnaryExpression,
	createTypedPrefixUnaryExpression,
	createTypedProgram,
	createTypedProperty,
	createTypedReturnStatement,
	createTypedStringLiteral,
	createTypedTypeAliasDeclaration,
	createTypedTypeReference,
	createTypedUnionType,
	createTypedUserDefinedTypeDeclaration,
	createTypedVariableDeclaration,
	createTypedWhileStatement,
	type TypedArgument,
	type TypedAssignmentStatement,
	type TypedASTType,
	type TypedBlock,
	type TypedClassDeclaration,
	type TypedElseifStatement,
	type TypedExpression,
	type TypedExpressionOf,
	type TypedForStatement,
	type TypedFunctionDeclaration,
	type TypedGenericParameter,
	type TypedHierarchyType,
	type TypedIfStatement,
	type TypedInterfaceDeclaration,
	type TypedNode,
	type TypedObject,
	type TypedParameter,
	type TypedProperty,
	type TypedReturnStatement,
	type TypedTypeAliasDeclaration,
	type TypedTypeNode,
	type TypedUserDefinedTypeDeclaration,
	type TypedVariableDeclaration,
	type TypedWhileStatement,
} from "./TypedAST.ts";

export interface ModuleTypeChecker {
	currentEnvironment: TypeEnvironment;
	currentScope: ScopeTable;
	module: Module;
	readonly AST: ASTType;
}

export type TypedModule = {
	module: Module;
	AST: TypedASTType;
};

export class TypeChecker {
	private binder: Binder;
	private resolver: Resolver;

	public moduleTypeCheckers: Map<Module, ModuleTypeChecker> = new Map<Module, ModuleTypeChecker>();
	public typedModules: Set<TypedModule> = new Set<TypedModule>();
	constructor(binder: Binder) {
		this.resolver = new Resolver();
		this.binder = binder;
	}

	// ===================================================
	//  Program
	// ===================================================
	public typeCheck() {
		for (let index = 0; index < this.binder.modules.length; index++) {
			const module = this.binder.modules[index]!;
			const moduleTypeChecker: ModuleTypeChecker = {
				AST: module.AST,
				currentEnvironment: this.binder.globalEnvironment,
				currentScope: this.binder.globalScope,
				module: module,
			};
			this.moduleTypeCheckers.set(module, moduleTypeChecker);
			this.typedModules.add(this.typeCheckModule(moduleTypeChecker, module));
		}
	}

	private typeCheckModule(moduleTypeChecker: ModuleTypeChecker, module: Module): TypedModule {
		const program = module.AST[0];
		const nodes: TypedNode[] = [];

		for (let index = 0; index < program.body.length; index++) {
			const node = program.body[index]!;
			nodes.push(this.checkStatement(node as Exclude<Statement, ElseifStatement> | FunctionCallExpression, moduleTypeChecker));
		}
		const typedModule: TypedModule = {
			module,
			AST: [createTypedProgram(program, nodes)],
		};
		return typedModule;
	}
	// ===================================================
	//  Statements
	// ===================================================

	private checkStatement(node: Exclude<Statement, ElseifStatement> | FunctionCallExpression, moduleTypeChecker: ModuleTypeChecker): TypedNode {
		switch (node.type) {
			case NodeKind.VariableDeclaration:
				return this.checkVariableDeclaration(node, moduleTypeChecker);
			case NodeKind.AssignmentStatement:
				return this.checkAssignmentStatement(node, moduleTypeChecker);
			case NodeKind.FunctionDeclaration:
				return this.checkFunctionDeclaration(node, moduleTypeChecker);
			case NodeKind.ForStatement:
				return this.checkForStatement(node, moduleTypeChecker);
			case NodeKind.WhileStatement:
				return this.checkWhileStatement(node, moduleTypeChecker);
			case NodeKind.IfStatement:
				return this.checkIfStatement(node, moduleTypeChecker);
			case NodeKind.UserDefinedTypeDeclaration:
				return this.checkUserDefinedTypeDeclaration(node, moduleTypeChecker);
			case NodeKind.TypeAliasDeclaration:
				return this.checkTypeAliasDeclaration(node, moduleTypeChecker);
			case NodeKind.ReturnStatement:
				return this.checkReturnStatement(node, moduleTypeChecker);

			//WIP
			case NodeKind.BreakStatement:
				return createTypedBreakStatement(node);
			case NodeKind.ContinueStatement:
				return createTypedContinueStatement(node);

			case NodeKind.InterfaceDeclaration:
				return this.checkInterfaceDeclaration(node, moduleTypeChecker);
			case NodeKind.ClassDeclaration:
				return this.checkClassDeclaration(node, moduleTypeChecker);
			case NodeKind.FunctionCallExpression:
				return this.createTypedExpression(
					node,
					this.resolver.resolveExpression(node, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
					moduleTypeChecker
				);
			case NodeKind.ImportSourceStatement:
				return this.checkImportSourceStatement(node);
			case NodeKind.ImportStdlibStatement:
				return this.checkImportStdlibStatement(node);
		}
	}
	private checkImportSourceStatement(node: ImportSourceStatement) {
		return createTypedImportSourceStatement(node);
	}
	private checkImportStdlibStatement(node: ImportStdlibStatement) {
		return createTypedImportStdlibStatement(node);
	}
	private checkForStatement(node: ForStatement, moduleTypeChecker: ModuleTypeChecker): TypedForStatement {
		const init = this.checkVariableDeclaration(node.initializer, moduleTypeChecker);
		const cond = this.createTypedExpression(
			node.condition,
			this.resolver.resolveExpression(node.condition, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
			moduleTypeChecker
		);
		const upd = this.checkAssignmentStatement(node.update, moduleTypeChecker);
		const body = this.typeCheckBlock(node.body, moduleTypeChecker);
		return createTypedForStatement(node, init, cond, upd, body);
	}
	private checkIfStatement(node: IfStatement, moduleTypeChecker: ModuleTypeChecker): TypedIfStatement {
		const cond = this.createTypedExpression(
			node.condition,
			this.resolver.resolveExpression(node.condition, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
			moduleTypeChecker
		);
		const body = this.typeCheckBlock(node.body, moduleTypeChecker);
		const elseIfs: TypedElseifStatement[] = [];
		for (let index = 0; index < node.elseIfs.length; index++) {
			const element = node.elseIfs[index]!;
			elseIfs.push(this.checkElseifStatement(element, moduleTypeChecker));
		}
		const elseBlock = node.else ? this.typeCheckBlock(node.else, moduleTypeChecker) : null;
		return createTypedIfStatement(node, cond, body, elseIfs, elseBlock);
	}
	private checkElseifStatement(node: ElseifStatement, moduleTypeChecker: ModuleTypeChecker): TypedElseifStatement {
		const cond = this.createTypedExpression(
			node.condition,
			this.resolver.resolveExpression(node.condition, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
			moduleTypeChecker
		);
		const body = this.typeCheckBlock(node.body, moduleTypeChecker);
		const elseIfs: TypedElseifStatement[] = [];

		return createTypedElseifStatement(node, cond, body);
	}
	private checkTypeAliasDeclaration(node: TypeAliasDeclaration, moduleTypeChecker: ModuleTypeChecker): TypedTypeAliasDeclaration {
		const resolvedType = this.resolver.resolveType(node.value, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment);
		const value = this.createTypedTypeNode(node.value, resolvedType, moduleTypeChecker);
		const parameters: TypedGenericParameter[] = [];
		for (let index = 0; index < node.parameters.length; index++) {
			const element = node.parameters[index]!;
			parameters.push(
				createTypedGenericParameter(
					element,
					this.createTypedTypeNode(
						element.value,
						this.resolver.resolveType(element.value, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					)
				)
			);
		}
		return createTypedTypeAliasDeclaration(node, value, parameters, resolvedType);
	}
	private checkReturnStatement(node: ReturnStatement, moduleTypeChecker: ModuleTypeChecker): TypedReturnStatement {
		return createTypedReturnStatement(
			node,
			this.createTypedExpression(
				node.expression,
				this.resolver.resolveExpression(node.expression, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
				moduleTypeChecker
			)
		);
	}
	private checkUserDefinedTypeDeclaration(node: UserDefinedTypeDeclaration, moduleTypeChecker: ModuleTypeChecker): TypedUserDefinedTypeDeclaration {
		const members = new Map<string, Property>();
		const properties: TypedProperty[] = [];
		for (let index = 0; index < node.properties.length; index++) {
			const element = node.properties[index]!;
			const resolvedType = this.resolver.resolveType(element.propertyType, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment);
			members.set(element.identifier, {
				kind: "property",
				name: element.identifier,
				type: resolvedType,
				modifiers: element.modifiers,
				accessModifier: element.accessModifier,
			});
			properties.push(createTypedProperty(element, this.createTypedTypeNode(element.propertyType, resolvedType, moduleTypeChecker)));
		}
		const genericTypeParameters: TypedGenericParameter[] = [];
		for (let index = 0; index < node.genericTypeParameters.length; index++) {
			const element = node.genericTypeParameters[index]!;
			genericTypeParameters.push(
				createTypedGenericParameter(
					element,
					this.createTypedTypeNode(
						element.value,
						this.resolver.resolveType(element.value, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					)
				)
			);
		}

		const resolvedType: Type = {
			kind: "object",
			members: members,
		};
		return createTypedUserDefinedTypeDeclaration(node, properties, genericTypeParameters, resolvedType);
	}
	private checkInterfaceDeclaration(node: InterfaceDeclaration, moduleTypeChecker: ModuleTypeChecker): TypedInterfaceDeclaration {
		const typeParameters: TypeParameter[] = [];
		const members = new Map<string, Property>();
		const properties: TypedProperty[] = [];
		for (let index = 0; index < node.properties.length; index++) {
			const element = node.properties[index]!;
			const resolvedType = this.resolver.resolveType(element.propertyType, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment);
			members.set(element.identifier, {
				kind: "property",
				name: element.identifier,
				type: resolvedType,
				modifiers: element.modifiers,
				accessModifier: element.accessModifier,
			});
			properties.push(createTypedProperty(element, this.createTypedTypeNode(element.propertyType, resolvedType, moduleTypeChecker)));
		}
		const genericTypeParameters: TypedGenericParameter[] = [];
		for (let index = 0; index < node.genericTypeParameters.length; index++) {
			const element = node.genericTypeParameters[index]!;
			const value = this.resolver.resolveType(element.value, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment);
			genericTypeParameters.push(createTypedGenericParameter(element, this.createTypedTypeNode(element.value, value, moduleTypeChecker)));
			typeParameters.push({
				kind: "typeParameter",

				name: element.identifier,
				constraint: value,
			});
		}
		const hierarchy = this.createHierarchyType(node.hierarchy, "interface", moduleTypeChecker);
		const interfaces: Interface[] = [];
		for (let index = 0; index < hierarchy.implements.length; index++) {
			const element = hierarchy.implements[index]!;
			switch (element.resolvedType.kind) {
				case "object": {
					interfaces.push({
						kind: "interface",
						object: element.resolvedType,
						typeParameters: [],
						extends: [],
					});
					break;
				}
				case "interface": {
					interfaces.push(element.resolvedType);
					break;
				}
				case "userDefinedType": {
					interfaces.push({
						kind: "interface",
						object: element.resolvedType.object,
						typeParameters: element.resolvedType.typeParameters,
						extends: [],
					});
					break;
				}
				default:
					continue;
			}
		}
		const resolvedType: Type = {
			kind: "interface",
			typeParameters: typeParameters,
			object: {
				kind: "object",
				members: members,
			},
			extends: interfaces,
		};
		if (node.hierarchy.implements.length !== 0) {
			throw new LPPTypeError("An interface declaration cannot have an implements clause.");
		}
		return createTypedInterfaceDeclaration(node, hierarchy, properties, genericTypeParameters, resolvedType);
	}
	private checkClassDeclaration(node: ClassDeclaration, moduleTypeChecker: ModuleTypeChecker): TypedClassDeclaration {
		const typeParameters: TypeParameter[] = [];
		const properties: Property[] = [];
		const typedProperties: TypedProperty[] = [];
		for (let index = 0; index < node.properties.length; index++) {
			const element = node.properties[index]!;
			const resolvedType = this.resolver.resolveType(element.propertyType, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment);
			typedProperties.push(createTypedProperty(element, this.createTypedTypeNode(element.propertyType, resolvedType, moduleTypeChecker)));
			properties.push({
				kind: "property",
				name: element.identifier,
				type: resolvedType,
				modifiers: element.modifiers,
				accessModifier: element.accessModifier,
			});
		}
		const methods: Method[] = [];
		const typedMethods: TypedFunctionDeclaration[] = [];
		for (let index = 0; index < node.methods.length; index++) {
			const element = node.methods[index]!;
			const method = this.checkFunctionDeclaration(element, moduleTypeChecker);
			typedMethods.push(method);
			const parameters: Parameter[] = [];
			for (let index = 0; index < method.parameters.length; index++) {
				const element = method.parameters[index]!;
				parameters.push({
					kind: "parameter",
					name: element.name.value,
					type: element.parameterType.resolvedType,
				});
			}
			methods.push({
				kind: "method",
				name: element.name.value,
				returnType: method.returnType.resolvedType,
				typeParameters: typeParameters,
				parameters: parameters,
			});
		}

		const genericTypeParameters: TypedGenericParameter[] = [];
		for (let index = 0; index < node.genericTypeParameters.length; index++) {
			const element = node.genericTypeParameters[index]!;
			const value = this.resolver.resolveType(element.value, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment);
			genericTypeParameters.push(createTypedGenericParameter(element, this.createTypedTypeNode(element.value, value, moduleTypeChecker)));
			typeParameters.push({
				kind: "typeParameter",

				name: element.identifier,
				constraint: value,
			});
		}
		const hierarchy = this.createHierarchyType(node.hierarchy, "class", moduleTypeChecker);
		const interfaces: Interface[] = [];
		for (let index = 0; index < hierarchy.implements.length; index++) {
			const element = hierarchy.implements[index]!;
			switch (element.resolvedType.kind) {
				case "object": {
					interfaces.push({
						kind: "interface",
						object: element.resolvedType,
						typeParameters: [],
						extends: [],
					});
					break;
				}
				case "interface": {
					interfaces.push(element.resolvedType);
					break;
				}
				case "userDefinedType": {
					interfaces.push({
						kind: "interface",
						object: element.resolvedType.object,
						typeParameters: element.resolvedType.typeParameters,
						extends: [],
					});
					break;
				}
				default:
					continue;
			}
		}
		const symbol = this.getSymbolFromNode(node, moduleTypeChecker)! as ClassSymbol;
		const resolvedType: Type = {
			kind: "class",
			methods: methods,
			properties: properties,
			typeParameters: typeParameters,
			name: node.identifier,
			identity: symbol,
			declaration: symbol.declaration,
			interfaces: interfaces,
		};

		return createTypedClassDeclaration(node, hierarchy, typedProperties, typedMethods, genericTypeParameters, resolvedType);
	}

	private checkWhileStatement(node: WhileStatement, moduleTypeChecker: ModuleTypeChecker): TypedWhileStatement {
		const cond = this.createTypedExpression(
			node.condition,
			this.resolver.resolveExpression(node.condition, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
			moduleTypeChecker
		);
		const body = this.typeCheckBlock(node.body, moduleTypeChecker);
		return createTypedWhileStatement(node, cond, body);
	}
	private checkVariableDeclaration(node: VariableDeclaration, moduleTypeChecker: ModuleTypeChecker): TypedVariableDeclaration {
		const resolvedInitializer = this.resolver.resolveExpression(node.initializer, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment);
		const resolvedVariableType = this.resolver.resolveType(node.variableType, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment);
		if (!this.resolver.isAssignableTo(resolvedInitializer, resolvedVariableType, moduleTypeChecker.currentEnvironment))
			throw new LPPTypeError("Type `" + resolvedInitializer.kind + "` is not assignable to type `" + resolvedVariableType.kind + "`.");
		const resolvedVariableDeclaration = createTypedVariableDeclaration(
			node,
			this.createTypedTypeNode(node.variableType, resolvedVariableType, moduleTypeChecker),
			this.createTypedExpression(node.initializer, resolvedInitializer, moduleTypeChecker),
			resolvedVariableType
		);

		return resolvedVariableDeclaration;
	}
	private checkAssignmentStatement(node: AssignmentStatement, moduleTypeChecker: ModuleTypeChecker): TypedAssignmentStatement {
		const resolvedTarget = this.resolver.resolveExpression(node.target, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment);
		const resolvedValue = this.resolver.resolveExpression(node.value, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment);
		if (isLiteral(resolvedTarget)) throw new LPPTypeError("Cannot assign a value to a literal value");
		const symbol = this.getSymbolFromNode(node.target, moduleTypeChecker);
		if (!symbol) throw new LPPTypeError("Symbol `" + node.target.type + "` not found.");
		if (symbol.kind !== "Variable") throw new LPPTypeError("Cannot assign to `" + symbol.name + "` because it is a `" + symbol.kind + "`.");
		if (symbol.declaration.constant) throw new LPPTypeError("Cannot assign to `" + symbol.name + "` because it is a constant");
		if (!this.resolver.isAssignableTo(resolvedValue, resolvedTarget, moduleTypeChecker.currentEnvironment))
			throw new LPPTypeError("Type `" + resolvedValue.kind + "` is not assignable to type `" + resolvedTarget.kind + "`.");
		const resolvedAssignmentStatement = createTypedAssignmentStatement(
			node,
			this.createTypedExpression(node.target, resolvedTarget, moduleTypeChecker),
			this.createTypedExpression(node.value, resolvedValue, moduleTypeChecker)
		);

		return resolvedAssignmentStatement;
	}
	private checkFunctionDeclaration(node: FunctionDeclaration, moduleTypeChecker: ModuleTypeChecker): TypedFunctionDeclaration {
		const parameters: TypedParameter[] = [];
		for (let index = 0; index < node.parameters.length; index++) {
			const element = node.parameters[index]!;
			parameters.push(
				createTypedParameter(
					element,
					createTypedIdentifier(element.name, { kind: "any" }),
					this.createTypedTypeNode(
						element.parameterType,
						this.resolver.resolveType(element.parameterType, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					)
				)
			);
		}
		const genericParameters: TypedGenericParameter[] = [];
		for (let index = 0; index < node.genericParameters.length; index++) {
			const element = node.genericParameters[index]!;
			genericParameters.push(
				createTypedGenericParameter(
					element,
					this.createTypedTypeNode(
						element.value,
						this.resolver.resolveType(element.value, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					)
				)
			);
		}
		const body: TypedBlock = this.typeCheckBlock(node.body, moduleTypeChecker);
		return createTypedFunctionDeclaration(
			node,
			createTypedIdentifier(node.name, { kind: "any" }),
			parameters,
			this.createTypedTypeNode(
				node.returnType,
				this.resolver.resolveType(node.returnType, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
				moduleTypeChecker
			),
			body,
			genericParameters,
			this.resolver.resolveType(node, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment)
		);
	}

	// ===================================================
	//  Utilities
	// ===================================================
	private getScope(node: BlockLikeScope, moduleTypeChecker: ModuleTypeChecker): ScopeTable {
		if (!this.getBinder(moduleTypeChecker.module).scopes.has(node)) throw new Error("Node `" + node.type + "` does not have a scope.");
		return this.getBinder(moduleTypeChecker.module).scopes.get(node)!;
	}
	private getBinder(module: Module): ModuleBinder {
		return this.binder.moduleBinders.get(module)!;
	}
	private getEnvironment(node: BlockLikeScope, moduleTypeChecker: ModuleTypeChecker): TypeEnvironment {
		if (!this.getBinder(moduleTypeChecker.module).environments.has(node)) throw new Error("Node `" + node.type + "` does not have an environment.");
		return this.getBinder(moduleTypeChecker.module).environments.get(node)!;
	}
	private createHierarchyType(hierarchy: HierarchyType, type: "class" | "interface", moduleTypeChecker: ModuleTypeChecker): TypedHierarchyType {
		const extendsTypes: TypedTypeNode[] = [];
		for (let index = 0; index < hierarchy.extends.length; index++) {
			const element = hierarchy.extends[index]!;
			const resolvedType = this.resolver.resolveType(element, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment);
			if (type === "interface" && !(resolvedType.kind === "object" || resolvedType.kind === "interface" || resolvedType.kind === "userDefinedType"))
				throw new LPPTypeError("An interface can only extend other interfaces/objects.");
			if (type === "class" && resolvedType.kind !== "class") throw new LPPTypeError("A class can only extend another class .");
			extendsTypes.push(this.createTypedTypeNode(element, resolvedType, moduleTypeChecker));
		}
		const implementsTypes: TypedTypeNode[] = [];
		for (let index = 0; index < hierarchy.implements.length; index++) {
			const element = hierarchy.implements[index]!;
			const resolvedType = this.resolver.resolveType(element, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment);
			if (resolvedType.kind === "class") throw new LPPTypeError("A class cannot implement another class");
			if (!(resolvedType.kind === "object" || resolvedType.kind === "interface" || resolvedType.kind === "userDefinedType"))
				throw new LPPTypeError("A class can only implement other interfaces/objects.");

			implementsTypes.push(
				this.createTypedTypeNode(element, this.resolver.resolveType(element, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment), moduleTypeChecker)
			);
		}

		return createTypedHierarchyType(hierarchy, extendsTypes, implementsTypes);
	}

	private typeCheckBlock(block: Block, moduleTypeChecker: ModuleTypeChecker): TypedBlock {
		const oldEnv = moduleTypeChecker.currentEnvironment;
		const oldScope = moduleTypeChecker.currentScope;
		moduleTypeChecker.currentEnvironment = this.getEnvironment(block, moduleTypeChecker);
		moduleTypeChecker.currentScope = this.getScope(block, moduleTypeChecker);

		const resolvedType: Type | Union = { kind: "any" };
		const body: TypedNode[] = [];

		for (let index = 0; index < block.body.length; index++) {
			const node = block.body[index]!;
			body.push(this.checkStatement(node as Exclude<Statement, ElseifStatement>, moduleTypeChecker));
		}
		moduleTypeChecker.currentEnvironment = oldEnv;
		moduleTypeChecker.currentScope = oldScope;
		return createTypedBlock(block, body);
	}
	private getSymbolFromNode(node: DeclarationUnion | Statement | Expression, moduleTypeChecker: ModuleTypeChecker): Symbol | null {
		switch (node.type) {
			case NodeKind.VariableDeclaration: {
				return moduleTypeChecker.currentScope.lookup(node.name);
			}

			case NodeKind.ClassDeclaration: {
				return moduleTypeChecker.currentScope.lookup(node.identifier);
			}
			case NodeKind.FunctionDeclaration: {
				return moduleTypeChecker.currentScope.lookup(node.name.value);
			}
			case NodeKind.Identifier: {
				return moduleTypeChecker.currentScope.lookup(node.value);
			}
			case NodeKind.UserDefinedTypeDeclaration:
				return moduleTypeChecker.currentEnvironment.lookup(node.identifier);
			case NodeKind.InterfaceDeclaration:
				return moduleTypeChecker.currentEnvironment.lookup(node.identifier);
			case NodeKind.TypeAliasDeclaration:
				return moduleTypeChecker.currentEnvironment.lookup(node.alias);
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

	private createTypedExpression<T extends Expression>(node: T, resolvedType: Type, moduleTypeChecker: ModuleTypeChecker): TypedExpressionOf<T> {
		switch (node.type) {
			case NodeKind.NumberLiteral:
				return createTypedNumberLiteral(node, resolvedType) as TypedExpressionOf<T>;
			case NodeKind.BooleanLiteral:
				return createTypedBooleanLiteral(node, resolvedType) as TypedExpressionOf<T>;
			case NodeKind.StringLiteral:
				return createTypedStringLiteral(node, resolvedType) as TypedExpressionOf<T>;
			case NodeKind.Identifier:
				return createTypedIdentifier(node, resolvedType) as TypedExpressionOf<T>;
			case NodeKind.BinaryExpression: {
				const resolvedLeft = this.resolver.resolveExpression(node.left, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment);
				const left = this.createTypedExpression(node.left, resolvedLeft, moduleTypeChecker);
				const resolvedRight = this.resolver.resolveExpression(node.right, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment);
				const right = this.createTypedExpression(node.right, resolvedRight, moduleTypeChecker);

				return createTypedBinaryExpression(node, left, right, resolvedType) as TypedExpressionOf<T>;
			}
			case NodeKind.PrefixUnaryExpression:
				return createTypedPrefixUnaryExpression(
					node,
					this.createTypedExpression(
						node.value,
						this.resolver.resolveExpression(node.value, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					),
					resolvedType
				) as TypedExpressionOf<T>;
			case NodeKind.PostfixUnaryExpression:
				return createTypedPostfixUnaryExpression(
					node,
					this.createTypedExpression(
						node.value,
						this.resolver.resolveExpression(node.value, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					),
					resolvedType
				) as TypedExpressionOf<T>;
			case NodeKind.MemberAccessExpression:
				return createTypedMemberAccessExpression(
					node,
					this.createTypedExpression(
						node.object,
						this.resolver.resolveExpression(node.object, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					),
					this.createTypedExpression(
						node.member,
						this.resolver.resolveExpression(node.member, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					),
					resolvedType
				) as TypedExpressionOf<T>;
			case NodeKind.FunctionCallExpression: {
				const args: TypedArgument[] = [];
				for (let index = 0; index < node.arguments.length; index++) {
					const element = node.arguments[index]!;
					args.push(
						createTypedArgument(
							element,
							this.createTypedExpression(
								element.value,
								this.resolver.resolveExpression(element.value, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
								moduleTypeChecker
							)
						)
					);
				}

				return createTypedFunctionCallExpression(
					node,
					this.createTypedExpression(
						node.callee,
						this.resolver.resolveExpression(node.callee, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					),
					args,
					resolvedType
				) as TypedExpressionOf<T>;
			}
			case NodeKind.ArrayLiteralExpression: {
				const elements: TypedExpression[] = [];

				for (let index = 0; index < node.elements.length; index++) {
					const element = node.elements[index]!;
					elements.push(
						this.createTypedExpression(
							element,
							this.resolver.resolveExpression(element, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
							moduleTypeChecker
						)
					);
				}
				return createTypedArrayLiteralExpression(node, elements, resolvedType) as TypedExpressionOf<T>;
			}
			case NodeKind.IndexExpression:
				return createTypedIndexExpression(
					node,
					this.createTypedExpression(
						node.object,
						this.resolver.resolveExpression(node.object, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					),
					this.createTypedExpression(
						node.index,
						this.resolver.resolveExpression(node.index, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					),
					resolvedType
				) as TypedExpressionOf<T>;
			case NodeKind.AssertionExpression: {
				return createTypedAssertionExpression(
					node,
					this.createTypedExpression(
						node.value,
						this.resolver.resolveExpression(node.value, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					),
					this.createTypedTypeNode(
						node.target,
						this.resolver.resolveType(node.target, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					),
					resolvedType
				) as TypedExpressionOf<T>;
			}
			case NodeKind.ObjectExpression: {
				const properties: TypedProperty[] = [];
				for (let index = 0; index < node.properties.length; index++) {
					const element = node.properties[index]!;
					properties.push(
						createTypedProperty(
							element,
							this.createTypedTypeNode(
								element.propertyType,
								this.resolver.resolveType(element.propertyType, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
								moduleTypeChecker
							)
						)
					);
				}
				return createTypedObjectExpression(node, properties, resolvedType) as TypedExpressionOf<T>;
			}
			case NodeKind.ConstructorExpression: {
				const args: TypedArgument[] = [];
				for (let index = 0; index < node.arguments.length; index++) {
					const element = node.arguments[index]!;
					args.push(
						createTypedArgument(
							element,
							this.createTypedExpression(
								element.value,
								this.resolver.resolveExpression(element.value, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
								moduleTypeChecker
							)
						)
					);
				}
				return createTypedConstructorExpression(
					node,
					this.createTypedExpression(
						node.class,
						this.resolver.resolveExpression(node.class, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					),
					args,
					resolvedType
				) as TypedExpressionOf<T>;
			}
		}
	}
	private createTypedTypeNode(node: TypeNode, resolvedType: Type, moduleTypeChecker: ModuleTypeChecker): TypedTypeNode {
		switch (node.type) {
			case NodeKind.UnionType:
				return createTypedUnionType(
					node,
					this.createTypedTypeNode(
						node.typeA,
						this.resolver.resolveType(node.typeA, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					),
					this.createTypedTypeNode(
						node.typeB,
						this.resolver.resolveType(node.typeB, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					),
					resolvedType
				);
			case NodeKind.IntersectionType:
				return createTypedIntersectionType(
					node,
					this.createTypedTypeNode(
						node.typeA,
						this.resolver.resolveType(node.typeA, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					),
					this.createTypedTypeNode(
						node.typeB,
						this.resolver.resolveType(node.typeB, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					),
					resolvedType
				);
			case NodeKind.StringLiteral:
				return createTypedStringLiteral(node, resolvedType);
			case NodeKind.BooleanLiteral:
				return createTypedBooleanLiteral(node, resolvedType);
			case NodeKind.NumberLiteral:
				return createTypedNumberLiteral(node, resolvedType);
			case NodeKind.FunctionType: {
				const parameters: TypedParameter[] = [];
				for (let index = 0; index < node.parameters.length; index++) {
					const element = node.parameters[index]!;
					parameters.push(
						createTypedParameter(
							element,
							createTypedIdentifier(element.name, { kind: "any" }),
							this.createTypedTypeNode(
								element.parameterType,
								this.resolver.resolveType(element.parameterType, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
								moduleTypeChecker
							)
						)
					);
				}
				const genericParameters: TypedGenericParameter[] = [];
				for (let index = 0; index < node.genericParameters.length; index++) {
					const element = node.genericParameters[index]!;
					genericParameters.push(
						createTypedGenericParameter(
							element,
							this.createTypedTypeNode(
								element.value,
								this.resolver.resolveType(element.value, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
								moduleTypeChecker
							)
						)
					);
				}
				return createTypedFunctionType(
					node,
					parameters,
					genericParameters,
					this.createTypedTypeNode(
						node.returnType,
						this.resolver.resolveType(node.returnType, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
						moduleTypeChecker
					),
					resolvedType
				);
			}
			case NodeKind.ArrayLiteralExpression: {
				const elements: TypedExpression[] = [];

				for (let index = 0; index < node.elements.length; index++) {
					const element = node.elements[index]!;
					elements.push(
						this.createTypedExpression(
							element,
							this.resolver.resolveExpression(element, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
							moduleTypeChecker
						)
					);
				}
				return createTypedArrayLiteralExpression(node, elements, resolvedType);
			}

			case NodeKind.TypeReference: {
				const genericTypes: TypedTypeNode[] = [];
				for (let index = 0; index < node.genericTypes.length; index++) {
					const element = node.genericTypes[index]!;
					genericTypes.push(
						this.createTypedTypeNode(
							element,
							this.resolver.resolveType(element, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
							moduleTypeChecker
						)
					);
				}
				return createTypedTypeReference(
					node,
					createTypedIdentifier(node.identifier, this.resolver.resolveType(node, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment)),
					genericTypes,
					resolvedType
				);
			}
			case NodeKind.ObjectExpression: {
				const properties: TypedProperty[] = [];
				for (let index = 0; index < node.properties.length; index++) {
					const element = node.properties[index]!;
					properties.push(
						createTypedProperty(
							element,
							this.createTypedTypeNode(
								element.propertyType,
								this.resolver.resolveType(element.propertyType, moduleTypeChecker.currentScope, moduleTypeChecker.currentEnvironment),
								moduleTypeChecker
							)
						)
					);
				}
				return createTypedObjectExpression(node, properties, resolvedType);
			}
		}
	}
	// ===================================================
	//  Resolving
	// ===================================================
}
