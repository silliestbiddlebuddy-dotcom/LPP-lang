import type {
	ClassDeclaration,
	Declaration,
	FunctionDeclaration,
	GenericParameter,
	InterfaceDeclaration,
	Parameter,
	Property,
	TypeAliasDeclaration,
	UserDefinedTypeDeclaration,
	VariableDeclaration,
} from "../../Parser/Parser.types.ts";

export interface VariableSymbol {
	readonly kind: "Variable";
	name: string;
	declaration: VariableDeclaration;
	constant: boolean;
}
export interface ParameterSymbol {
	readonly kind: "Parameter";
	name: string;
	declaration: Parameter;
}
export interface PropertySymbol {
	readonly kind: "Property";
	name: string;
	declaration: Property;
}
export interface FunctionSymbol {
	readonly kind: "Function";
	name: string;
	declaration: FunctionDeclaration;
}
export interface MethodSymbol {
	readonly kind: "Method";
	name: string;
	declaration: FunctionDeclaration;
}
export interface ClassSymbol {
	readonly kind: "Class";
	name: string;
	declaration: ClassDeclaration;
}
export interface UserDefinedTypeSymbol {
	readonly kind: "UserDefinedType";
	name: string;
	declaration: UserDefinedTypeDeclaration;
}
export interface TypeAliasSymbol {
	readonly kind: "TypeAlias";
	name: string;
	declaration: TypeAliasDeclaration;
}
export interface InterfaceSymbol {
	readonly kind: "Interface";
	name: string;
	declaration: InterfaceDeclaration;
}
export interface GenericParameterSymbol {
	readonly kind: "GenericParameter";
	name: string;
	declaration: GenericParameter;
}

export type RuntimeSymbol = VariableSymbol | ParameterSymbol | FunctionSymbol | ClassSymbol | PropertySymbol | MethodSymbol;
export type TypeSymbol = InterfaceSymbol | TypeAliasSymbol | UserDefinedTypeSymbol | ClassSymbol | GenericParameterSymbol;
export type Symbol =
	| InterfaceSymbol
	| TypeAliasSymbol
	| UserDefinedTypeSymbol
	| ClassSymbol
	| VariableSymbol
	| ParameterSymbol
	| FunctionSymbol
	| PropertySymbol
	| MethodSymbol
	| GenericParameterSymbol;
