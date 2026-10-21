import type * as AST from "../../Parser/Parser.types.ts";
import type { Type as SemanticType } from "../Environment/Builtins.ts";

//generated code dont touch

// ============================================================
// Base types
// ============================================================

export interface TypedObject {
	resolvedType: SemanticType;
}

type TypedBase<T> = Omit<T, "resolvedType"> & TypedObject;

type TypedChildren<T, K extends keyof T, R> = Omit<T, K | "resolvedType"> & R & TypedObject;

// ============================================================
// Expressions
// ============================================================

export type TypedNumberLiteral = TypedBase<AST.NumberLiteral>;
export type TypedBooleanLiteral = TypedBase<AST.BooleanLiteral>;
export type TypedStringLiteral = TypedBase<AST.StringLiteral>;
export type TypedIdentifier = TypedBase<AST.Identifier>;

export type TypedBinaryExpression = TypedChildren<
	AST.BinaryExpression,
	"left" | "right",
	{
		left: TypedExpression;
		right: TypedExpression;
	}
>;

export type TypedPrefixUnaryExpression = TypedChildren<AST.PrefixUnaryExpression, "value", { value: TypedExpression }>;

export type TypedPostfixUnaryExpression = TypedChildren<AST.PostfixUnaryExpression, "value", { value: TypedExpression }>;

export type TypedMemberAccessExpression = TypedChildren<
	AST.MemberAccessExpression,
	"object" | "member",
	{
		object: TypedExpression;
		member: TypedIdentifier;
	}
>;

export type TypedFunctionCallExpression = TypedChildren<
	AST.FunctionCallExpression,
	"callee" | "arguments",
	{
		callee: TypedExpression;
		arguments: TypedArgument[];
	}
>;

export type TypedArrayLiteralExpression = TypedChildren<AST.ArrayLiteralExpression, "elements", { elements: TypedExpression[] }>;

export type TypedIndexExpression = TypedChildren<
	AST.IndexExpression,
	"object" | "index",
	{
		object: TypedExpression;
		index: TypedExpression;
	}
>;

export type TypedAssertionExpression = TypedChildren<
	AST.AssertionExpression,
	"value" | "target",
	{
		value: TypedExpression;
		target: TypedTypeNode;
	}
>;

export type TypedObjectExpression = TypedChildren<AST.ObjectExpression, "properties", { properties: TypedProperty[] }>;

export type TypedConstructorExpression = TypedChildren<
	AST.ConstructorExpression,
	"class" | "arguments",
	{
		class: TypedExpression;
		arguments: TypedArgument[];
	}
>;

export type TypedExpression =
	| TypedNumberLiteral
	| TypedBooleanLiteral
	| TypedStringLiteral
	| TypedIdentifier
	| TypedBinaryExpression
	| TypedPrefixUnaryExpression
	| TypedPostfixUnaryExpression
	| TypedMemberAccessExpression
	| TypedFunctionCallExpression
	| TypedArrayLiteralExpression
	| TypedIndexExpression
	| TypedAssertionExpression
	| TypedObjectExpression
	| TypedConstructorExpression;

// ============================================================
// Type nodes
// ============================================================

export type TypedUnionType = TypedChildren<
	AST.UnionType,
	"typeA" | "typeB",
	{
		typeA: TypedTypeNode;
		typeB: TypedTypeNode;
	}
>;

export type TypedIntersectionType = TypedChildren<
	AST.IntersectionType,
	"typeA" | "typeB",
	{
		typeA: TypedTypeNode;
		typeB: TypedTypeNode;
	}
>;

export type TypedTypeReference = TypedChildren<
	AST.TypeReference,
	"identifier" | "genericTypes",
	{
		identifier: TypedIdentifier;
		genericTypes: TypedTypeNode[];
	}
>;

export type TypedFunctionType = TypedChildren<
	AST.FunctionType,
	"parameters" | "genericParameters" | "returnType",
	{
		parameters: TypedParameter[];
		genericParameters: TypedGenericParameter[];
		returnType: TypedTypeNode;
	}
>;

export type TypedTypeNode =
	| TypedNumberLiteral
	| TypedBooleanLiteral
	| TypedStringLiteral
	| TypedArrayLiteralExpression
	| TypedObjectExpression
	| TypedUnionType
	| TypedIntersectionType
	| TypedTypeReference
	| TypedFunctionType;

// ============================================================
// Supporting nodes
// ============================================================

export type TypedBlock = Omit<AST.Block, "body"> & {
	body: TypedNode[];
};

export type TypedParameter = Omit<AST.Parameter, "name" | "parameterType"> & {
	name: TypedIdentifier;
	parameterType: TypedTypeNode;
};

export type TypedArgument = Omit<AST.Argument, "value"> & {
	value: TypedExpression;
};

export type TypedGenericParameter = Omit<AST.GenericParameter, "value"> & {
	value: TypedTypeNode;
};

export type TypedProperty = Omit<AST.Property, "propertyType"> & {
	propertyType: TypedTypeNode;
};

export type TypedHierarchyType = Omit<AST.HierarchyType, "extends" | "implements"> & {
	extends: TypedTypeNode[];
	implements: TypedTypeNode[];
};

// ============================================================
// Declarations
// ============================================================

export type TypedVariableDeclaration = TypedChildren<
	AST.VariableDeclaration,
	"variableType" | "initializer",
	{
		variableType: TypedTypeNode;
		initializer: TypedExpression;
	}
>;

export type TypedFunctionDeclaration = TypedChildren<
	AST.FunctionDeclaration,
	"name" | "parameters" | "returnType" | "body" | "genericParameters",
	{
		name: TypedIdentifier;
		parameters: TypedParameter[];
		returnType: TypedTypeNode;
		body: TypedBlock;
		genericParameters: TypedGenericParameter[];
	}
>;

export type TypedUserDefinedTypeDeclaration = TypedChildren<
	AST.UserDefinedTypeDeclaration,
	"properties" | "genericTypeParameters",
	{
		properties: TypedProperty[];
		genericTypeParameters: TypedGenericParameter[];
	}
>;

export type TypedTypeAliasDeclaration = TypedChildren<
	AST.TypeAliasDeclaration,
	"value" | "parameters",
	{
		value: TypedTypeNode;
		parameters: TypedGenericParameter[];
	}
>;

export type TypedClassDeclaration = TypedChildren<
	AST.ClassDeclaration,
	"hierarchy" | "properties" | "methods" | "genericTypeParameters",
	{
		hierarchy: TypedHierarchyType;
		properties: TypedProperty[];
		methods: TypedFunctionDeclaration[];
		genericTypeParameters: TypedGenericParameter[];
	}
>;

export type TypedInterfaceDeclaration = TypedChildren<
	AST.InterfaceDeclaration,
	"hierarchy" | "properties" | "genericTypeParameters",
	{
		hierarchy: TypedHierarchyType;
		properties: TypedProperty[];
		genericTypeParameters: TypedGenericParameter[];
	}
>;

export type TypedDeclaration =
	| TypedVariableDeclaration
	| TypedFunctionDeclaration
	| TypedUserDefinedTypeDeclaration
	| TypedTypeAliasDeclaration
	| TypedClassDeclaration
	| TypedInterfaceDeclaration;

// ============================================================
// Statements
// ============================================================

export type TypedIfStatement = TypedChildren<
	AST.IfStatement,
	"condition" | "body" | "elseIfs" | "else",
	{
		condition: TypedExpression;
		body: TypedBlock;
		elseIfs: TypedElseifStatement[];
		else?: TypedBlock | null;
	}
>;

export type TypedElseifStatement = TypedChildren<
	AST.ElseifStatement,
	"condition" | "body",
	{
		condition: TypedExpression;
		body: TypedBlock;
	}
>;

export type TypedReturnStatement = TypedChildren<AST.ReturnStatement, "expression", { expression: TypedExpression }>;

export type TypedBreakStatement = TypedBase<AST.BreakStatement>;
export type TypedContinueStatement = TypedBase<AST.ContinueStatement>;

export type TypedForStatement = TypedChildren<
	AST.ForStatement,
	"initializer" | "condition" | "update" | "body",
	{
		initializer: TypedVariableDeclaration;
		condition: TypedExpression;
		update: TypedAssignmentStatement;
		body: TypedBlock;
	}
>;

export type TypedWhileStatement = TypedChildren<
	AST.WhileStatement,
	"condition" | "body",
	{
		condition: TypedExpression;
		body: TypedBlock;
	}
>;

export type TypedAssignmentStatement = TypedChildren<
	AST.AssignmentStatement,
	"target" | "value",
	{
		target: TypedExpression;
		value: TypedExpression;
	}
>;

export type TypedStatement =
	| TypedIfStatement
	| TypedElseifStatement
	| TypedReturnStatement
	| TypedBreakStatement
	| TypedContinueStatement
	| TypedForStatement
	| TypedWhileStatement
	| TypedAssignmentStatement;

// ============================================================
// Complete typed AST
// ============================================================

export type TypedNode = TypedExpression | TypedTypeNode | TypedDeclaration | TypedStatement | TypedBlock | TypedParameter | TypedArgument | TypedGenericParameter | TypedProperty;

export type TypedProgram = {
	type: "TypedProgram";
	name: string;
	body: TypedNode[];
};

export type TypedASTType = [TypedProgram];

// ============================================================
// Expression factories
// ============================================================
export type TypedExpressionOf<T extends AST.Expression> = T extends AST.NumberLiteral
	? TypedNumberLiteral
	: T extends AST.BooleanLiteral
	? TypedBooleanLiteral
	: T extends AST.StringLiteral
	? TypedStringLiteral
	: T extends AST.Identifier
	? TypedIdentifier
	: T extends AST.BinaryExpression
	? TypedBinaryExpression
	: T extends AST.PrefixUnaryExpression
	? TypedPrefixUnaryExpression
	: T extends AST.PostfixUnaryExpression
	? TypedPostfixUnaryExpression
	: T extends AST.MemberAccessExpression
	? TypedMemberAccessExpression
	: T extends AST.FunctionCallExpression
	? TypedFunctionCallExpression
	: T extends AST.ArrayLiteralExpression
	? TypedArrayLiteralExpression
	: T extends AST.IndexExpression
	? TypedIndexExpression
	: T extends AST.AssertionExpression
	? TypedAssertionExpression
	: T extends AST.ObjectExpression
	? TypedObjectExpression
	: T extends AST.ConstructorExpression
	? TypedConstructorExpression
	: never;
export function createTypedNumberLiteral(node: AST.NumberLiteral, resolvedType: SemanticType): TypedNumberLiteral {
	return { ...node, resolvedType };
}

export function createTypedBooleanLiteral(node: AST.BooleanLiteral, resolvedType: SemanticType): TypedBooleanLiteral {
	return { ...node, resolvedType };
}

export function createTypedStringLiteral(node: AST.StringLiteral, resolvedType: SemanticType): TypedStringLiteral {
	return { ...node, resolvedType };
}

export function createTypedIdentifier(node: AST.Identifier, resolvedType: SemanticType): TypedIdentifier {
	return { ...node, resolvedType };
}

export function createTypedBinaryExpression(node: AST.BinaryExpression, left: TypedExpression, right: TypedExpression, resolvedType: SemanticType): TypedBinaryExpression {
	return { ...node, left, right, resolvedType };
}

export function createTypedPrefixUnaryExpression(node: AST.PrefixUnaryExpression, value: TypedExpression, resolvedType: SemanticType): TypedPrefixUnaryExpression {
	return { ...node, value, resolvedType };
}

export function createTypedPostfixUnaryExpression(node: AST.PostfixUnaryExpression, value: TypedExpression, resolvedType: SemanticType): TypedPostfixUnaryExpression {
	return { ...node, value, resolvedType };
}

export function createTypedMemberAccessExpression(
	node: AST.MemberAccessExpression,
	object: TypedExpression,
	member: TypedIdentifier,
	resolvedType: SemanticType
): TypedMemberAccessExpression {
	return { ...node, object, member, resolvedType };
}

export function createTypedFunctionCallExpression(
	node: AST.FunctionCallExpression,
	callee: TypedExpression,
	args: TypedArgument[],
	resolvedType: SemanticType
): TypedFunctionCallExpression {
	return { ...node, callee, arguments: args, resolvedType };
}

export function createTypedArrayLiteralExpression(node: AST.ArrayLiteralExpression, elements: TypedExpression[], resolvedType: SemanticType): TypedArrayLiteralExpression {
	return { ...node, elements, resolvedType };
}

export function createTypedIndexExpression(node: AST.IndexExpression, object: TypedExpression, index: TypedExpression, resolvedType: SemanticType): TypedIndexExpression {
	return { ...node, object, index, resolvedType };
}

export function createTypedAssertionExpression(node: AST.AssertionExpression, value: TypedExpression, target: TypedTypeNode, resolvedType: SemanticType): TypedAssertionExpression {
	return { ...node, value, target, resolvedType };
}

export function createTypedObjectExpression(node: AST.ObjectExpression, properties: TypedProperty[], resolvedType: SemanticType): TypedObjectExpression {
	return { ...node, properties, resolvedType };
}

export function createTypedConstructorExpression(
	node: AST.ConstructorExpression,
	classExpression: TypedExpression,
	args: TypedArgument[],
	resolvedType: SemanticType
): TypedConstructorExpression {
	return {
		...node,
		class: classExpression,
		arguments: args,
		resolvedType,
	};
}

// ============================================================
// Type-node factories
// ============================================================

export function createTypedUnionType(node: AST.UnionType, typeA: TypedTypeNode, typeB: TypedTypeNode, resolvedType: SemanticType): TypedUnionType {
	return { ...node, typeA, typeB, resolvedType };
}

export function createTypedIntersectionType(node: AST.IntersectionType, typeA: TypedTypeNode, typeB: TypedTypeNode, resolvedType: SemanticType): TypedIntersectionType {
	return { ...node, typeA, typeB, resolvedType };
}

export function createTypedTypeReference(node: AST.TypeReference, identifier: TypedIdentifier, genericTypes: TypedTypeNode[], resolvedType: SemanticType): TypedTypeReference {
	return { ...node, identifier, genericTypes, resolvedType };
}

export function createTypedFunctionType(
	node: AST.FunctionType,
	parameters: TypedParameter[],
	genericParameters: TypedGenericParameter[],
	returnType: TypedTypeNode,
	resolvedType: SemanticType
): TypedFunctionType {
	return {
		...node,
		parameters,
		genericParameters,
		returnType,
		resolvedType,
	};
}

// ============================================================
// Supporting-node factories
// ============================================================

export function createTypedBlock(node: AST.Block, body: TypedNode[]): TypedBlock {
	return { ...node, body };
}

export function createTypedParameter(node: AST.Parameter, name: TypedIdentifier, parameterType: TypedTypeNode): TypedParameter {
	return { ...node, name, parameterType };
}

export function createTypedArgument(node: AST.Argument, value: TypedExpression): TypedArgument {
	return { ...node, value };
}

export function createTypedGenericParameter(node: AST.GenericParameter, value: TypedTypeNode): TypedGenericParameter {
	return { ...node, value };
}

export function createTypedProperty(node: AST.Property, propertyType: TypedTypeNode): TypedProperty {
	return { ...node, propertyType };
}

export function createTypedHierarchyType(node: AST.HierarchyType, extendsTypes: TypedTypeNode[], implementsTypes: TypedTypeNode[]): TypedHierarchyType {
	return {
		...node,
		extends: extendsTypes,
		implements: implementsTypes,
	};
}

// ============================================================
// Declaration factories
// ============================================================

export function createTypedVariableDeclaration(
	node: AST.VariableDeclaration,
	variableType: TypedTypeNode,
	initializer: TypedExpression,
	resolvedType: SemanticType
): TypedVariableDeclaration {
	return { ...node, variableType, initializer, resolvedType };
}

export function createTypedFunctionDeclaration(
	node: AST.FunctionDeclaration,
	name: TypedIdentifier,
	parameters: TypedParameter[],
	returnType: TypedTypeNode,
	body: TypedBlock,
	genericParameters: TypedGenericParameter[],
	resolvedType: SemanticType
): TypedFunctionDeclaration {
	return {
		...node,
		name,
		parameters,
		returnType,
		body,
		genericParameters,
		resolvedType,
	};
}

export function createTypedUserDefinedTypeDeclaration(
	node: AST.UserDefinedTypeDeclaration,
	properties: TypedProperty[],
	genericTypeParameters: TypedGenericParameter[],
	resolvedType: SemanticType
): TypedUserDefinedTypeDeclaration {
	return {
		...node,
		properties,
		genericTypeParameters,
		resolvedType,
	};
}

export function createTypedTypeAliasDeclaration(
	node: AST.TypeAliasDeclaration,
	value: TypedTypeNode,
	parameters: TypedGenericParameter[],
	resolvedType: SemanticType
): TypedTypeAliasDeclaration {
	return { ...node, value, parameters, resolvedType };
}

export function createTypedClassDeclaration(
	node: AST.ClassDeclaration,
	hierarchy: TypedHierarchyType,
	properties: TypedProperty[],
	methods: TypedFunctionDeclaration[],
	genericTypeParameters: TypedGenericParameter[],
	resolvedType: SemanticType
): TypedClassDeclaration {
	return {
		...node,
		hierarchy,
		properties,
		methods,
		genericTypeParameters,
		resolvedType,
	};
}

export function createTypedInterfaceDeclaration(
	node: AST.InterfaceDeclaration,
	hierarchy: TypedHierarchyType,
	properties: TypedProperty[],
	genericTypeParameters: TypedGenericParameter[],
	resolvedType: SemanticType
): TypedInterfaceDeclaration {
	return {
		...node,
		hierarchy,
		properties,
		genericTypeParameters,
		resolvedType,
	};
}

// ============================================================
// Statement factories
// ============================================================

export function createTypedIfStatement(
	node: AST.IfStatement,
	condition: TypedExpression,
	body: TypedBlock,
	elseIfs: TypedElseifStatement[],
	elseBlock: TypedBlock | null,
	resolvedType: SemanticType
): TypedIfStatement {
	return {
		...node,
		condition,
		body,
		elseIfs,
		else: elseBlock,
		resolvedType,
	};
}

export function createTypedElseifStatement(node: AST.ElseifStatement, condition: TypedExpression, body: TypedBlock, resolvedType: SemanticType): TypedElseifStatement {
	return { ...node, condition, body, resolvedType };
}

export function createTypedReturnStatement(node: AST.ReturnStatement, expression: TypedExpression, resolvedType: SemanticType): TypedReturnStatement {
	return { ...node, expression, resolvedType };
}

export function createTypedBreakStatement(node: AST.BreakStatement, resolvedType: SemanticType): TypedBreakStatement {
	return { ...node, resolvedType };
}

export function createTypedContinueStatement(node: AST.ContinueStatement, resolvedType: SemanticType): TypedContinueStatement {
	return { ...node, resolvedType };
}

export function createTypedForStatement(
	node: AST.ForStatement,
	initializer: TypedVariableDeclaration,
	condition: TypedExpression,
	update: TypedAssignmentStatement,
	body: TypedBlock,
	resolvedType: SemanticType
): TypedForStatement {
	return {
		...node,
		initializer,
		condition,
		update,
		body,
		resolvedType,
	};
}

export function createTypedWhileStatement(node: AST.WhileStatement, condition: TypedExpression, body: TypedBlock, resolvedType: SemanticType): TypedWhileStatement {
	return { ...node, condition, body, resolvedType };
}

export function createTypedAssignmentStatement(
	node: AST.AssignmentStatement,
	target: TypedExpression,
	value: TypedExpression,
	resolvedType: SemanticType
): TypedAssignmentStatement {
	return { ...node, target, value, resolvedType };
}

// ============================================================
// Program factory
// ============================================================

export function createTypedProgram(node: AST.Program, body: TypedNode[]): TypedProgram {
	return { type: "TypedProgram", name: node.name, body };
}
