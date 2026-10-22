import { LPPTypeError } from "../../Errors/LPPTypeError.ts";
import type {
	AssignmentStatement,
	ASTType,
	BinaryOperator,
	Block,
	Declaration,
	DeclarationUnion,
	Expression,
	FunctionDeclaration,
	Identifier,
	Node,
	PrefixUnaryOperator,
	Statement,
	Type as TypeNode,
	VariableDeclaration,
} from "../../Parser/Parser.types.ts";
import { Binder, type BlockLikeScope } from "../Binder/Binder.ts";
import type { ScopeTable } from "../Binder/Scope.ts";
import type { Symbol } from "../Binder/Symbol.ts";
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
import { isLiteral, isNumber, isPrimitive } from "./Assignability.ts";
import {
	createTypedArgument,
	createTypedArrayLiteralExpression,
	createTypedAssertionExpression,
	createTypedAssignmentStatement,
	createTypedBinaryExpression,
	createTypedBlock,
	createTypedBooleanLiteral,
	createTypedConstructorExpression,
	createTypedFunctionCallExpression,
	createTypedFunctionDeclaration,
	createTypedFunctionType,
	createTypedGenericParameter,
	createTypedIdentifier,
	createTypedIndexExpression,
	createTypedIntersectionType,
	createTypedMemberAccessExpression,
	createTypedNumberLiteral,
	createTypedObjectExpression,
	createTypedParameter,
	createTypedPostfixUnaryExpression,
	createTypedPrefixUnaryExpression,
	createTypedProperty,
	createTypedStringLiteral,
	createTypedTypeReference,
	createTypedUnionType,
	createTypedVariableDeclaration,
	type TypedArgument,
	type TypedASTType,
	type TypedBlock,
	type TypedExpression,
	type TypedExpressionOf,
	type TypedFunctionDeclaration,
	type TypedGenericParameter,
	type TypedNode,
	type TypedObject,
	type TypedParameter,
	type TypedProperty,
	type TypedTypeNode,
} from "./TypedAST.ts";

export class TypeChecker {
	private binder: Binder;

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
	}

	// ===================================================
	//  Program
	// ===================================================
	public typeCheck() {
		const program = this.AST[0]!;
		for (let index = 0; index < program.body.length; index++) {
			const node = program.body[index]!;
			this.TypedAST[0].body.push(this.checkStatement(node as Statement));
		}
	}

	// ===================================================
	//  Statements
	// ===================================================

	private checkStatement(node: Statement): TypedNode {
		switch (node.type) {
			case "VariableDeclaration":
				return this.checkVariableDeclaration(node);
			case "AssignmentStatement":
				return this.checkAssignmentStatement(node);
			case "FunctionDeclaration":
				return this.checkFunctionDeclaration(node);
			case "IfStatement":
			case "ElseifStatement":
			case "UserDefinedTypeDeclaration":
			case "TypeAliasDeclaration":
			case "ReturnStatement":
			case "BreakStatement":
			case "ContinueStatement":
			case "ForStatement":
			case "WhileStatement":

			case "InterfaceDeclaration":
		}
	}

	private checkVariableDeclaration(node: VariableDeclaration): TypedNode {
		const resolvedInitializer = this.resolveExpression(node.initializer);
		const resolvedVariableType = this.resolveType(node.variableType, this.currentEnvironment);
		if (!this.isAssignableTo(resolvedInitializer, resolvedVariableType, this.currentEnvironment))
			throw new LPPTypeError("Type `" + resolvedInitializer.kind + "` is not assignable to type `" + resolvedVariableType.kind + "`.");
		const resolvedVariableDeclaration = createTypedVariableDeclaration(
			node,
			this.createTypedTypeNode(node.variableType, resolvedVariableType),
			this.createTypedExpression(node.initializer, resolvedInitializer),
			resolvedVariableType
		);

		return resolvedVariableDeclaration;
	}
	private checkAssignmentStatement(node: AssignmentStatement): TypedNode {
		const resolvedTarget = this.resolveExpression(node.target);
		const resolvedValue = this.resolveExpression(node.value);
		if (isLiteral(resolvedTarget)) throw new LPPTypeError("Cannot assign a value to a literal value");
		const symbol = this.getSymbolFromNode(node.target);
		if (!symbol) throw new LPPTypeError("Symbol `" + node.target.type + "` not found.");
		if (symbol.declaration.type !== "VariableDeclaration") throw new LPPTypeError("Cannot assign to `" + symbol.name + "` because it is a `" + symbol.declaration.type + "`.");
		if (symbol.declaration.constant) throw new LPPTypeError("Cannot assign to `" + symbol.name + "` because it is a constant");
		if (!this.isAssignableTo(resolvedValue, resolvedTarget, this.currentEnvironment))
			throw new LPPTypeError("Type `" + resolvedValue.kind + "` is not assignable to type `" + resolvedTarget.kind + "`.");
		const resolvedAssignmentStatement = createTypedAssignmentStatement(
			node,
			this.createTypedExpression(node.target, this.resolveExpression(node.target)),
			this.createTypedExpression(node.value, this.resolveExpression(node.value)),
			resolvedValue
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
					this.createTypedTypeNode(element.parameterType, this.resolveType(element.parameterType, this.currentEnvironment))
				)
			);
		}
		const genericParameters: TypedGenericParameter[] = [];
		for (let index = 0; index < node.genericParameters.length; index++) {
			const element = node.genericParameters[index]!;
			genericParameters.push(createTypedGenericParameter(element, this.createTypedTypeNode(element.value, this.resolveType(element.value, this.currentEnvironment))));
		}
		const body: TypedBlock = this.typeCheckBlock(node.body);
		return createTypedFunctionDeclaration(
			node,
			createTypedIdentifier(node.name, { kind: "any" }),
			parameters,
			this.createTypedTypeNode(node.returnType, this.resolveType(node.returnType, this.currentEnvironment)),
			body,
			genericParameters,
			this.resolveType(node, this.currentEnvironment)
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

	private typeCheckBlock(block: Block): TypedBlock {
		const oldEnv = this.currentEnvironment;
		const oldScope = this.currentScope;
		this.currentEnvironment = this.getEnvironment(block);
		this.currentScope = this.getScope(block);

		const body: TypedNode[] = [];

		for (let index = 0; index < block.body.length; index++) {
			const node = block.body[index]!;
			body.push(this.checkStatement(node as Statement));
		}
		this.currentEnvironment = oldEnv;
		this.currentScope = oldScope;
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

	private isAssignableTo(source: Type, target: Type, environment: TypeEnvironment): boolean {
		source = this.unwrap(source, environment, new Set<Type>());
		target = this.unwrap(target, environment, new Set<Type>());
		if (target.kind === "any" || source.kind === "any") return true;

		if (target.kind === "emptiness" || source.kind === "emptiness") return false;
		if (source.kind === "never") return true;
		if (target.kind === "never") return false;
		if (target.kind === "unknown") return true;
		if (source.kind === "unknown") return false;
		if (target.kind === "undefined" && source.kind !== "undefined") return false;

		if (source.kind === "union" || source.kind === "intersection") {
			for (let index = 0; index < source.types.length; index++) {
				const element = source.types[index]!;
				if (!this.isAssignableTo(element, target, environment)) return false;
			}
			return true;
		}

		if (isLiteral(target)) {
			if (!isLiteral(source)) return false;
			if (target.kind !== source.kind) return false;
			if ((source as Literal).value !== (target as Literal).value) return false;
			return true;
		}
		if (isPrimitive(target)) {
			if (isLiteral(source)) {
				if (source.kind === "stringLiteral" && target.kind === "string") return true;
				if (source.kind === "booleanLiteral" && target.kind === "boolean") return true;
				if (source.kind === "numberLiteral" && isNumber(target)) return true;
				return false;
			}

			if (target.kind !== source.kind) return false;
			return true;
		}

		if (target.kind === "object") {
			if (source.kind !== "object") return false;
			for (const [key, value] of target.members) {
				const sourceMember = source.members.get(key);
				if (!sourceMember) return false;

				if (!this.isAssignableTo(sourceMember.type, value.type, environment)) return false;
			}
			return true;
		}
		if (target.kind === "interface") {
			if (source.kind !== "object" && source.kind !== "interface") return false;
			if (source.kind === "object") {
				for (const [key, value] of target.object.members) {
					const sourceMember = source.members.get(key);
					if (!sourceMember) return false;

					if (!this.isAssignableTo(sourceMember.type, value.type, environment)) return false;
				}
			} else {
				for (const [key, value] of target.object.members) {
					const sourceMember = source.object.members.get(key);
					if (!sourceMember) return false;

					if (!this.isAssignableTo(sourceMember.type, value.type, environment)) return false;
				}
			}
			return true;
		}

		if (target.kind === "array") {
			if (source.kind !== "array") return false;
			if (target.elementType.kind === "emptiness") return true;
			return this.isAssignableTo(source.elementType, target.elementType, environment);
		}
		if (target.kind === "union") {
			for (let index = 0; index < target.types.length; index++) {
				const element = target.types[index]!;
				if (this.isAssignableTo(source, element, environment)) return true;
			}
			return false;
		}
		if (target.kind === "intersection") {
			for (let index = 0; index < target.types.length; index++) {
				const element = target.types[index]!;
				if (!this.isAssignableTo(source, element, environment)) return false;
			}
			return true;
		}

		return false;
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
				const resolvedLeft = this.resolveExpression(node.left);
				const left = this.createTypedExpression(node.left, resolvedLeft);
				const resolvedRight = this.resolveExpression(node.right);
				const right = this.createTypedExpression(node.right, resolvedRight);

				return createTypedBinaryExpression(node, left, right, resolvedType) as TypedExpressionOf<T>;
			}
			case "PrefixUnaryExpression":
				return createTypedPrefixUnaryExpression(node, this.createTypedExpression(node.value, this.resolveExpression(node.value)), resolvedType) as TypedExpressionOf<T>;
			case "PostfixUnaryExpression":
				return createTypedPostfixUnaryExpression(node, this.createTypedExpression(node.value, this.resolveExpression(node.value)), resolvedType) as TypedExpressionOf<T>;
			case "MemberAccessExpression":
				return createTypedMemberAccessExpression(
					node,
					this.createTypedExpression(node.object, this.resolveExpression(node.object)),
					this.createTypedExpression(node.member, this.resolveExpression(node.member)),
					resolvedType
				) as TypedExpressionOf<T>;
			case "FunctionCallExpression": {
				const args: TypedArgument[] = [];
				for (let index = 0; index < node.arguments.length; index++) {
					const element = node.arguments[index]!;
					args.push(createTypedArgument(element, this.createTypedExpression(element.value, this.resolveExpression(element.value))));
				}

				return createTypedFunctionCallExpression(
					node,
					this.createTypedExpression(node.callee, this.resolveExpression(node.callee)),
					args,
					resolvedType
				) as TypedExpressionOf<T>;
			}
			case "ArrayLiteralExpression": {
				const elements: TypedExpression[] = [];

				for (let index = 0; index < node.elements.length; index++) {
					const element = node.elements[index]!;
					elements.push(this.createTypedExpression(element, this.resolveExpression(element)));
				}
				return createTypedArrayLiteralExpression(node, elements, resolvedType) as TypedExpressionOf<T>;
			}
			case "IndexExpression":
				return createTypedIndexExpression(
					node,
					this.createTypedExpression(node.object, this.resolveExpression(node.object)),
					this.createTypedExpression(node.index, this.resolveExpression(node.index)),
					resolvedType
				) as TypedExpressionOf<T>;
			case "AssertionExpression": {
				return createTypedAssertionExpression(
					node,
					this.createTypedExpression(node.value, this.resolveExpression(node.value)),
					this.createTypedTypeNode(node.target, this.resolveType(node.target, this.currentEnvironment)),
					resolvedType
				) as TypedExpressionOf<T>;
			}
			case "ObjectExpression": {
				const properties: TypedProperty[] = [];
				for (let index = 0; index < node.properties.length; index++) {
					const element = node.properties[index]!;
					properties.push(createTypedProperty(element, this.createTypedTypeNode(element.propertyType, this.resolveType(element.propertyType, this.currentEnvironment))));
				}
				return createTypedObjectExpression(node, properties, resolvedType) as TypedExpressionOf<T>;
			}
			case "ConstructorExpression": {
				const args: TypedArgument[] = [];
				for (let index = 0; index < node.arguments.length; index++) {
					const element = node.arguments[index]!;
					args.push(createTypedArgument(element, this.createTypedExpression(element.value, this.resolveExpression(element.value))));
				}
				return createTypedConstructorExpression(
					node,
					this.createTypedExpression(node.class, this.resolveExpression(node.class)),
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
					this.createTypedTypeNode(node.typeA, this.resolveType(node.typeA, this.currentEnvironment)),
					this.createTypedTypeNode(node.typeB, this.resolveType(node.typeB, this.currentEnvironment)),
					resolvedType
				);
			case "IntersectionType":
				return createTypedIntersectionType(
					node,
					this.createTypedTypeNode(node.typeA, this.resolveType(node.typeA, this.currentEnvironment)),
					this.createTypedTypeNode(node.typeB, this.resolveType(node.typeB, this.currentEnvironment)),
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
							this.createTypedTypeNode(element.parameterType, this.resolveType(element.parameterType, this.currentEnvironment))
						)
					);
				}
				const genericParameters: TypedGenericParameter[] = [];
				for (let index = 0; index < node.genericParameters.length; index++) {
					const element = node.genericParameters[index]!;
					genericParameters.push(createTypedGenericParameter(element, this.createTypedTypeNode(element.value, this.resolveType(element.value, this.currentEnvironment))));
				}
				return createTypedFunctionType(
					node,
					parameters,
					genericParameters,
					this.createTypedTypeNode(node.returnType, this.resolveType(node.returnType, this.currentEnvironment)),
					resolvedType
				);
			}
			case "ArrayLiteralExpression": {
				const elements: TypedExpression[] = [];

				for (let index = 0; index < node.elements.length; index++) {
					const element = node.elements[index]!;
					elements.push(this.createTypedExpression(element, this.resolveExpression(element)));
				}
				return createTypedArrayLiteralExpression(node, elements, resolvedType);
			}

			case "TypeReference": {
				const genericTypes: TypedTypeNode[] = [];
				for (let index = 0; index < node.genericTypes.length; index++) {
					const element = node.genericTypes[index]!;
					genericTypes.push(this.createTypedTypeNode(element, this.resolveType(element, this.currentEnvironment)));
				}
				return createTypedTypeReference(node, createTypedIdentifier(node.identifier, this.resolveExpression(node.identifier)), genericTypes, resolvedType);
			}
			case "ObjectExpression": {
				const properties: TypedProperty[] = [];
				for (let index = 0; index < node.properties.length; index++) {
					const element = node.properties[index]!;
					properties.push(createTypedProperty(element, this.createTypedTypeNode(element.propertyType, this.resolveType(element.propertyType, this.currentEnvironment))));
				}
				return createTypedObjectExpression(node, properties, resolvedType);
			}
		}
	}
	// ===================================================
	//  Resolving
	// ===================================================

	public resolveType(node: TypeNode | FunctionDeclaration, environment: TypeEnvironment): Type {
		switch (node.type) {
			case "NumberLiteral":
				return { kind: "numberLiteral", value: node.value };

			case "StringLiteral":
				return { kind: "stringLiteral", value: node.value };
			case "BooleanLiteral":
				return { kind: "booleanLiteral", value: node.value };
			case "TypeReference": {
				const type = environment.lookup(node.identifier.value);
				if (!type) throw new LPPTypeError("Type `" + node.identifier.value + "` does not exist.");
				let resolvedType = this.resolveTypeFromSymbol(type, environment);
				if (node.optional) {
					resolvedType = {
						kind: "union",
						types: [{ kind: "undefined" }, resolvedType],
					};
				}
				return resolvedType;
			}
			case "UnionType": {
				const types: Type[] = [];
				this.visit(types, node.typeA, environment);
				this.visit(types, node.typeB, environment);

				return { kind: "union", types: types };
			}
			case "IntersectionType": {
				const types: Type[] = [];
				this.visit(types, node.typeA, environment);
				this.visit(types, node.typeB, environment);

				return { kind: "intersection", types: types };
			}

			case "FunctionType": {
				const parameters: Parameter[] = [];
				const typeParameters: TypeParameter[] = [];
				for (let index = 0; index < node.parameters.length; index++) {
					const parameter = node.parameters[index]!;
					parameters.push({
						kind: "parameter",
						name: parameter.name.value,
						type: this.resolveType(parameter.parameterType, environment),
					});
				}
				for (let index = 0; index < node.genericParameters.length; index++) {
					const typeParameter = node.genericParameters[index]!;
					typeParameters.push({
						kind: "typeParameter",
						name: typeParameter.identifier,
						constraint: this.resolveType(typeParameter.value, environment),
					});
				}

				return { kind: "function", returnType: this.resolveType(node.returnType, environment), parameters: parameters, typeParameters: typeParameters };
			}
			case "ArrayLiteralExpression": {
				return { kind: "array", elementType: node.elements[0] ? this.resolveExpression(node.elements[0]) : { kind: "never" } };
			}
			case "ObjectExpression": {
				const object: Object = {
					kind: "object",
					members: new Map<string, Property>(),
				};

				for (let index = 0; index < node.properties.length; index++) {
					const element = node.properties[index]!;
					object.members.set(element.identifier, {
						kind: "property",
						accessModifier: element.accessModifier,
						modifiers: element.modifiers,
						type: this.resolveType(element.propertyType, environment),
						name: element.identifier,
					});
				}
				return object;
			}
			case "FunctionDeclaration": {
				const parameters: Parameter[] = [];
				for (let index = 0; index < node.parameters.length; index++) {
					const element = node.parameters[index]!;
					parameters.push({
						kind: "parameter",
						name: element.name.value,
						type: this.resolveType(element.parameterType, environment),
					});
				}
				const typeParameters: TypeParameter[] = [];
				for (let index = 0; index < node.genericParameters.length; index++) {
					const element = node.genericParameters[index]!;
					typeParameters.push({
						kind: "typeParameter",
						name: element.identifier,
						constraint: this.resolveType(element.value, environment),
					});
				}
				const functionType: Function = {
					kind: "function",
					returnType: this.resolveType(node.returnType, environment),
					parameters: parameters,
					typeParameters: typeParameters,
				};
				return functionType;
			}
		}
	}
	public resolveExpression(node: Expression): Type {
		switch (node.type) {
			case "NumberLiteral":
				return { kind: "numberLiteral", value: node.value };

			case "StringLiteral":
				return { kind: "stringLiteral", value: node.value };
			case "BooleanLiteral":
				return { kind: "booleanLiteral", value: node.value };
			case "Identifier": {
				const symbol = this.currentScope.lookup(node.value);
				if (!symbol) throw new LPPTypeError("Could not resolve symbol `" + node.value + "`.");
				return this.resolveTypeFromSymbol(symbol, this.currentEnvironment);
			}
			case "FunctionCallExpression": {
				const functionType = this.resolveExpression(node.callee);
				if (isLiteral(functionType)) {
					throw new LPPTypeError("Cannot call a literal value.");
				}
				if (functionType.kind !== "function") throw new LPPTypeError("Cannot call an expression that is not a type (" + functionType.kind + ").");
				if (functionType.parameters.length !== node.arguments.length)
					throw new LPPTypeError(`Expected ${functionType.parameters.length} arguments but got ${node.arguments.length}`);
				for (let index = 0; index < node.arguments.length; index++) {
					const argument = node.arguments[index]!;
					const parameter = functionType.parameters[index]!;
					const resolvedArgument = this.resolveExpression(argument.value);
					if (!this.isAssignableTo(resolvedArgument, parameter.type, this.currentEnvironment))
						throw new LPPTypeError("Argument of type `" + resolvedArgument.kind + "` is not assignable to parameter of type `" + parameter.type + "`.");
				}
				return functionType.returnType;
			}

			case "BinaryExpression": {
				return this.getBinaryOperatorReturnType(node.left, node.operator, node.right);
			}
			case "ObjectExpression": {
				const members = new Map<string, Property>();
				for (let index = 0; index < node.properties.length; index++) {
					const element = node.properties[index]!;
					members.set(element.identifier, {
						kind: "property",
						name: element.identifier,
						type: this.resolveType(element.propertyType, this.currentEnvironment),
						modifiers: element.modifiers,
						accessModifier: element.accessModifier,
					});
				}
				return {
					kind: "object",
					members: members,
				};
			}
			case "PrefixUnaryExpression": {
				return this.getPrefixUnaryOperatorReturnType(node.value, node.operator);
			}
			case "ArrayLiteralExpression": {
				let elementType: Type | Union = {
					kind: "emptiness",
				};
				if (node.elements.length === 0) return elementType;
				if (node.elements.length === 1) return this.resolveExpression(node.elements[0]!);
				elementType = {
					kind: "union",
					types: [],
				};
				for (let index = 0; index < node.elements.length; index++) {
					const element = node.elements[index]!;
					const resolvedElementType = this.resolveExpression(element);
					if (elementType.types.includes(resolvedElementType)) continue;
					elementType.types.push(resolvedElementType);
				}
				return elementType;
			}
			case "IndexExpression": {
				const resolvedIndex = this.resolveExpression(node.index);
				const resolvedObject = this.resolveExpression(node.object);
				if (resolvedObject.kind !== "array") throw new LPPTypeError("Cannot index a value of type `" + resolvedObject.kind + "`, you can only index arrays.");
				if (!numericTypes.includes(resolvedIndex))
					throw new LPPTypeError(
						"Cannot index an object with a value of type `" + resolvedIndex.kind + "`, did you mean to use a member access expression (dot . operator)?"
					);
				return resolvedObject.elementType;
			}
			case "MemberAccessExpression": {
				const resolvedObject = this.resolveExpression(node.object);
				if (!(resolvedObject.kind === "object" || resolvedObject.kind === "class" || resolvedObject.kind === "interface" || resolvedObject.kind === "userDefinedType"))
					throw new LPPTypeError("Cannot access a non-object like value such as `" + resolvedObject.kind + "`.");
				const resolvedMember = this.resolveMember(
					resolvedObject,
					node.member,
					new LPPTypeError("Member `" + node.member.value + "` could not be found on type `" + resolvedObject.kind + "`.")
				);
				return resolvedMember;
			}

			case "AssertionExpression": {
				const resolvedTarget = this.resolveType(node.target, this.currentEnvironment);
				const resolvedValue = this.resolveExpression(node.value);
				if (this.isAssignableTo(resolvedValue, resolvedTarget, this.currentEnvironment)) return resolvedTarget;
				throw new LPPTypeError("Cannot assert value  `" + resolvedValue.kind + "` to the type `" + resolvedTarget.kind + "`. They don't seem to have anything in common");
			}
			case "PostfixUnaryExpression":
			default:
				throw new LPPTypeError("Unknown expression `" + node.type + "`.");
		}
	}

	private resolveMember(object: ObjectLike, memberName: Identifier, error: LPPTypeError): Type {
		switch (object.kind) {
			case "object": {
				const member = object.members.get(memberName.value);
				if (!member) throw error;
				return member.type;
			}

			case "interface": {
				const member = this.lookupMemberOnInterface(object, memberName.value);
				if (!member) throw error;
				return member.type;
			}
			case "class": {
				const member = this.lookupMemberOnClass(object, memberName.value);
				if (!member) throw error;
				if (member.kind === "method") return member.returnType;
				return member.type;
			}
			case "userDefinedType": {
				return this.resolveMember(object.object, memberName, error);
			}
		}
	}
	public unwrap(type: Type, environment: TypeEnvironment, checking: Set<Type>): Type {
		if (type.kind !== "typeAlias") return type;
		const old = type;
		checking.add(type);
		type = type.type;
		if (type.kind !== "typeAlias") {
			checking.delete(old);
			return type;
		}
		if (checking.has(type)) throw new LPPTypeError("Type `" + type.name + "` circularly references itself");

		const unwrapped = this.unwrap(type, environment, checking);
		checking.delete(old);
		return unwrapped;
	}
	private lookupMemberOnInterface(_interface: Interface, memberName: string) {
		let member = _interface.object.members.get(memberName);
		if (!member) {
			for (let index = 0; index < _interface.extends.length; index++) {
				const element = _interface.extends[index]!;
				let member = this.lookupMemberOnInterface(element, memberName);
				break;
			}
		}
		return member;
	}
	private lookupMemberOnClass(_class: Class, memberName: string): Property | Method | null {
		let member: Property | Method | null = null;
		for (let index = 0; index < _class.properties.length; index++) {
			const element = _class.properties[index]!;
			if (element.name === memberName) {
				member = element;
				break;
			}
			continue;
		}
		if (member === null) {
			for (let index = 0; index < _class.methods.length; index++) {
				const element = _class.methods[index]!;
				if (element.name === memberName) {
					member = element;
					break;
				}
				continue;
			}
			if (member === null && _class.superClass) {
				member = this.lookupMemberOnClass(_class.superClass, memberName);
			}
		}

		return member;
	}
	private visit(array: Type[], value: TypeNode, environment: TypeEnvironment): void {
		if (value.type === "IntersectionType" || value.type === "UnionType") {
			this.visit(array, value.typeA, environment);
			this.visit(array, value.typeB, environment);
		} else {
			array.push(this.resolveType(value, environment));
		}
	}
	private isImplementable(node: Type): node is Interface | Intersection | Object {
		return node.kind === "interface" || node.kind === "intersection" || node.kind === "object";
	}
	private isExtendable(node: Type): node is Interface | Intersection | Object {
		return node.kind === "interface" || node.kind === "intersection" || node.kind === "object";
	}
	private resolveMethod(method: FunctionDeclaration, environment: TypeEnvironment): Method {
		const parameters: Parameter[] = [];
		for (let index = 0; index < method.parameters.length; index++) {
			const element = method.parameters[index]!;
			parameters.push({
				kind: "parameter",
				name: element.name.value,
				type: this.resolveType(element.parameterType, environment),
			});
		}
		const typeParameters: TypeParameter[] = [];
		for (let index = 0; index < method.genericParameters.length; index++) {
			const element = method.genericParameters[index]!;
			typeParameters.push({
				kind: "typeParameter",
				name: element.identifier,
				constraint: this.resolveType(element.value, environment),
			});
		}
		return {
			kind: "method",
			name: method.name.value,
			parameters: parameters,
			returnType: this.resolveType(method.returnType, environment),
			typeParameters: typeParameters,
		};
	}
	private implementToClass(resolvedElement: Type, interfaces: Interface[]): void {
		if (!this.isImplementable(resolvedElement)) throw new LPPTypeError(`A class cannot implement type \`${resolvedElement.kind}\`.`);
		if (resolvedElement.kind === "interface") {
			interfaces.push(resolvedElement);
		}
		if (resolvedElement.kind === "object") {
			interfaces.push({
				kind: "interface",
				object: resolvedElement,
				typeParameters: [],
				extends: [],
			});
		}
		if (resolvedElement.kind === "intersection") {
			for (let index = 0; index < resolvedElement.types.length; index++) {
				const element = resolvedElement.types[index]!;
				if (!this.isImplementable(element)) throw new LPPTypeError(`A class cannot implement type \`${element.kind}\`.`);
				this.implementToClass(element, interfaces);
			}
		}
	}
	private extendToInterface(resolvedElement: Type, interfaces: Interface[]): void {
		if (!this.isImplementable(resolvedElement)) throw new LPPTypeError(`A class cannot implement type \`${resolvedElement.kind}\`.`);
		if (resolvedElement.kind === "interface") {
			interfaces.push(resolvedElement);
		}
		if (resolvedElement.kind === "object") {
			interfaces.push({
				kind: "interface",
				object: resolvedElement,
				typeParameters: [],
				extends: [],
			});
		}
		if (resolvedElement.kind === "intersection") {
			for (let index = 0; index < resolvedElement.types.length; index++) {
				const element = resolvedElement.types[index]!;
				if (!this.isExtendable(element)) throw new LPPTypeError(`An interface cannot extend type \`${element.kind}\`.`);
				this.extendToInterface(element, interfaces);
			}
		}
	}
	public resolveTypeFromSymbol(symbol: Symbol, environment: TypeEnvironment): Type {
		switch (symbol.kind) {
			case "Variable": {
				return this.resolveType(symbol.declaration.variableType, environment);
			}
			case "Parameter": {
				return this.resolveType(symbol.declaration.parameterType, environment);
			}
			case "Function":
			case "Method": {
				const parameters: Parameter[] = [];
				for (let index = 0; index < symbol.declaration.parameters.length; index++) {
					const element = symbol.declaration.parameters[index]!;
					parameters.push({
						kind: "parameter",
						name: element.name.value,
						type: this.resolveType(element.parameterType, environment),
					});
				}
				const typeParameters: TypeParameter[] = [];
				for (let index = 0; index < symbol.declaration.genericParameters.length; index++) {
					const element = symbol.declaration.genericParameters[index]!;
					typeParameters.push({
						kind: "typeParameter",
						name: element.identifier,
						constraint: this.resolveType(element.value, environment),
					});
				}
				return {
					kind: "function",
					parameters: parameters,
					returnType: this.resolveType(symbol.declaration.returnType, environment),
					typeParameters: typeParameters,
				};
			}

			case "Class": {
				if (symbol.declaration.hierarchy.extends.length > 1) throw new LPPTypeError("A class cannot extend multiple classes.");
				const properties: Property[] = [];
				for (let index = 0; index < symbol.declaration.properties.length; index++) {
					const element = symbol.declaration.properties[index]!;
					properties.push({
						kind: "property",
						name: element.identifier,
						type: this.resolveType(element.propertyType, environment),
						accessModifier: element.accessModifier,
						modifiers: element.modifiers,
					});
				}
				const methods: Method[] = [];
				for (let i = 0; i < symbol.declaration.methods.length; i++) {
					const method = symbol.declaration.methods[i]!;
					methods.push(this.resolveMethod(method, environment));
				}

				const interfaces: Interface[] = [];
				for (let index = 0; index < symbol.declaration.hierarchy.implements.length; index++) {
					const element = symbol.declaration.hierarchy.implements[index]!;
					const resolvedElement = this.resolveType(element, environment);

					this.implementToClass(resolvedElement, interfaces);
				}
				const typeParameters: TypeParameter[] = [];
				for (let index = 0; index < symbol.declaration.genericTypeParameters.length; index++) {
					const element = symbol.declaration.genericTypeParameters[index]!;
					typeParameters.push({
						kind: "typeParameter",
						name: element.identifier,
						constraint: this.resolveType(element.value, environment),
					});
				}

				let superClass: Class | undefined = undefined;
				for (let index = 0; index < symbol.declaration.hierarchy.extends.length; index++) {
					const element = symbol.declaration.hierarchy.extends[index]!;
					const resolvedElement = this.resolveType(element, environment);
					if (resolvedElement.kind !== "class") throw new LPPTypeError(`A class cannot extend type \`${resolvedElement.kind}\`.`);
					superClass = resolvedElement;
				}

				return {
					kind: "class",
					name: symbol.name,
					identity: symbol,
					declaration: symbol.declaration,
					properties: properties,
					methods: methods,

					interfaces: interfaces,
					typeParameters: typeParameters,
					superClass: superClass,
				};
			}
			case "Interface": {
				const object: Object = {
					kind: "object",
					members: new Map<string, Property>(),
				};
				for (let index = 0; index < symbol.declaration.properties.length; index++) {
					const element = symbol.declaration.properties[index]!;
					object.members.set(element.identifier, {
						kind: "property",
						type: this.resolveType(element.propertyType, environment),
						accessModifier: element.accessModifier,
						modifiers: element.modifiers,
						name: element.identifier,
					});
				}
				const typeParameters: TypeParameter[] = [];
				for (let index = 0; index < symbol.declaration.genericTypeParameters.length; index++) {
					const element = symbol.declaration.genericTypeParameters[index]!;
					typeParameters.push({
						kind: "typeParameter",
						name: element.identifier,
						constraint: this.resolveType(element.value, environment),
					});
				}
				if (symbol.declaration.hierarchy.implements.length > 0) throw new LPPTypeError("An interface cannot have an implements clause.");
				const interfaces: Interface[] = [];
				for (let index = 0; index < symbol.declaration.hierarchy.extends.length; index++) {
					const element = symbol.declaration.hierarchy.extends[index]!;
					const resolvedElement = this.resolveType(element, environment);
					if (!this.isExtendable(resolvedElement)) throw new LPPTypeError(`An interface cannot extend type \`${resolvedElement.kind}\`.`);
					this.extendToInterface(resolvedElement, interfaces);
				}

				return {
					kind: "interface",
					object: object,
					typeParameters: typeParameters,
					extends: interfaces,
				};
			}
			case "TypeAlias": {
				return {
					kind: "typeAlias",
					name: symbol.name,
					type: this.resolveType(symbol.declaration.value, environment),
				};
			}
			case "UserDefinedType": {
				const object: Object = {
					kind: "object",
					members: new Map<string, Property>(),
				};
				for (let index = 0; index < symbol.declaration.properties.length; index++) {
					const element = symbol.declaration.properties[index]!;
					object.members.set(element.identifier, {
						kind: "property",
						type: this.resolveType(element.propertyType, environment),
						accessModifier: element.accessModifier,
						modifiers: element.modifiers,
						name: element.identifier,
					});
				}
				const typeParameters: TypeParameter[] = [];
				for (let index = 0; index < symbol.declaration.genericTypeParameters.length; index++) {
					const element = symbol.declaration.genericTypeParameters[index]!;
					typeParameters.push({
						kind: "typeParameter",
						name: element.identifier,
						constraint: this.resolveType(element.value, environment),
					});
				}

				return {
					kind: "userDefinedType",
					name: symbol.name,
					object: object,
					typeParameters: typeParameters,
				};
			}
			case "Property": {
				return this.resolveType(symbol.declaration.propertyType, environment);
			}
			case "GenericParameter": {
				return {
					kind: "typeParameter",
					name: symbol.name,
					constraint: this.resolveType(symbol.declaration.value, environment),
				};
			}
		}
	}
	private isSameType(firstType: Type, secondType: Type): boolean {
		if (firstType.kind === "array") {
			if (secondType.kind !== "array") return false;
			return this.isSameType(firstType.elementType, secondType.elementType);
		}
		return firstType.kind === secondType.kind;
	}
	private getBinaryOperatorReturnType(left: Expression, operator: BinaryOperator, right: Expression): Type {
		const resolvedLeft = this.resolveExpression(left);
		const resolvedRight = this.resolveExpression(right);
		const rule = BinaryOperatorTable[operator].find((rule) =>
			rule.allowedTypes.some((type) => {
				if (!this.isSameType(resolvedLeft, type) || !this.isSameType(resolvedRight, type)) {
					return false;
				}

				if (rule.requiresIdenticalTypes && !this.isSameType(resolvedLeft, resolvedRight)) {
					return false;
				}

				return true;
			})
		);
		if (!rule) {
			throw new LPPTypeError(`binary operator \`${operator}\` cannot be applied to types \`${resolvedLeft.kind}\` and \`${resolvedRight.kind}\`.`);
		}
		if (rule.returnType === "same") return resolvedLeft;
		return rule.returnType;
	}
	private getPrefixUnaryOperatorReturnType(value: Expression, operator: PrefixUnaryOperator): Type {
		const resolvedValue = this.resolveExpression(value);
		const rule = PrefixUnaryOperatorTable[operator].find((rule) =>
			rule.allowedTypes.some((type) => {
				if (!this.isSameType(resolvedValue, type)) {
					return false;
				}

				return true;
			})
		);
		if (!rule) {
			throw new LPPTypeError(`unary operator \`${operator}\` cannot be applied to type \`${resolvedValue.kind}\`.`);
		}
		if (rule.returnType === "same") return resolvedValue;
		return rule.returnType;
	}
}
