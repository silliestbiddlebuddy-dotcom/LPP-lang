import { isAssignmentOperator } from "../Parser/ASTGuards.ts";
import type { AccessModifier, generalModifier, Span, Modifier } from "../Lexer/Lexer.types.ts";
import {
	NodeKind,
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

export function createProgram(name: string, text: string): Program {
	return {
		type: NodeKind.Program,
		name: name,
		body: [],
		text,
	};
}
export function createVariableDeclaration(
	scope: variableScope,
	constant: boolean,
	name: string,
	type: Type,
	initializer: Expression,
	generalModifiers: generalModifier[],
	text: string,
	position: Span
): VariableDeclaration {
	return {
		type: NodeKind.VariableDeclaration,
		generalModifiers: generalModifiers,
		scope: scope,
		constant: constant,
		variableType: type,
		initializer: initializer,
		name: name,
		text,
		position,
	};
}
export function createNumberLiteral(value: number, text: string, position: Span): NumberLiteral {
	return {
		type: NodeKind.NumberLiteral,
		value,
		text,
		position,
	};
}
export function createStringLiteral(value: string, text: string, position: Span): StringLiteral {
	return {
		type: NodeKind.StringLiteral,
		value,
		text,
		position,
	};
}
export function createTypeReference(identifier: Identifier, generics: Type[], optional: boolean, text: string, position: Span): TypeReference {
	return {
		type: NodeKind.TypeReference,
		identifier: identifier,
		genericTypes: generics,
		optional: optional,
		text,
		position,
	};
}
export function createBooleanLiteral(value: string, text: string, position: Span): BooleanLiteral {
	return {
		type: NodeKind.BooleanLiteral,
		value: Boolean(value),
		text,
		position,
	};
}

export function createIdentifier(value: string, text: string, position: Span): Identifier {
	return {
		type: NodeKind.Identifier,
		value,
		text,
		position,
	};
}

export function createBinaryExpression(left: Expression, operator: BinaryOperator, right: Expression, text: string, position: Span): BinaryExpression {
	return {
		type: NodeKind.BinaryExpression,
		left,
		operator,
		right,
		text,
		position,
	};
}
export function createPostfixUnaryExpression(operator: PostfixUnaryOperator, value: Expression, text: string, position: Span): PostfixUnaryExpression {
	return {
		type: NodeKind.PostfixUnaryExpression,
		operator: operator,
		value: value,
		text,
		position,
	};
}
export function createPrefixUnaryExpression(operator: PrefixUnaryOperator, value: Expression, text: string, position: Span): PrefixUnaryExpression {
	return {
		type: NodeKind.PrefixUnaryExpression,
		operator: operator,
		value: value,
		text,
		position,
	};
}
export function createBlock(body: Node[], text: string, position: Span): Block {
	return {
		type: NodeKind.Block,
		body: body,
		text,
		position,
	};
}
export function createParameter(name: Identifier, type: Type, text: string, position: Span): Parameter {
	return {
		type: NodeKind.Parameter,
		name,
		parameterType: type,
		text,
		position,
	};
}
export function createFunctionDeclaration(
	name: Identifier,
	returnType: Type,
	modifiers: Modifier[],
	parameters: Parameter[],

	body: Block,
	generalModifiers: generalModifier[],
	genericParameters: GenericParameter[],
	text: string,
	position: Span,
	accessModifier?: AccessModifier
): FunctionDeclaration {
	return {
		type: NodeKind.FunctionDeclaration,
		generalModifiers: generalModifiers,
		returnType: returnType,
		name: name,
		body: body,
		modifiers: modifiers,
		parameters: parameters,
		accessModifier: accessModifier,
		genericParameters: genericParameters,
		text,
		position,
	};
}
export function createIfStatement(body: Block, condition: Expression, text: string, position: Span, elseifs?: ElseifStatement[], elseBlock?: Block): IfStatement {
	return {
		type: NodeKind.IfStatement,
		body: body,
		condition: condition,
		elseIfs: elseifs || [],
		else: elseBlock || null,
		text,
		position,
	};
}
export function createElseifStatement(body: Block, condition: Expression, text: string, position: Span): ElseifStatement {
	return {
		type: NodeKind.ElseifStatement,
		body: body,
		condition: condition,
		text,
		position,
	};
}
export function createTypeAliasDeclaration(
	alias: string,
	value: Type,
	parameters: GenericParameter[],
	generalModifiers: generalModifier[],
	text: string,
	position: Span
): TypeAliasDeclaration {
	return {
		type: NodeKind.TypeAliasDeclaration,
		generalModifiers: generalModifiers,
		alias: alias,
		value: value,
		parameters: parameters,
		text,
		position,
	};
}
export function createReturnStatement(expression: Expression, text: string, position: Span): ReturnStatement {
	return {
		type: NodeKind.ReturnStatement,
		expression: expression,
		text,
		position,
	};
}
export function createContinueStatement(text: string, position: Span): ContinueStatement {
	return {
		type: NodeKind.ContinueStatement,
		text,
		position,
	};
}
export function createBreakStatement(text: string, position: Span): BreakStatement {
	return {
		type: NodeKind.BreakStatement,
		text,
		position,
	};
}

export function createMemberAccessExpression(object: Expression, member: Identifier, text: string, position: Span): MemberAccessExpression {
	return {
		type: NodeKind.MemberAccessExpression,
		object: object,
		member: member,
		text,
		position,
	};
}
export function createArgument(value: Expression, text: string, position: Span): Argument {
	return {
		type: NodeKind.Argument,
		value: value,
		text,
		position,
	};
}
export function createFunctionCallExpression(callee: Expression, argumentArray: Argument[], text: string, position: Span): FunctionCallExpression {
	return {
		type: NodeKind.FunctionCallExpression,
		callee: callee,
		arguments: argumentArray,
		text,
		position,
	};
}
export function createIndexExpression(object: Expression, index: Expression, text: string, position: Span): IndexExpression {
	return {
		type: NodeKind.IndexExpression,
		object: object,
		index: index,
		text,
		position,
	};
}
export function createArrayLiteralExpression(elements: Expression[], text: string, position: Span): ArrayLiteralExpression {
	return {
		type: NodeKind.ArrayLiteralExpression,
		elements: elements,
		text,
		position,
	};
}
export function createWhileStatement(body: Block, condition: Expression, text: string, position: Span): WhileStatement {
	return {
		type: NodeKind.WhileStatement,
		body: body,
		condition: condition,
		text,
		position,
	};
}
export function createAssignmentStatement(target: Expression, operator: AssignmentOperator, value: Expression, text: string, position: Span): AssignmentStatement {
	if (isAssignmentOperator(operator)) {
		return {
			type: NodeKind.AssignmentStatement,
			target: target,
			operator: operator,
			value: value,
			text,
			position,
		};
	}
	throw new ParserError("expected an assignment operator but got " + operator);
}
export function createForStatement(initializer: VariableDeclaration, condition: Expression, update: AssignmentStatement, body: Block, text: string, position: Span): ForStatement {
	return {
		type: NodeKind.ForStatement,
		initializer: initializer,
		condition: condition,
		update: update,
		body: body,
		text,
		position,
	};
}
export function createUserDefinedTypeDeclaration(
	identifier: string,
	parameters: GenericParameter[],
	properties: Property[],
	generalModifiers: generalModifier[],
	text: string,
	position: Span
): UserDefinedTypeDeclaration {
	return {
		identifier: identifier,
		type: NodeKind.UserDefinedTypeDeclaration,
		generalModifiers: generalModifiers,
		genericTypeParameters: parameters,
		properties: properties,
		text,
		position,
	};
}
export function createGenericParameter(identifier: string, type: Type, text: string, position: Span): GenericParameter {
	return {
		type: NodeKind.GenericParameter,
		identifier: identifier,
		value: type,
		text,
		position,
	};
}
export function createProperty(identifier: string, type: Type, modifiers: Modifier[], text: string, position: Span, accessModifier?: AccessModifier): Property {
	return {
		type: NodeKind.Property,
		identifier: identifier,
		propertyType: type,
		accessModifier: accessModifier,
		modifiers: modifiers,
		text,
		position,
	};
}

export function createAssertionExpression(value: Expression, target: Type, text: string, position: Span): AssertionExpression {
	return {
		type: NodeKind.AssertionExpression,
		value: value,
		target: target,
		text,
		position,
	};
}
export function createUnionType(left: Type, right: Type, text: string, position: Span): UnionType {
	return {
		type: NodeKind.UnionType,
		typeA: left,
		typeB: right,
		text,
		position,
	};
}
export function createIntersectionType(left: Type, right: Type, text: string, position: Span): IntersectionType {
	return {
		type: NodeKind.IntersectionType,
		typeA: left,
		typeB: right,
		text,
		position,
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
	},
	text: string,
	position: Span
): ClassDeclaration {
	return {
		type: NodeKind.ClassDeclaration,
		generalModifiers: generalModifiers,
		genericTypeParameters: genericTypeParameters,
		identifier: identifier,
		properties: properties,
		methods: methods,
		hierarchy: hierarchy,
		text,
		position,
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
	},
	text: string,
	position: Span
): InterfaceDeclaration {
	return {
		type: NodeKind.InterfaceDeclaration,
		generalModifiers: generalModifiers,
		genericTypeParameters: genericTypeParameters,
		identifier: identifier,
		properties: properties,
		hierarchy: hierarchy,
		text,
		position,
	};
}
export function createFunctionType(parameters: Parameter[], genericParameters: GenericParameter[], returnType: Type, text: string, position: Span): FunctionType {
	return {
		type: NodeKind.FunctionType,
		parameters: parameters,
		genericParameters: genericParameters,
		returnType: returnType,
		text,
		position,
	};
}

export function createObjectExpression(properties: Property[], text: string, position: Span): ObjectExpression {
	return {
		type: NodeKind.ObjectExpression,
		properties: properties,
		text,
		position,
	};
}

export function createConstructorExpression(classExpr: Expression, argumentsArray: Argument[], text: string, position: Span): ConstructorExpression {
	return {
		type: NodeKind.ConstructorExpression,
		arguments: argumentsArray,
		class: classExpr,
		text,
		position,
	};
}
