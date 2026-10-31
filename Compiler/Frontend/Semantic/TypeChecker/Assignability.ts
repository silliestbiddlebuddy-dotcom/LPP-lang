import type { Literal, Primitives, Type } from "../Environment/Builtins.ts";
export function isLiteral(type: Type): boolean {
	return ["stringLiteral", "booleanLiteral", "numberLiteral"].includes(type.kind);
}

export function isPrimitive(type: Type): boolean {
	return [
		"string",
		"boolean",
		"undefined",
		"float",
		"double",
		"int",
		"char",
		"uint8",
		"uint16",
		"uint32",
		"uint64",
		"int8",
		"int16",
		"int32",
		"int64",
		"float8",
		"float16",
		"float32",
		"float64",
		"never",
		"unknown",
		"any",
		"null",
	].includes(type.kind);
}
export function isNumber(type: Type): boolean {
	return ["float", "double", "int", "char", "uint8", "uint16", "uint32", "uint64", "int8", "int16", "int32", "int64", "float8", "float16", "float32", "float64"].includes(
		type.kind
	);
}
