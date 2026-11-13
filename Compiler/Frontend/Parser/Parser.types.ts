import type { AccessModifier, generalModifier, Span, Modifier } from "../Lexer/Lexer.types.ts";
export const enum NodeKind {
	Program,
	NumberLiteral,
	BooleanLiteral,
	StringLiteral,
	Identifier,
	BinaryExpression,
	PrefixUnaryExpression,
	PostfixUnaryExpression,
	MemberAccessExpression,
	FunctionCallExpression,
	ArrayLiteralExpression,
	IndexExpression,
	AssertionExpression,
	ObjectExpression,
	ConstructorExpression,
	IfStatement,
	VariableDeclaration,
	ClassDeclaration,
	FunctionDeclaration,
	UserDefinedTypeDeclaration,
	TypeAliasDeclaration,
	ElseifStatement,
	ReturnStatement,
	BreakStatement,
	ContinueStatement,
	ForStatement,
	WhileStatement,
	AssignmentStatement,
	InterfaceDeclaration,

	Argument,
	Parameter,
	GenericParameter,
	UnionType,
	IntersectionType,
	ImportSourceStatement,
	ImportStdlibStatement,
	FunctionType,
	Block,
	TypeReference,
	Property,
}
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
	| InterfaceDeclaration
	| Import;

export type HierarchyType = {
	extends: Type[];
	implements: Type[];
};
export type Type = UnionType | IntersectionType | StringLiteral | BooleanLiteral | NumberLiteral | FunctionType | ArrayLiteralExpression | TypeReference | ObjectExpression;
export type DeclarationUnion = VariableDeclaration | InterfaceDeclaration | ClassDeclaration | FunctionDeclaration | UserDefinedTypeDeclaration | TypeAliasDeclaration;
export const declarationsTypes = [
	NodeKind.VariableDeclaration,
	NodeKind.InterfaceDeclaration,
	NodeKind.ClassDeclaration,
	NodeKind.FunctionDeclaration,
	NodeKind.UserDefinedTypeDeclaration,
	NodeKind.TypeAliasDeclaration,
];

export type BlockStatement = WhileStatement | ForStatement | FunctionDeclaration | IfStatement | ElseifStatement;
export type variableScope = "local" | "global";
export type BinaryOperator = "+" | "-" | "*" | "/" | "**" | "<" | ">" | "<=" | ">=" | "==" | "!=" | "||" | "&&" | "%";
export type PrefixUnaryOperator = "!" | "-" | "++" | "--";
export type PostfixUnaryOperator = "++" | "--";
export type AssignmentOperator = "=" | "+=" | "-=" | "*=" | "/=";
export type ASTType = [Program];
export type typeOperator = "|" | "&";
export class ParserError extends Error {}
export type NodeUnion = DeclarationUnion | Import | Expression | Statement;
export interface Node {
	readonly type: NodeKind;
	// dont use Node.text when reconstructing source
	// because its only for like
	//i can feel like i did more work
	// also Node.text isnt really accurate
	// so just do source.slice(Node.position.start, Node.position.end + 1)
	text: string;
	position: Span;
}
export interface Program extends Omit<Node, "position"> {
	readonly type: NodeKind.Program;
	name: string;
	body: NodeUnion[];
}

export interface Declaration extends Node {
	readonly type: NodeKind;
	generalModifiers: generalModifier[];
}

export interface VariableDeclaration extends Declaration {
	readonly type: NodeKind.VariableDeclaration;
	generalModifiers: generalModifier[];
	constant: boolean;
	scope: variableScope;
	variableType: Type;
	initializer: Expression;
	name: string;
}
export interface FunctionDeclaration extends Declaration {
	readonly type: NodeKind.FunctionDeclaration;
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
	readonly type: NodeKind.UserDefinedTypeDeclaration;
	generalModifiers: generalModifier[];

	genericTypeParameters: GenericParameter[];
	identifier: string;
	properties: Property[];
}
export interface TypeAliasDeclaration extends Declaration {
	readonly type: NodeKind.TypeAliasDeclaration;
	generalModifiers: generalModifier[];
	alias: string;
	value: Type;
	parameters: GenericParameter[];
}
export interface UnionType extends Node {
	readonly type: NodeKind.UnionType;
	typeA: Type;
	typeB: Type;
}
export interface IntersectionType extends Node {
	readonly type: NodeKind.IntersectionType;
	typeA: Type;
	typeB: Type;
}
export interface NumberLiteral extends Node {
	readonly type: NodeKind.NumberLiteral;
	value: number;
}
export interface StringLiteral extends Node {
	readonly type: NodeKind.StringLiteral;
	value: string;
}
export interface BooleanLiteral extends Node {
	readonly type: NodeKind.BooleanLiteral;
	value: boolean;
}
export interface Identifier extends Node {
	readonly type: NodeKind.Identifier;
	value: string;
}
export interface BinaryExpression extends Node {
	readonly type: NodeKind.BinaryExpression;
	left: Expression;
	operator: BinaryOperator;
	right: Expression;
}
export interface PrefixUnaryExpression extends Node {
	readonly type: NodeKind.PrefixUnaryExpression;
	operator: PrefixUnaryOperator;
	value: Expression;
}
export interface PostfixUnaryExpression extends Node {
	readonly type: NodeKind.PostfixUnaryExpression;
	operator: PostfixUnaryOperator;
	value: Expression;
}
export interface Block extends Node {
	readonly type: NodeKind.Block;
	body: Node[];
}
export interface IfStatement extends Node {
	readonly type: NodeKind.IfStatement;
	body: Block;
	condition: Expression;
	elseIfs: ElseifStatement[];
	else?: Block | null;
}
export interface ElseifStatement extends Node {
	readonly type: NodeKind.ElseifStatement;
	body: Block;
	condition: Expression;
}
export interface Parameter extends Node {
	readonly type: NodeKind.Parameter;
	name: Identifier;
	parameterType: Type;
}
export interface Argument extends Node {
	readonly type: NodeKind.Argument;
	value: Expression;
}

export interface ReturnStatement extends Node {
	readonly type: NodeKind.ReturnStatement;
	expression: Expression;
}
export interface ContinueStatement extends Node {
	readonly type: NodeKind.ContinueStatement;
}
export interface BreakStatement extends Node {
	readonly type: NodeKind.BreakStatement;
}
export type Import = ImportSourceStatement | ImportStdlibStatement;

export interface ImportSourceStatement extends Node {
	readonly type: NodeKind.ImportSourceStatement;
	source: string;
	imports: Identifier[];
}
export interface ImportStdlibStatement extends Node {
	readonly type: NodeKind.ImportStdlibStatement;
	stdlib: string;
	imports: Identifier[];
}

export interface MemberAccessExpression extends Node {
	readonly type: NodeKind.MemberAccessExpression;
	object: Expression;
	member: Identifier;
}
export interface FunctionCallExpression extends Node {
	readonly type: NodeKind.FunctionCallExpression;
	callee: Expression;
	arguments: Argument[];
}
export interface IndexExpression extends Node {
	readonly type: NodeKind.IndexExpression;
	object: Expression;
	index: Expression;
}
export interface ArrayLiteralExpression extends Node {
	readonly type: NodeKind.ArrayLiteralExpression;
	elements: Expression[];
}
export interface WhileStatement extends Node {
	readonly type: NodeKind.WhileStatement;
	condition: Expression;
	body: Block;
}
export interface AssignmentStatement extends Node {
	readonly type: NodeKind.AssignmentStatement;
	value: Expression;
	target: Expression;
	operator: AssignmentOperator;
}
export interface ForStatement extends Node {
	readonly type: NodeKind.ForStatement;
	initializer: VariableDeclaration;
	condition: Expression;
	update: AssignmentStatement;
	body: Block;
}
export interface TypeReference extends Node {
	readonly type: NodeKind.TypeReference;
	identifier: Identifier;
	genericTypes: Type[];
	optional: boolean;
}
export interface GenericParameter extends Node {
	readonly type: NodeKind.GenericParameter;
	identifier: string;
	value: Type;
}
export interface Property extends Node {
	readonly type: NodeKind.Property;
	accessModifier: AccessModifier | undefined;
	modifiers: Modifier[];
	identifier: string;
	propertyType: Type;
}

export interface AssertionExpression extends Node {
	readonly type: NodeKind.AssertionExpression;
	value: Expression;
	target: Type;
}
export interface ClassDeclaration extends Declaration {
	readonly type: NodeKind.ClassDeclaration;
	generalModifiers: generalModifier[];
	hierarchy: HierarchyType;
	genericTypeParameters: GenericParameter[];
	identifier: string;
	properties: Property[];
	methods: FunctionDeclaration[];
}
export interface InterfaceDeclaration extends Declaration {
	readonly type: NodeKind.InterfaceDeclaration;
	generalModifiers: generalModifier[];
	hierarchy: HierarchyType;
	genericTypeParameters: GenericParameter[];
	identifier: string;
	properties: Property[];
}

export interface FunctionType extends Node {
	readonly type: NodeKind.FunctionType;
	parameters: Parameter[];
	genericParameters: GenericParameter[];
	returnType: Type;
}
export interface ObjectExpression extends Node {
	readonly type: NodeKind.ObjectExpression;
	properties: Property[];
}
export interface ConstructorExpression extends Node {
	readonly type: NodeKind.ConstructorExpression;
	arguments: Argument[];
	class: Expression;
}
