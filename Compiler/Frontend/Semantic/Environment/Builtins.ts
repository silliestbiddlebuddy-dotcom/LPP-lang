import type { AccessModifier, Modifier } from "../../Lexer/Lexer.types.ts";
import type {
	BinaryOperator,
	ClassDeclaration,
	GenericParameter,
	Type as TypeNode,
	Parameter as ParameterNode,
	Expression,
	DeclarationUnion,
	PrefixUnaryOperator,
} from "../../Parser/Parser.types.ts";
import type { ClassSymbol } from "../Binder/Symbol.ts";
export const LLVMPrimitiveTypes = {
	float: {
		llvmType: "float",
		category: "floating",
		bits: 32,
	},
	double: {
		llvmType: "double",
		category: "floating",
		bits: 64,
	},
	int: {
		llvmType: "i32",
		category: "integer",
		bits: 32,
		signed: true,
	},

	int8: {
		llvmType: "i8",
		category: "integer",
		bits: 8,
		signed: true,
	},
	int16: {
		llvmType: "i16",
		category: "integer",
		bits: 16,
		signed: true,
	},
	int32: {
		llvmType: "i32",
		category: "integer",
		bits: 32,
		signed: true,
	},
	int64: {
		llvmType: "i64",
		category: "integer",
		bits: 64,
		signed: true,
	},

	uint8: {
		llvmType: "i8",
		category: "integer",
		bits: 8,
		signed: false,
	},
	uint16: {
		llvmType: "i16",
		category: "integer",
		bits: 16,
		signed: false,
	},
	uint32: {
		llvmType: "i32",
		category: "integer",
		bits: 32,
		signed: false,
	},
	uint64: {
		llvmType: "i64",
		category: "integer",
		bits: 64,
		signed: false,
	},

	float8: {
		llvmType: "i8",
		category: "unsupported-floating",
		bits: 8,
	},
	float16: {
		llvmType: "half",
		category: "floating",
		bits: 16,
	},
	float32: {
		llvmType: "float",
		category: "floating",
		bits: 32,
	},
	float64: {
		llvmType: "double",
		category: "floating",
		bits: 64,
	},

	boolean: {
		llvmType: "i1",
		category: "boolean",
		bits: 1,
	},
	char: {
		llvmType: "i32",
		category: "character",
		bits: 32,
	},
	string: {
		llvmType: "ptr",
		category: "reference",
	},

	null: {
		llvmType: "ptr",
		category: "reference",
	},
	undefined: {
		llvmType: "ptr",
		category: "reference",
	},

	any: {
		llvmType: "ptr",
		category: "dynamic",
	},
	unknown: {
		llvmType: "ptr",
		category: "dynamic",
	},
	never: {
		llvmType: "void",
		category: "bottom",
	},
	emptiness: {
		llvmType: "void",
		category: "void",
	},
} as const;
export const BuiltinTypes: Record<string, Type> = {
	float: { kind: "float" },
	double: { kind: "double" },
	int: { kind: "int" },

	int8: { kind: "int8" },
	int16: { kind: "int16" },
	int32: { kind: "int32" },
	int64: { kind: "int64" },

	uint8: { kind: "uint8" },
	uint16: { kind: "uint16" },
	uint32: { kind: "uint32" },
	uint64: { kind: "uint64" },

	float8: { kind: "float8" },
	float16: { kind: "float16" },
	float32: { kind: "float32" },
	float64: { kind: "float64" },

	string: { kind: "string" },
	boolean: { kind: "boolean" },
	char: { kind: "char" },

	any: { kind: "any" },
	unknown: { kind: "unknown" },
	never: { kind: "never" },
	null: { kind: "null" },
	undefined: { kind: "undefined" },
	emptiness: { kind: "emptiness" },
};
export type Type = Primitives | Derived | Literal | UserDefinedTypes | Void;
export type Primitives =
	| Float
	| Double
	| Int
	| String
	| Boolean
	| Character
	| uint8
	| uint16
	| uint32
	| uint64
	| int8
	| int16
	| int32
	| int64
	| float8
	| float16
	| float32
	| float64
	| Any
	| Unknown
	| Never
	| Null
	| Emptiness
	| Undefined;
export type ObjectLike = Object | Class | Interface | UserDefinedType;
export type Number = Float | Double | Int | Character | uint8 | uint16 | uint32 | uint64 | int8 | int16 | int32 | int64 | float8 | float16 | float32 | float64;
export type Derived = Array<Type> | Function;
export type Literal = StringLiteral | BooleanLiteral | NumberLiteral;
export type UserDefinedTypes = Union | Intersection | Class | Object | Interface | TypeParameter | UserDefinedType | TypeAlias;
export type OperatorRule = {
	returnType: Type | "same";
	requiresIdenticalTypes: boolean;
	allowedTypes: Type[];
};

export const numericTypes: Type[] = [
	{ kind: "uint8" },
	{ kind: "uint16" },
	{ kind: "uint32" },
	{ kind: "uint64" },

	{ kind: "int8" },
	{ kind: "int16" },
	{ kind: "int32" },
	{ kind: "int64" },

	{ kind: "float8" },
	{ kind: "float16" },
	{ kind: "float32" },
	{ kind: "float64" },

	{ kind: "int" },
];

export const unsignedNumericTypes: Type[] = [{ kind: "uint8" }, { kind: "uint16" }, { kind: "uint32" }, { kind: "uint64" }];
export const signedNumericTypes: Type[] = [{ kind: "int" }, { kind: "int8" }, { kind: "int16" }, { kind: "int32" }, { kind: "int64" }];
export const integerNumericTypes: Type[] = [
	{ kind: "int" },
	{ kind: "int8" },
	{ kind: "int16" },
	{ kind: "int32" },
	{ kind: "int64" },
	{ kind: "uint8" },
	{ kind: "uint16" },
	{ kind: "uint32" },

	{ kind: "uint64" },
];

export const floatingNumericTypes: Type[] = [{ kind: "float" }, { kind: "double" }, { kind: "float8" }, { kind: "float16" }, { kind: "float32" }, { kind: "float64" }];

const identicalNumericRule = (): OperatorRule => ({
	requiresIdenticalTypes: true,
	allowedTypes: numericTypes,
	returnType: "same",
});

const booleanRule = (): OperatorRule => ({
	requiresIdenticalTypes: true,
	allowedTypes: [{ kind: "boolean" }],
	returnType: { kind: "boolean" },
});

const numericComparisonRule = (): OperatorRule => ({
	requiresIdenticalTypes: true,
	allowedTypes: numericTypes,
	returnType: { kind: "boolean" },
});

const stringRule = (): OperatorRule => ({
	requiresIdenticalTypes: true,
	allowedTypes: [{ kind: "string" }],
	returnType: { kind: "string" },
});

export const BinaryOperatorTable: Record<BinaryOperator, OperatorRule[]> = {
	"+": [stringRule(), identicalNumericRule()],

	"-": [identicalNumericRule()],

	"*": [identicalNumericRule()],

	"/": [identicalNumericRule()],

	"%": [identicalNumericRule()],

	"**": [identicalNumericRule()],

	"<": [numericComparisonRule()],

	">": [numericComparisonRule()],

	"<=": [numericComparisonRule()],

	">=": [numericComparisonRule()],

	"==": [
		{
			requiresIdenticalTypes: true,
			allowedTypes: [...numericTypes, { kind: "string" }, { kind: "boolean" }],
			returnType: { kind: "boolean" },
		},
	],

	"!=": [
		{
			requiresIdenticalTypes: true,
			allowedTypes: [...numericTypes, { kind: "string" }, { kind: "boolean" }],
			returnType: { kind: "boolean" },
		},
	],

	"&&": [booleanRule()],

	"||": [booleanRule()],
};
export const PrefixUnaryOperatorTable: Record<PrefixUnaryOperator, OperatorRule[]> = {
	"++": [identicalNumericRule()],
	"!": [booleanRule()],
	"--": [identicalNumericRule()],
	"-": [identicalNumericRule()],
};

// ==============================================
//  Primitives
// ==============================================
// #region Primitives
//Signed 32 bit floating point number
export interface Float {
	readonly kind: "float";
}

//Signed 64 bit floating point number
export interface Double {
	readonly kind: "double";
}

//Signed 32 bit integer
export interface Int {
	readonly kind: "int";
}

//Unsigned integers
export interface uint8 {
	readonly kind: "uint8";
}
export interface uint16 {
	readonly kind: "uint16";
}
export interface uint32 {
	readonly kind: "uint32";
}
export interface uint64 {
	readonly kind: "uint64";
}

//signed integers
export interface int8 {
	readonly kind: "int8";
}
export interface int16 {
	readonly kind: "int16";
}
export interface int32 {
	readonly kind: "int32";
}
export interface int64 {
	readonly kind: "int64";
}

//floating point numbers
export interface float8 {
	readonly kind: "float8";
}
export interface float16 {
	readonly kind: "float16";
}
export interface float32 {
	readonly kind: "float32";
}
export interface float64 {
	readonly kind: "float64";
}

//a single bit
export interface Boolean {
	readonly kind: "boolean";
}

//idk
export interface String {
	readonly kind: "string";
}

//depends on ascii or unicode idfk
export interface Character {
	readonly kind: "char";
}

export interface Null {
	readonly kind: "null";
}

export interface Unknown {
	readonly kind: "unknown";
}

export interface Any {
	readonly kind: "any";
}

export interface Never {
	readonly kind: "never";
}

export interface Emptiness {
	readonly kind: "emptiness";
}

export interface Undefined {
	readonly kind: "undefined";
}

// #endregion

// ==============================================
//  Literals
// ==============================================
// #region Literals

export interface NumberLiteral {
	readonly kind: "numberLiteral";

	value: number;
}
export interface BooleanLiteral {
	readonly kind: "booleanLiteral";
	value: boolean;
}
export interface StringLiteral {
	readonly kind: "stringLiteral";
	value: string;
}

// #endregion
// ==============================================
//  Derived Types
// ==============================================
// #region Derived Types
export interface Array<T extends Type> {
	readonly kind: "array";
	readonly elementType: T;
}
export interface Function {
	readonly kind: "function";
	readonly returnType: Type;
	readonly parameters: Parameter[];
	readonly typeParameters: TypeParameter[];
}

//later
export interface Pointer<T extends Type> {
	readonly kind: "pointer";
	readonly referenceType: T;
}

// #endregion

// ==============================================
//  User Defined Types
// ==============================================
// #region  User Defined Types

export interface Class {
	readonly kind: "class";
	readonly name: string;
	readonly identity: ClassSymbol;
	readonly declaration: ClassDeclaration;
	readonly superClass?: Class | undefined;
	readonly properties: Property[];
	readonly methods: Method[];
	readonly interfaces: Interface[];
	readonly typeParameters: TypeParameter[];
}
export interface Method {
	readonly kind: "method";
	readonly name: string;
	readonly returnType: Type;
	readonly typeParameters: TypeParameter[];
	readonly parameters: Parameter[];
}

export interface TypeAlias {
	readonly kind: "typeAlias";
	readonly name: string;
	readonly type: Type;
}

export interface UserDefinedType {
	readonly kind: "userDefinedType";
	readonly name: string;
	readonly object: Object;
	readonly typeParameters: TypeParameter[];
}

export interface Union {
	readonly kind: "union";
	readonly types: Type[];
}
export interface Intersection {
	readonly kind: "intersection";
	readonly types: Type[];
}
export interface Object {
	readonly kind: "object";
	readonly members: Map<string, Property>;
}
export interface TypeParameter {
	readonly kind: "typeParameter";
	readonly name: string;
	readonly constraint: Type;
}
export interface Property {
	readonly kind: "property";
	readonly name: string;
	readonly type: Type;
	readonly accessModifier?: AccessModifier | undefined;
	readonly modifiers: Modifier[];
}
export interface Parameter {
	readonly kind: "parameter";
	readonly name: string;
	readonly type: Type;
}
export interface Interface {
	readonly kind: "interface";
	readonly object: Object;
	readonly typeParameters: TypeParameter[];
	readonly extends: Interface[];
}
// #endregion

export interface Void {
	readonly kind: "void";
}
