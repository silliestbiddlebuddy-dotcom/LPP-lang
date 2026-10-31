import type { AccessModifier, generalModifier, Modifier } from "../Lexer/Lexer.types.ts";

export type Expression =
	| NumberLiteral
	| BooleanLiteral
	| StringLiteral
	| Identifier
	| BinaryExpression
	| PrefixUnaryExpression
	| PostfixUnaryExpression
	| MemberAccessExpression
	| FunctionCallExpression
	| ArrayLiteralExpression
	| IndexExpression
	| AssertionExpression
	| ObjectExpression
	| ConstructorExpression;
export type Statement =
	| IfStatement
	| VariableDeclaration
	| ClassDeclaration
	| FunctionDeclaration
	| UserDefinedTypeDeclaration
	| TypeAliasDeclaration
	| ElseifStatement
	| ReturnStatement
	| BreakStatement
	| ContinueStatement
	| ForStatement
	| WhileStatement
	| AssignmentStatement
	| InterfaceDeclaration;

export type HierarchyType = {
	extends: Type[];
	implements: Type[];
};

export type Type = UnionType | IntersectionType | StringLiteral | BooleanLiteral | NumberLiteral | FunctionType | ArrayLiteralExpression | TypeReference | ObjectExpression;
export type DeclarationUnion = VariableDeclaration | InterfaceDeclaration | ClassDeclaration | FunctionDeclaration | UserDefinedTypeDeclaration | TypeAliasDeclaration;
export type BlockStatement = WhileStatement | ForStatement | FunctionDeclaration | IfStatement | ElseifStatement;
export type variableScope = "local" | "global";
export type BinaryOperator = "+" | "-" | "*" | "/" | "**" | "<" | ">" | "<=" | ">=" | "==" | "!=" | "||" | "&&" | "%";
export type PrefixUnaryOperator = "!" | "-" | "++" | "--";
export type PostfixUnaryOperator = "++" | "--";
export type AssignmentOperator = "=" | "+=" | "-=" | "*=" | "/=";
export type ASTType = [Program];
export type typeOperator = "|" | "&";
export class ParserError extends Error {}
export type NodeUnion =
	| VariableDeclaration
	| FunctionCallExpression
	| UserDefinedTypeDeclaration
	| TypeAliasDeclaration
	| UnionType
	| InterfaceDeclaration
	| NumberLiteral
	| BooleanLiteral
	| StringLiteral
	| Identifier
	| BinaryExpression
	| PrefixUnaryExpression
	| PostfixUnaryExpression
	| IfStatement
	| ElseifStatement
	| Parameter
	| Argument
	| ContinueStatement
	| BreakStatement
	| ReturnStatement
	| MemberAccessExpression
	| IndexExpression
	| FunctionCallExpression
	| ArrayLiteralExpression
	| WhileStatement
	| ForStatement
	| ConstructorExpression
	| AssignmentStatement
	| TypeReference
	| GenericParameter
	| ClassDeclaration
	| Property
	| AssertionExpression
	| InterfaceDeclaration;
export interface Node {
	readonly type: string;
}
export interface Program extends Node {
	readonly type: "Program";
	name: string;
	body: NodeUnion[];
}

export interface Declaration extends Node {
	readonly type: string;
	generalModifiers: generalModifier[];
}

export interface VariableDeclaration extends Declaration {
	readonly type: "VariableDeclaration";
	generalModifiers: generalModifier[];
	constant: boolean;
	scope: variableScope;
	variableType: Type;
	initializer: Expression;
	name: string;
}
export interface FunctionDeclaration extends Declaration {
	readonly type: "FunctionDeclaration";
	generalModifiers: generalModifier[];
	body: Block;
	name: Identifier;
	accessModifier: AccessModifier | undefined;
	modifiers: Modifier[];
	returnType: Type;
	parameters: Parameter[];
	genericParameters: GenericParameter[];
}
export interface UserDefinedTypeDeclaration extends Declaration {
	readonly type: "UserDefinedTypeDeclaration";
	generalModifiers: generalModifier[];

	genericTypeParameters: GenericParameter[];
	identifier: string;
	properties: Property[];
}
export interface TypeAliasDeclaration extends Declaration {
	readonly type: "TypeAliasDeclaration";
	generalModifiers: generalModifier[];
	alias: string;
	value: Type;
	parameters: GenericParameter[];
}
export interface UnionType extends Node {
	readonly type: "UnionType";
	typeA: Type;
	typeB: Type;
}
export interface IntersectionType extends Node {
	readonly type: "IntersectionType";
	typeA: Type;
	typeB: Type;
}
export interface NumberLiteral extends Node {
	readonly type: "NumberLiteral";
	value: number;
}
export interface StringLiteral extends Node {
	readonly type: "StringLiteral";
	value: string;
}
export interface BooleanLiteral extends Node {
	readonly type: "BooleanLiteral";
	value: boolean;
}
export interface Identifier extends Node {
	readonly type: "Identifier";
	value: string;
}
export interface BinaryExpression extends Node {
	readonly type: "BinaryExpression";
	left: Expression;
	operator: BinaryOperator;
	right: Expression;
}
export interface PrefixUnaryExpression extends Node {
	readonly type: "PrefixUnaryExpression";
	operator: PrefixUnaryOperator;
	value: Expression;
}
export interface PostfixUnaryExpression extends Node {
	readonly type: "PostfixUnaryExpression";
	operator: PostfixUnaryOperator;
	value: Expression;
}
export interface Block extends Node {
	readonly type: "Block";
	body: Node[];
}
export interface IfStatement extends Node {
	readonly type: "IfStatement";
	body: Block;
	condition: Expression;
	elseIfs: ElseifStatement[];
	else?: Block | null;
}
export interface ElseifStatement extends Node {
	readonly type: "ElseifStatement";
	body: Block;
	condition: Expression;
}
export interface Parameter extends Node {
	readonly type: "Parameter";
	name: Identifier;
	parameterType: Type;
}
export interface Argument extends Node {
	readonly type: "Argument";
	value: Expression;
}

export interface ReturnStatement extends Node {
	readonly type: "ReturnStatement";
	expression: Expression;
}
export interface ContinueStatement extends Node {
	readonly type: "ContinueStatement";
}
export interface BreakStatement extends Node {
	readonly type: "BreakStatement";
}

export interface ImportSourceStatement extends Node {
	readonly type: "ImportSourceStatement";
	source: string;
	imports: Identifier[];
}
export interface ImportStdlibStatement extends Node {
	readonly type: "ImportStdlibStatement";
	stdlib: string;
	imports: Identifier[];
}

export interface MemberAccessExpression extends Node {
	readonly type: "MemberAccessExpression";
	object: Expression;
	member: Identifier;
}
export interface FunctionCallExpression extends Node {
	readonly type: "FunctionCallExpression";
	callee: Expression;
	arguments: Argument[];
}
export interface IndexExpression extends Node {
	readonly type: "IndexExpression";
	object: Expression;
	index: Expression;
}
export interface ArrayLiteralExpression extends Node {
	readonly type: "ArrayLiteralExpression";
	elements: Expression[];
}
export interface WhileStatement extends Node {
	readonly type: "WhileStatement";
	condition: Expression;
	body: Block;
}
export interface AssignmentStatement extends Node {
	readonly type: "AssignmentStatement";
	value: Expression;
	target: Expression;
	operator: AssignmentOperator;
}
export interface ForStatement extends Node {
	readonly type: "ForStatement";
	initializer: VariableDeclaration;
	condition: Expression;
	update: AssignmentStatement;
	body: Block;
}
export interface TypeReference extends Node {
	readonly type: "TypeReference";
	identifier: Identifier;
	genericTypes: Type[];
	optional: boolean;
}
export interface GenericParameter extends Node {
	readonly type: "GenericParameter";
	identifier: string;
	value: Type;
}
export interface Property extends Node {
	readonly type: "Property";
	accessModifier: AccessModifier | undefined;
	modifiers: Modifier[];
	identifier: string;
	propertyType: Type;
}

export interface AssertionExpression extends Node {
	readonly type: "AssertionExpression";
	value: Expression;
	target: Type;
}
export interface ClassDeclaration extends Declaration {
	readonly type: "ClassDeclaration";
	generalModifiers: generalModifier[];
	hierarchy: HierarchyType;
	genericTypeParameters: GenericParameter[];
	identifier: string;
	properties: Property[];
	methods: FunctionDeclaration[];
}
export interface InterfaceDeclaration extends Declaration {
	readonly type: "InterfaceDeclaration";
	generalModifiers: generalModifier[];
	hierarchy: HierarchyType;
	genericTypeParameters: GenericParameter[];
	identifier: string;
	properties: Property[];
}

export interface FunctionType extends Node {
	readonly type: "FunctionType";
	parameters: Parameter[];
	genericParameters: GenericParameter[];
	returnType: Type;
}
export interface ObjectExpression extends Node {
	readonly type: "ObjectExpression";
	properties: Property[];
}
export interface ConstructorExpression extends Node {
	readonly type: "ConstructorExpression";
	arguments: Argument[];
	class: Expression;
}
