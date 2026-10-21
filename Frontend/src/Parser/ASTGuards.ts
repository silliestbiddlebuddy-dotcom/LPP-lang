import { isConstKeyword } from "typescript/unstable/ast";
import { type Identifier, type Node } from "./Parser.types.ts";
import type { Token } from "../Lexer/Lexer.types.ts";
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
