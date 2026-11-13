import { isConstKeyword } from "typescript/unstable/ast";
import { declarationsTypes, NodeKind, type DeclarationUnion, type Identifier, type Import, type Node, type NodeUnion } from "./Parser.types.ts";
import type { Token } from "../Lexer/Lexer.types.ts";
import { findNodeAtOffset } from "jsonc-parser";
/*export function isIdentifier(node: Node): node is Identifier {
	if (node.type === "Identifier") return true;
	return false;
}*/
export function isBinaryOperator(token: Token): boolean {
	if (token.type !== "Symbol") return false;

	return ["+", "-", "*", "/", "**", "==", "!=", "<", ">", "<=", ">=", "&&", "||", "%"].includes(token.value);
}
export function isTypeOperator(token: Token): boolean {
	if (token.type !== "Symbol") return false;

	return ["|", "&"].includes(token.value);
}
export function isBoolean(token: Token): boolean {
	return token.type === "ReservedTrue" || token.type === "ReservedFalse";
}
export function isPostfixUnaryOperator(token: Token): boolean {
	if (token.type !== "Symbol") return false;

	return ["++", "--"].includes(token.value);
}
export function isPrefixUnaryOperator(token: Token): boolean {
	if (token.type !== "Symbol") return false;

	return ["++", "--", "!", "-"].includes(token.value);
}
export function isIfKeyword(token: Token): boolean {
	return token.type === "ReservedIf";
}
export function isReturnKeyword(token: Token): boolean {
	return token.type === "ReservedReturn";
}
export function isFunctionKeyword(token: Token): boolean {
	return token.type === "ReservedFunction";
}
export function isWhileKeyword(token: Token): boolean {
	return token.type === "ReservedWhile";
}
export function isForKeyword(token: Token): boolean {
	return token.type === "ReservedFor";
}
export function isContinueKeyword(token: Token): boolean {
	return token.type === "ReservedContinue";
}
export function isBreakKeyword(token: Token): boolean {
	return token.type === "ReservedBreak";
}
export function isTypeKeyword(token: Token): boolean {
	return token.type === "ReservedType";
}
export function isClassKeyword(token: Token): boolean {
	return token.type === "ReservedClass";
}
export function isAccessModifier(token: Token): boolean {
	return ["public", "private", "protected"].includes(token.value);
}
export function isModifier(token: Token): boolean {
	return ["static", "virtual", "override", "abstract", "final", "async", "unsafe", "readonly"].includes(token.value);
}
export function isGeneralModifier(token: Token): boolean {
	return ["export", "declare"].includes(token.value);
}

export function isIdentifier(token: Token): boolean {
	return token.type === "Identifier";
}
export function isAssignmentOperator(operator: string): boolean {
	return ["=", "+=", "-=", "*=", "/="].includes(operator);
}
export function isExtendsOrImplementsToken(token: Token): boolean {
	return token.type === "ReservedExtends" || token.type === "ReservedImplements";
}
export function isImport(node: NodeUnion): node is Import {
	return node.type === NodeKind.ImportSourceStatement || node.type === NodeKind.ImportStdlibStatement;
}
export function isDeclaration(node: NodeUnion): node is DeclarationUnion {
	return declarationsTypes.includes(node.type);
}
export function isExportedDeclaration(node: NodeUnion): node is DeclarationUnion {
	if (!isDeclaration(node)) return false;
	return node.generalModifiers.includes("export");
}
export function isToken(object: Token | Node): object is Token {
	return Object.hasOwn(object, "value");
}
