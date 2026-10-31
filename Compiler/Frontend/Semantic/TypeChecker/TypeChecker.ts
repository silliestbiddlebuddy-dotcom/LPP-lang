import { LPPTypeError } from "../../Errors/LPPTypeError.ts";
import type {
	AssignmentStatement,
	ASTType,
	BinaryOperator,
	Block,
	ClassDeclaration,
	Declaration,
	DeclarationUnion,
	ElseifStatement,
	Expression,
	ForStatement,
	FunctionCallExpression,
	FunctionDeclaration,
	HierarchyType,
	Identifier,
	IfStatement,
	InterfaceDeclaration,
	Node,
	PrefixUnaryOperator,
	ReturnStatement,
	Statement,
	TypeAliasDeclaration,
	Type as TypeNode,
	UserDefinedTypeDeclaration,
	VariableDeclaration,
	WhileStatement,
} from "../../Parser/Parser.types.ts";
import { Binder, type BlockLikeScope } from "../Binder/Binder.ts";
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
	createTypedIndexExpression,
	createTypedInterfaceDeclaration,
	createTypedIntersectionType,
	createTypedMemberAccessExpression,
	createTypedNumberLiteral,
	createTypedObjectExpression,
	createTypedParameter,
	createTypedPostfixUnaryExpression,
	createTypedPrefixUnaryExpression,
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

export class TypeChecker {
	private binder: Binder;
	private resolver: Resolver;
	private currentEnvironment: TypeEnvironment;
	private currentScope: ScopeTable;
	public readonly AST: ASTType;
	private TypedAST: TypedASTType;

	constructor(AST: ASTType, environment: TypeEnvironment, scope: ScopeTable, binder: Binder) {
		this.binder = binder;
		this.currentEnvironment = environment;
		this.currentScope = scope;
		this.AST = AST;
		this.TypedAST = [{ type: "TypedProgram", name: AST[0].name, body: [] }];
		this.resolver = new Resolver(this.currentEnvironment, this.currentScope);
	}

	// ===================================================
	//  Program
	// ===================================================
	public typeCheck(): TypedASTType {
		const program = this.AST[0]!;
		for (let index = 0; index < program.body.length; index++) {
			const node = program.body[index]!;
			this.TypedAST[0].body.push(this.checkStatement(node as Exclude<Statement, ElseifStatement> | FunctionCallExpression));
		}
		return this.TypedAST;
	}

	// ===================================================
	//  Statements
	// ===================================================

	private checkStatement(node: Exclude<Statement, ElseifStatement> | FunctionCallExpression): TypedNode {
		switch (node.type) {
			case "VariableDeclaration":
				return this.checkVariableDeclaration(node);
			case "AssignmentStatement":
				return this.checkAssignmentStatement(node);
			case "FunctionDeclaration":
				return this.checkFunctionDeclaration(node);
			case "ForStatement":
				return this.checkForStatement(node);
			case "WhileStatement":
				return this.checkWhileStatement(node);
			case "IfStatement":
				return this.checkIfStatement(node);
			case "UserDefinedTypeDeclaration":
				return this.checkUserDefinedTypeDeclaration(node);
			case "TypeAliasDeclaration":
				return this.checkTypeAliasDeclaration(node);
			case "ReturnStatement":
				return this.checkReturnStatement(node);

			//WIP
			case "BreakStatement":
				return createTypedBreakStatement(node);
			case "ContinueStatement":
				return createTypedContinueStatement(node);

			case "InterfaceDeclaration":
				return this.checkInterfaceDeclaration(node);
			case "ClassDeclaration":
				return this.checkClassDeclaration(node);
			case "FunctionCallExpression":
				return this.createTypedExpression(node, this.resolver.resolveExpression(node));
		}
	}

	private checkForStatement(node: ForStatement): TypedForStatement {
		const init = this.checkVariableDeclaration(node.initializer);
		const cond = this.createTypedExpression(node.condition, this.resolver.resolveExpression(node.condition));
		const upd = this.checkAssignmentStatement(node.update);
		const body = this.typeCheckBlock(node.body);
		return createTypedForStatement(node, init, cond, upd, body);
	}
	private checkIfStatement(node: IfStatement): TypedIfStatement {
		const cond = this.createTypedExpression(node.condition, this.resolver.resolveExpression(node.condition));
		const body = this.typeCheckBlock(node.body);
		const elseIfs: TypedElseifStatement[] = [];
		for (let index = 0; index < node.elseIfs.length; index++) {
			const element = node.elseIfs[index]!;
			elseIfs.push(this.checkElseifStatement(element));
		}
		const elseBlock = node.else ? this.typeCheckBlock(node.else) : null;
		return createTypedIfStatement(node, cond, body, elseIfs, elseBlock);
	}
	private checkElseifStatement(node: ElseifStatement): TypedElseifStatement {
		const cond = this.createTypedExpression(node.condition, this.resolver.resolveExpression(node.condition));
		const body = this.typeCheckBlock(node.body);
		const elseIfs: TypedElseifStatement[] = [];

		return createTypedElseifStatement(node, cond, body);
	}
	private checkTypeAliasDeclaration(node: TypeAliasDeclaration): TypedTypeAliasDeclaration {
		const resolvedType = this.resolver.resolveType(node.value, this.currentEnvironment);
		const value = this.createTypedTypeNode(node.value, resolvedType);
		const parameters: TypedGenericParameter[] = [];
		for (let index = 0; index < node.parameters.length; index++) {
			const element = node.parameters[index]!;
			parameters.push(createTypedGenericParameter(element, this.createTypedTypeNode(element.value, this.resolver.resolveType(element.value, this.currentEnvironment))));
		}
		return createTypedTypeAliasDeclaration(node, value, parameters, resolvedType);
	}
	private checkReturnStatement(node: ReturnStatement): TypedReturnStatement {
		return createTypedReturnStatement(node, this.createTypedExpression(node.expression, this.resolver.resolveExpression(node.expression)));
	}
	private checkUserDefinedTypeDeclaration(node: UserDefinedTypeDeclaration): TypedUserDefinedTypeDeclaration {
		const members = new Map<string, Property>();
		const properties: TypedProperty[] = [];
		for (let index = 0; index < node.properties.length; index++) {
			const element = node.properties[index]!;
			const resolvedType = this.resolver.resolveType(element.propertyType, this.currentEnvironment);
			members.set(element.identifier, {
				kind: "property",
				name: element.identifier,
				type: resolvedType,
				modifiers: element.modifiers,
				accessModifier: element.accessModifier,
			});
			properties.push(createTypedProperty(element, this.createTypedTypeNode(element.propertyType, resolvedType)));
		}
		const genericTypeParameters: TypedGenericParameter[] = [];
		for (let index = 0; index < node.genericTypeParameters.length; index++) {
			const element = node.genericTypeParameters[index]!;
			genericTypeParameters.push(
				createTypedGenericParameter(element, this.createTypedTypeNode(element.value, this.resolver.resolveType(element.value, this.currentEnvironment)))
			);
		}

		const resolvedType: Type = {
			kind: "object",
			members: members,
		};
		return createTypedUserDefinedTypeDeclaration(node, properties, genericTypeParameters, resolvedType);
	}
	private checkInterfaceDeclaration(node: InterfaceDeclaration): TypedInterfaceDeclaration {
		const typeParameters: TypeParameter[] = [];
		const members = new Map<string, Property>();
		const properties: TypedProperty[] = [];
		for (let index = 0; index < node.properties.length; index++) {
			const element = node.properties[index]!;
			const resolvedType = this.resolver.resolveType(element.propertyType, this.currentEnvironment);
			members.set(element.identifier, {
				kind: "property",
				name: element.identifier,
				type: resolvedType,
				modifiers: element.modifiers,
				accessModifier: element.accessModifier,
			});
			properties.push(createTypedProperty(element, this.createTypedTypeNode(element.propertyType, resolvedType)));
		}
		const genericTypeParameters: TypedGenericParameter[] = [];
		for (let index = 0; index < node.genericTypeParameters.length; index++) {
			const element = node.genericTypeParameters[index]!;
			const value = this.resolver.resolveType(element.value, this.currentEnvironment);
			genericTypeParameters.push(createTypedGenericParameter(element, this.createTypedTypeNode(element.value, value)));
			typeParameters.push({
				kind: "typeParameter",

				name: element.identifier,
				constraint: value,
			});
		}
		const hierarchy = this.createHierarchyType(node.hierarchy, "interface");
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
	private checkClassDeclaration(node: ClassDeclaration): TypedClassDeclaration {
		const typeParameters: TypeParameter[] = [];
		const properties: Property[] = [];
		const typedProperties: TypedProperty[] = [];
		for (let index = 0; index < node.properties.length; index++) {
			const element = node.properties[index]!;
			const resolvedType = this.resolver.resolveType(element.propertyType, this.currentEnvironment);
			typedProperties.push(createTypedProperty(element, this.createTypedTypeNode(element.propertyType, resolvedType)));
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
			const method = this.checkFunctionDeclaration(element);
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
			const value = this.resolver.resolveType(element.value, this.currentEnvironment);
			genericTypeParameters.push(createTypedGenericParameter(element, this.createTypedTypeNode(element.value, value)));
			typeParameters.push({
				kind: "typeParameter",

				name: element.identifier,
				constraint: value,
			});
		}
		const hierarchy = this.createHierarchyType(node.hierarchy, "class");
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
		const symbol = this.getSymbolFromNode(node)! as ClassSymbol;
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

	private checkWhileStatement(node: WhileStatement): TypedWhileStatement {
		const cond = this.createTypedExpression(node.condition, this.resolver.resolveExpression(node.condition));
		const body = this.typeCheckBlock(node.body);
		return createTypedWhileStatement(node, cond, body);
	}
	private checkVariableDeclaration(node: VariableDeclaration): TypedVariableDeclaration {
		const resolvedInitializer = this.resolver.resolveExpression(node.initializer);
		const resolvedVariableType = this.resolver.resolveType(node.variableType, this.currentEnvironment);
		if (!this.resolver.isAssignableTo(resolvedInitializer, resolvedVariableType, this.currentEnvironment))
			throw new LPPTypeError("Type `" + resolvedInitializer.kind + "` is not assignable to type `" + resolvedVariableType.kind + "`.");
		const resolvedVariableDeclaration = createTypedVariableDeclaration(
			node,
			this.createTypedTypeNode(node.variableType, resolvedVariableType),
			this.createTypedExpression(node.initializer, resolvedInitializer),
			resolvedVariableType
		);

		return resolvedVariableDeclaration;
	}
	private checkAssignmentStatement(node: AssignmentStatement): TypedAssignmentStatement {
		const resolvedTarget = this.resolver.resolveExpression(node.target);
		const resolvedValue = this.resolver.resolveExpression(node.value);
		if (isLiteral(resolvedTarget)) throw new LPPTypeError("Cannot assign a value to a literal value");
		const symbol = this.getSymbolFromNode(node.target);
		if (!symbol) throw new LPPTypeError("Symbol `" + node.target.type + "` not found.");
		if (symbol.kind !== "Variable") throw new LPPTypeError("Cannot assign to `" + symbol.name + "` because it is a `" + symbol.kind + "`.");
		if (symbol.declaration.constant) throw new LPPTypeError("Cannot assign to `" + symbol.name + "` because it is a constant");
		if (!this.resolver.isAssignableTo(resolvedValue, resolvedTarget, this.currentEnvironment))
			throw new LPPTypeError("Type `" + resolvedValue.kind + "` is not assignable to type `" + resolvedTarget.kind + "`.");
		const resolvedAssignmentStatement = createTypedAssignmentStatement(
			node,
			this.createTypedExpression(node.target, resolvedTarget),
			this.createTypedExpression(node.value, resolvedValue)
		);

		return resolvedAssignmentStatement;
	}
	private checkFunctionDeclaration(node: FunctionDeclaration): TypedFunctionDeclaration {
		const parameters: TypedParameter[] = [];
		for (let index = 0; index < node.parameters.length; index++) {
			const element = node.parameters[index]!;
			parameters.push(
				createTypedParameter(
					element,
					createTypedIdentifier(element.name, { kind: "any" }),
					this.createTypedTypeNode(element.parameterType, this.resolver.resolveType(element.parameterType, this.currentEnvironment))
				)
			);
		}
		const genericParameters: TypedGenericParameter[] = [];
		for (let index = 0; index < node.genericParameters.length; index++) {
			const element = node.genericParameters[index]!;
			genericParameters.push(
				createTypedGenericParameter(element, this.createTypedTypeNode(element.value, this.resolver.resolveType(element.value, this.currentEnvironment)))
			);
		}
		const body: TypedBlock = this.typeCheckBlock(node.body);
		return createTypedFunctionDeclaration(
			node,
			createTypedIdentifier(node.name, { kind: "any" }),
			parameters,
			this.createTypedTypeNode(node.returnType, this.resolver.resolveType(node.returnType, this.currentEnvironment)),
			body,
			genericParameters,
			this.resolver.resolveType(node, this.currentEnvironment)
		);
	}

	// ===================================================
	//  Utilities
	// ===================================================
	private getScope(node: BlockLikeScope): ScopeTable {
		if (!this.binder.scopes.has(node)) throw new Error("Node `" + node.type + "` does not have a scope.");
		return this.binder.scopes.get(node)!;
	}
	private getEnvironment(node: BlockLikeScope): TypeEnvironment {
		if (!this.binder.environments.has(node)) throw new Error("Node `" + node.type + "` does not have an environment.");
		return this.binder.environments.get(node)!;
	}
	private createHierarchyType(hierarchy: HierarchyType, type: "class" | "interface"): TypedHierarchyType {
		const extendsTypes: TypedTypeNode[] = [];
		for (let index = 0; index < hierarchy.extends.length; index++) {
			const element = hierarchy.extends[index]!;
			const resolvedType = this.resolver.resolveType(element, this.currentEnvironment);
			if (type === "interface" && !(resolvedType.kind === "object" || resolvedType.kind === "interface" || resolvedType.kind === "userDefinedType"))
				throw new LPPTypeError("An interface can only extend other interfaces/objects.");
			if (type === "class" && resolvedType.kind !== "class") throw new LPPTypeError("A class can only extend another class .");
			extendsTypes.push(this.createTypedTypeNode(element, resolvedType));
		}
		const implementsTypes: TypedTypeNode[] = [];
		for (let index = 0; index < hierarchy.implements.length; index++) {
			const element = hierarchy.implements[index]!;
			const resolvedType = this.resolver.resolveType(element, this.currentEnvironment);
			if (resolvedType.kind === "class") throw new LPPTypeError("A class cannot implement another class");
			if (!(resolvedType.kind === "object" || resolvedType.kind === "interface" || resolvedType.kind === "userDefinedType"))
				throw new LPPTypeError("A class can only implement other interfaces/objects.");

			implementsTypes.push(this.createTypedTypeNode(element, this.resolver.resolveType(element, this.currentEnvironment)));
		}

		return createTypedHierarchyType(hierarchy, extendsTypes, implementsTypes);
	}

	private typeCheckBlock(block: Block): TypedBlock {
		const oldEnv = this.currentEnvironment;
		const oldScope = this.currentScope;
		this.currentEnvironment = this.getEnvironment(block);

		this.resolver.currentEnvironment = this.currentEnvironment;
		this.currentScope = this.getScope(block);
		this.resolver.currentScope = this.getScope(block);
		const resolvedType: Type | Union = { kind: "any" };
		const body: TypedNode[] = [];

		for (let index = 0; index < block.body.length; index++) {
			const node = block.body[index]!;
			body.push(this.checkStatement(node as Exclude<Statement, ElseifStatement>));
		}
		this.currentEnvironment = oldEnv;
		this.resolver.currentEnvironment = oldEnv;
		this.currentScope = oldScope;
		this.resolver.currentScope = oldScope;
		return createTypedBlock(block, body);
	}
	private getSymbolFromNode(node: DeclarationUnion | Statement | Expression): Symbol | null {
		switch (node.type) {
			case "VariableDeclaration": {
				return this.currentScope.lookup(node.name);
			}

			case "ClassDeclaration": {
				return this.currentScope.lookup(node.identifier);
			}
			case "FunctionDeclaration": {
				return this.currentScope.lookup(node.name.value);
			}
			case "Identifier": {
				return this.currentScope.lookup(node.value);
			}
			case "UserDefinedTypeDeclaration":
			case "InterfaceDeclaration":
			case "TypeAliasDeclaration":
			case "IfStatement":
			case "ElseifStatement":
			case "ReturnStatement":
			case "BreakStatement":
			case "ContinueStatement":
			case "ForStatement":
			case "WhileStatement":
			case "AssignmentStatement":
			case "NumberLiteral":
			case "BooleanLiteral":
			case "StringLiteral":
			case "BinaryExpression":
			case "PrefixUnaryExpression":
			case "PostfixUnaryExpression":
			case "MemberAccessExpression":
			case "FunctionCallExpression":
			case "ArrayLiteralExpression":
			case "IndexExpression":
			case "AssertionExpression":
			case "ObjectExpression":
			default:
				return null;
		}
	}

	private createTypedExpression<T extends Expression>(node: T, resolvedType: Type): TypedExpressionOf<T> {
		switch (node.type) {
			case "NumberLiteral":
				return createTypedNumberLiteral(node, resolvedType) as TypedExpressionOf<T>;
			case "BooleanLiteral":
				return createTypedBooleanLiteral(node, resolvedType) as TypedExpressionOf<T>;
			case "StringLiteral":
				return createTypedStringLiteral(node, resolvedType) as TypedExpressionOf<T>;
			case "Identifier":
				return createTypedIdentifier(node, resolvedType) as TypedExpressionOf<T>;
			case "BinaryExpression": {
				const resolvedLeft = this.resolver.resolveExpression(node.left);
				const left = this.createTypedExpression(node.left, resolvedLeft);
				const resolvedRight = this.resolver.resolveExpression(node.right);
				const right = this.createTypedExpression(node.right, resolvedRight);

				return createTypedBinaryExpression(node, left, right, resolvedType) as TypedExpressionOf<T>;
			}
			case "PrefixUnaryExpression":
				return createTypedPrefixUnaryExpression(
					node,
					this.createTypedExpression(node.value, this.resolver.resolveExpression(node.value)),
					resolvedType
				) as TypedExpressionOf<T>;
			case "PostfixUnaryExpression":
				return createTypedPostfixUnaryExpression(
					node,
					this.createTypedExpression(node.value, this.resolver.resolveExpression(node.value)),
					resolvedType
				) as TypedExpressionOf<T>;
			case "MemberAccessExpression":
				return createTypedMemberAccessExpression(
					node,
					this.createTypedExpression(node.object, this.resolver.resolveExpression(node.object)),
					this.createTypedExpression(node.member, this.resolver.resolveExpression(node.member)),
					resolvedType
				) as TypedExpressionOf<T>;
			case "FunctionCallExpression": {
				const args: TypedArgument[] = [];
				for (let index = 0; index < node.arguments.length; index++) {
					const element = node.arguments[index]!;
					args.push(createTypedArgument(element, this.createTypedExpression(element.value, this.resolver.resolveExpression(element.value))));
				}

				return createTypedFunctionCallExpression(
					node,
					this.createTypedExpression(node.callee, this.resolver.resolveExpression(node.callee)),
					args,
					resolvedType
				) as TypedExpressionOf<T>;
			}
			case "ArrayLiteralExpression": {
				const elements: TypedExpression[] = [];

				for (let index = 0; index < node.elements.length; index++) {
					const element = node.elements[index]!;
					elements.push(this.createTypedExpression(element, this.resolver.resolveExpression(element)));
				}
				return createTypedArrayLiteralExpression(node, elements, resolvedType) as TypedExpressionOf<T>;
			}
			case "IndexExpression":
				return createTypedIndexExpression(
					node,
					this.createTypedExpression(node.object, this.resolver.resolveExpression(node.object)),
					this.createTypedExpression(node.index, this.resolver.resolveExpression(node.index)),
					resolvedType
				) as TypedExpressionOf<T>;
			case "AssertionExpression": {
				return createTypedAssertionExpression(
					node,
					this.createTypedExpression(node.value, this.resolver.resolveExpression(node.value)),
					this.createTypedTypeNode(node.target, this.resolver.resolveType(node.target, this.currentEnvironment)),
					resolvedType
				) as TypedExpressionOf<T>;
			}
			case "ObjectExpression": {
				const properties: TypedProperty[] = [];
				for (let index = 0; index < node.properties.length; index++) {
					const element = node.properties[index]!;
					properties.push(
						createTypedProperty(element, this.createTypedTypeNode(element.propertyType, this.resolver.resolveType(element.propertyType, this.currentEnvironment)))
					);
				}
				return createTypedObjectExpression(node, properties, resolvedType) as TypedExpressionOf<T>;
			}
			case "ConstructorExpression": {
				const args: TypedArgument[] = [];
				for (let index = 0; index < node.arguments.length; index++) {
					const element = node.arguments[index]!;
					args.push(createTypedArgument(element, this.createTypedExpression(element.value, this.resolver.resolveExpression(element.value))));
				}
				return createTypedConstructorExpression(
					node,
					this.createTypedExpression(node.class, this.resolver.resolveExpression(node.class)),
					args,
					resolvedType
				) as TypedExpressionOf<T>;
			}
		}
	}
	private createTypedTypeNode(node: TypeNode, resolvedType: Type): TypedTypeNode {
		switch (node.type) {
			case "UnionType":
				return createTypedUnionType(
					node,
					this.createTypedTypeNode(node.typeA, this.resolver.resolveType(node.typeA, this.currentEnvironment)),
					this.createTypedTypeNode(node.typeB, this.resolver.resolveType(node.typeB, this.currentEnvironment)),
					resolvedType
				);
			case "IntersectionType":
				return createTypedIntersectionType(
					node,
					this.createTypedTypeNode(node.typeA, this.resolver.resolveType(node.typeA, this.currentEnvironment)),
					this.createTypedTypeNode(node.typeB, this.resolver.resolveType(node.typeB, this.currentEnvironment)),
					resolvedType
				);
			case "StringLiteral":
				return createTypedStringLiteral(node, resolvedType);
			case "BooleanLiteral":
				return createTypedBooleanLiteral(node, resolvedType);
			case "NumberLiteral":
				return createTypedNumberLiteral(node, resolvedType);
			case "FunctionType": {
				const parameters: TypedParameter[] = [];
				for (let index = 0; index < node.parameters.length; index++) {
					const element = node.parameters[index]!;
					parameters.push(
						createTypedParameter(
							element,
							createTypedIdentifier(element.name, { kind: "any" }),
							this.createTypedTypeNode(element.parameterType, this.resolver.resolveType(element.parameterType, this.currentEnvironment))
						)
					);
				}
				const genericParameters: TypedGenericParameter[] = [];
				for (let index = 0; index < node.genericParameters.length; index++) {
					const element = node.genericParameters[index]!;
					genericParameters.push(
						createTypedGenericParameter(element, this.createTypedTypeNode(element.value, this.resolver.resolveType(element.value, this.currentEnvironment)))
					);
				}
				return createTypedFunctionType(
					node,
					parameters,
					genericParameters,
					this.createTypedTypeNode(node.returnType, this.resolver.resolveType(node.returnType, this.currentEnvironment)),
					resolvedType
				);
			}
			case "ArrayLiteralExpression": {
				const elements: TypedExpression[] = [];

				for (let index = 0; index < node.elements.length; index++) {
					const element = node.elements[index]!;
					elements.push(this.createTypedExpression(element, this.resolver.resolveExpression(element)));
				}
				return createTypedArrayLiteralExpression(node, elements, resolvedType);
			}

			case "TypeReference": {
				const genericTypes: TypedTypeNode[] = [];
				for (let index = 0; index < node.genericTypes.length; index++) {
					const element = node.genericTypes[index]!;
					genericTypes.push(this.createTypedTypeNode(element, this.resolver.resolveType(element, this.currentEnvironment)));
				}
				return createTypedTypeReference(node, createTypedIdentifier(node.identifier, this.resolver.resolveType(node, this.currentEnvironment)), genericTypes, resolvedType);
			}
			case "ObjectExpression": {
				const properties: TypedProperty[] = [];
				for (let index = 0; index < node.properties.length; index++) {
					const element = node.properties[index]!;
					properties.push(
						createTypedProperty(element, this.createTypedTypeNode(element.propertyType, this.resolver.resolveType(element.propertyType, this.currentEnvironment)))
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
