import type { BuiltinDeclarationSymbol } from "./Frontend/Semantic/Binder/Symbol.ts";

export type llvmSymbolTableType = {
	[key: string]: {
		llvm: string;
		symbol: BuiltinDeclarationSymbol;
	};
};
export const llvmSymbolTable: llvmSymbolTableType = {
	println: {
		llvm: "declare void @println(ptr)",
		symbol: {
			kind: "BuiltinDeclaration",
			name: "println",
			parameters: [{ name: "text", type: { kind: "string" } }],
			returnType: { kind: "void" },
			functionType: {
				kind: "function",
				returnType: { kind: "void" },
				parameters: [
					{
						name: "text",
						kind: "parameter",
						type: { kind: "string" },
					},
				],
				typeParameters: [],
			},
		},
	},
};
