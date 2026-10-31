import { isAssignmentOperator } from "../Parser/ASTGuards.ts";
import type { AccessModifier, generalModifier, Modifier } from "../Lexer/Lexer.types.ts";
import {
	ParserError,
	type Argument,
	type ArrayLiteralExpression,
	type AssertionExpression,
	type AssignmentOperator,
	type AssignmentStatement,
	type BinaryExpression,
	type BinaryOperator,
	type Block,
	type BooleanLiteral,
	type BreakStatement,
	type ClassDeclaration,
	type ConstructorExpression,
	type ContinueStatement,
	type ElseifStatement,
	type Expression,
	type ForStatement,
	type FunctionCallExpression,
	type FunctionDeclaration,
	type FunctionType,
	type GenericParameter,
	type Identifier,
	type IfStatement,
	type IndexExpression,
	type InterfaceDeclaration,
	type IntersectionType,
	type MemberAccessExpression,
	type Node,
	type NumberLiteral,
	type ObjectExpression,
	type Parameter,
	type PostfixUnaryExpression,
	type PostfixUnaryOperator,
	type PrefixUnaryExpression,
	type PrefixUnaryOperator,
	type Program,
	type Property,
	type ReturnStatement,
	type StringLiteral,
	type Type,
	type TypeAliasDeclaration,
	type TypeReference,
	type UnionType,
	type UserDefinedTypeDeclaration,
	type VariableDeclaration,
	type variableScope,
	type WhileStatement,
} from "../Parser/Parser.types.ts";

export function createProgram(name: string): Program {
	return {
		type: "Program",
		name: name,
		body: [],
	};
}
export function createVariableDeclaration(
	scope: variableScope,
	constant: boolean,
	name: string,
	type: Type,
	initializer: Expression,
	generalModifiers: generalModifier[]
): VariableDeclaration {
	return {
		type: "VariableDeclaration",
		generalModifiers: generalModifiers,
		scope: scope,
		constant: constant,
		variableType: type,
		initializer: initializer,
		name: name,
	};
}
export function createNumberLiteral(value: number): NumberLiteral {
	return {
		type: "NumberLiteral",
		value,
	};
}
export function createStringLiteral(value: string): StringLiteral {
	return {
		type: "StringLiteral",
		value,
	};
}
export function createTypeReference(identifier: Identifier, generics: Type[], optional: boolean): TypeReference {
	return {
		type: "TypeReference",
		identifier: identifier,
		genericTypes: generics,
		optional: optional,
	};
}
export function createBooleanLiteral(value: string): BooleanLiteral {
	return {
		type: "BooleanLiteral",
		value: Boolean(value),
	};
}

export function createIdentifier(value: string): Identifier {
	return {
		type: "Identifier",
		value,
	};
}

export function createBinaryExpression(left: Expression, operator: BinaryOperator, right: Expression): BinaryExpression {
	return {
		type: "BinaryExpression",
		left,
		operator,
		right,
	};
}
export function createPostfixUnaryExpression(operator: PostfixUnaryOperator, value: Expression): PostfixUnaryExpression {
	return {
		type: "PostfixUnaryExpression",
		operator: operator,
		value: value,
	};
}
export function createPrefixUnaryExpression(operator: PrefixUnaryOperator, value: Expression): PrefixUnaryExpression {
	return {
		type: "PrefixUnaryExpression",
		operator: operator,
		value: value,
	};
}
export function createBlock(body: Node[]): Block {
	return {
		type: "Block",
		body: body,
	};
}
export function createParameter(name: string, type: Type): Parameter {
	return {
		type: "Parameter",
		name: createIdentifier(name),
		parameterType: type,
	};
}
export function createFunctionDeclaration(
	name: string,
	returnType: Type,
	modifiers: Modifier[],
	parameters: Parameter[],

	body: Block,
	generalModifiers: generalModifier[],
	genericParameters: GenericParameter[],
	accessModifier?: AccessModifier
): FunctionDeclaration {
	return {
		type: "FunctionDeclaration",
		generalModifiers: generalModifiers,
		returnType: returnType,
		name: createIdentifier(name),
		body: body,
		modifiers: modifiers,
		parameters: parameters,
		accessModifier: accessModifier,
		genericParameters: genericParameters,
	};
}
export function createIfStatement(body: Block, condition: Expression, elseifs?: ElseifStatement[], elseBlock?: Block): IfStatement {
	return {
		type: "IfStatement",
		body: body,
		condition: condition,
		elseIfs: elseifs || [],
		else: elseBlock || null,
	};
}
export function createElseifStatement(body: Block, condition: Expression): ElseifStatement {
	return {
		type: "ElseifStatement",
		body: body,
		condition: condition,
	};
}
export function createTypeAliasDeclaration(alias: string, value: Type, parameters: GenericParameter[], generalModifiers: generalModifier[]): TypeAliasDeclaration {
	return {
		type: "TypeAliasDeclaration",
		generalModifiers: generalModifiers,
		alias: alias,
		value: value,
		parameters: parameters,
	};
}
export function createReturnStatement(expression: Expression): ReturnStatement {
	return {
		type: "ReturnStatement",
		expression: expression,
	};
}
export function createContinueStatement(): ContinueStatement {
	return {
		type: "ContinueStatement",
	};
}
export function createBreakStatement(): BreakStatement {
	return {
		type: "BreakStatement",
	};
}

export function createMemberAccessExpression(object: Expression, member: Identifier): MemberAccessExpression {
	return {
		type: "MemberAccessExpression",
		object: object,
		member: member,
	};
}
export function createArgument(value: Expression): Argument {
	return {
		type: "Argument",
		value: value,
	};
}
export function createFunctionCallExpression(callee: Expression, argumentArray: Argument[]): FunctionCallExpression {
	return {
		type: "FunctionCallExpression",
		callee: callee,
		arguments: argumentArray,
	};
}
export function createIndexExpression(object: Expression, index: Expression): IndexExpression {
	return {
		type: "IndexExpression",
		object: object,
		index: index,
	};
}
export function createArrayLiteralExpression(elements: Expression[]): ArrayLiteralExpression {
	return {
		type: "ArrayLiteralExpression",
		elements: elements,
	};
}
export function createWhileStatement(body: Block, condition: Expression): WhileStatement {
	return {
		type: "WhileStatement",
		body: body,
		condition: condition,
	};
}
export function createAssignmentStatement(target: Expression, operator: AssignmentOperator, value: Expression): AssignmentStatement {
	if (isAssignmentOperator(operator)) {
		return {
			type: "AssignmentStatement",
			target: target,
			operator: operator,
			value: value,
		};
	}
	throw new ParserError("expected an assignment operator but got " + operator);
}
export function createForStatement(initializer: VariableDeclaration, condition: Expression, update: AssignmentStatement, body: Block): ForStatement {
	return {
		type: "ForStatement",
		initializer: initializer,
		condition: condition,
		update: update,
		body: body,
	};
}
export function createUserDefinedTypeDeclaration(
	identifier: string,
	parameters: GenericParameter[],
	properties: Property[],
	generalModifiers: generalModifier[]
): UserDefinedTypeDeclaration {
	return {
		identifier: identifier,
		type: "UserDefinedTypeDeclaration",
		generalModifiers: generalModifiers,
		genericTypeParameters: parameters,
		properties: properties,
	};
}
export function createGenericParameter(identifier: string, type: Type): GenericParameter {
	return {
		type: "GenericParameter",
		identifier: identifier,
		value: type,
	};
}
export function createProperty(identifier: string, type: Type, modifiers: Modifier[], accessModifier?: AccessModifier): Property {
	return {
		type: "Property",
		identifier: identifier,
		propertyType: type,
		accessModifier: accessModifier,
		modifiers: modifiers,
	};
}

export function createAssertionExpression(value: Expression, target: Type): AssertionExpression {
	return {
		type: "AssertionExpression",
		value: value,
		target: target,
	};
}
export function createUnionType(left: Type, right: Type): UnionType {
	return {
		type: "UnionType",
		typeA: left,
		typeB: right,
	};
}
export function createIntersectionType(left: Type, right: Type): IntersectionType {
	return {
		type: "IntersectionType",
		typeA: left,
		typeB: right,
	};
}
export function createClassDeclaration(
	generalModifiers: generalModifier[],
	genericTypeParameters: GenericParameter[],
	identifier: string,
	properties: Property[],
	methods: FunctionDeclaration[],

	hierarchy: {
		extends: Type[];
		implements: Type[];
	}
): ClassDeclaration {
	return {
		type: "ClassDeclaration",
		generalModifiers: generalModifiers,
		genericTypeParameters: genericTypeParameters,
		identifier: identifier,
		properties: properties,
		methods: methods,
		hierarchy: hierarchy,
	};
}
export function createInterfaceDeclaration(
	generalModifiers: generalModifier[],
	genericTypeParameters: GenericParameter[],
	identifier: string,
	properties: Property[],

	hierarchy: {
		extends: Type[];
		implements: Type[];
	}
): InterfaceDeclaration {
	return {
		type: "InterfaceDeclaration",
		generalModifiers: generalModifiers,
		genericTypeParameters: genericTypeParameters,
		identifier: identifier,
		properties: properties,
		hierarchy: hierarchy,
	};
}
export function createFunctionType(parameters: Parameter[], genericParameters: GenericParameter[], returnType: Type): FunctionType {
	return {
		type: "FunctionType",
		parameters: parameters,
		genericParameters: genericParameters,
		returnType: returnType,
	};
}

export function createObjectExpression(properties: Property[]): ObjectExpression {
	return {
		type: "ObjectExpression",
		properties: properties,
	};
}

export function createConstructorExpression(classExpr: Expression, argumentsArray: Argument[]): ConstructorExpression {
	return {
		type: "ConstructorExpression",
		arguments: argumentsArray,
		class: classExpr,
	};
}
