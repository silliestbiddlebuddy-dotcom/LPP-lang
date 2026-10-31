import type { AssignmentOperator, BinaryOperator, PostfixUnaryOperator, PrefixUnaryOperator } from "../../Frontend/Parser/Parser.types.ts";
import type { Type } from "../../Frontend/Semantic/Environment/Builtins.ts";
export function typeToLLVM(type: Type): string {
	switch (type.kind) {
		case "float":
		case "float32":
			return "float";

		case "double":
		case "float64":
			return "double";

		case "float16":
			return "half";

		case "int":
		case "int32":
			return "i32";

		case "int8":
		case "uint8":
		case "char":
			return "i8";

		case "int16":
		case "uint16":
			return "i16";

		case "int64":
		case "uint64":
			return "i64";

		case "uint32":
			return "i32";

		case "boolean":
		case "booleanLiteral":
			return "i1";

		case "string":
		case "stringLiteral":
		case "null":
		case "undefined":
		case "any":
		case "unknown":
		case "array":
		case "function":
		case "class":
		case "object":
		case "interface":
		case "userDefinedType":
			return "ptr";

		case "numberLiteral":
			return "i32";

		case "never":
		case "emptiness":
			return "void";

		case "union":
		case "intersection":
		case "typeParameter":
		case "typeAlias":
			throw new Error(`Type "${type.kind}" must be resolved before LLVM lowering.`);

		case "void":
			return "void";
		default: {
			const exhaustive = type;
			throw new Error(`Unsupported type: ${JSON.stringify(exhaustive)}`);
		}
	}
}
export type Operator = BinaryOperator | PrefixUnaryOperator | PostfixUnaryOperator | AssignmentOperator;

export function operatorToLLVM(operator: Operator, operandType?: Type): string {
	const isFloat =
		operandType?.kind === "float" || operandType?.kind === "double" || operandType?.kind === "float16" || operandType?.kind === "float32" || operandType?.kind === "float64";

	const isUnsigned = operandType?.kind === "uint8" || operandType?.kind === "uint16" || operandType?.kind === "uint32" || operandType?.kind === "uint64";

	switch (operator) {
		case "+":
		case "+=":
			return isFloat ? "fadd" : "add";

		case "-":
		case "-=":
		case "--":
			return isFloat ? "fsub" : "sub";

		case "*":
		case "*=":
			return isFloat ? "fmul" : "mul";

		case "/":
		case "/=":
			return isFloat ? "fdiv" : isUnsigned ? "udiv" : "sdiv";

		case "%":
			return isFloat ? "frem" : isUnsigned ? "urem" : "srem";

		case "**":
			throw new Error("Exponentiation requires a runtime/library lowering.");

		case "==":
			return isFloat ? "fcmp oeq" : "icmp eq";

		case "!=":
			return isFloat ? "fcmp une" : "icmp ne";

		case "<":
			return isFloat ? "fcmp olt" : isUnsigned ? "icmp ult" : "icmp slt";

		case ">":
			return isFloat ? "fcmp ogt" : isUnsigned ? "icmp ugt" : "icmp sgt";

		case "<=":
			return isFloat ? "fcmp ole" : isUnsigned ? "icmp ule" : "icmp sle";

		case ">=":
			return isFloat ? "fcmp oge" : isUnsigned ? "icmp uge" : "icmp sge";

		case "&&":
			return "and";

		case "||":
			return "or";

		case "!":
			return "xor i1";

		case "++":
			return isFloat ? "fadd" : "add";

		case "=":
			return "store";

		default: {
			const exhaustive: never = operator;
			throw new Error(`Unsupported operator: ${exhaustive}`);
		}
	}
}
