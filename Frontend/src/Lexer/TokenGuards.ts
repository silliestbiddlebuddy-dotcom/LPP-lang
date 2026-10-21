import type { Token } from "./Lexer.types.ts";

export function isConstKeyword(token: Token): boolean {
	return token.type === "ReservedConst";
}
export function isLocalKeyword(token: Token): boolean {
	return token.type === "ReservedLocal";
}
export function isGlobalKeyword(token: Token): boolean {
	return token.type === "ReservedGlobal";
}
export function isClassKeyword(token: Token): boolean {
	return token.type === "ReservedClass";
}
export function isInterfaceKeyword(token: Token): boolean {
	return token.type === "ReservedInterface";
}
export function isEnumKeyword(token: Token): boolean {
	return token.type === "ReservedEnum";
}
export function isExtendsKeyword(token: Token): boolean {
	return token.type === "ReservedExtends";
}
export function isImplementsKeyword(token: Token): boolean {
	return token.type === "ReservedImplements";
}
export function isSymbol(token: Token): boolean {
	return token.type === "Symbol";
}
export function isNumber(token: Token): boolean {
	return token.type === "Number";
}
