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
import type { Function, Type } from "../Environment/Builtins.ts";
import type { TypeEnvironment } from "../Environment/TypeEnvironment.ts";
import type { ScopeTable } from "./Scope.ts";

export interface BuiltinTypeSymbol {
	readonly kind: "BuiltinType";
	readonly name: string;
	readonly type: Type;
}
export interface BuiltinDeclarationSymbol {
	readonly kind: "BuiltinDeclaration";
	readonly name: string;

	readonly parameters: readonly {
		readonly name: string;
		readonly type: Type;
	}[];
	readonly functionType: Function;
	readonly returnType: Type;
}
export interface VariableSymbol {
	readonly kind: "Variable";
	name: string;
	declaration: VariableDeclaration;
	constant: boolean;
	scope: ScopeTable;
}
export interface ParameterSymbol {
	readonly kind: "Parameter";
	name: string;
	declaration: Parameter;
	scope: ScopeTable;
}
export interface PropertySymbol {
	readonly kind: "Property";
	name: string;
	declaration: Property;
	scope: ScopeTable;
}
export interface FunctionSymbol {
	readonly kind: "Function";
	name: string;
	declaration: FunctionDeclaration;
	scope: ScopeTable;
}
export interface MethodSymbol {
	readonly kind: "Method";
	name: string;
	declaration: FunctionDeclaration;
	scope: ScopeTable;
}
export interface ClassSymbol {
	readonly kind: "Class";
	name: string;
	declaration: ClassDeclaration;
	scope: ScopeTable;
	environment: TypeEnvironment;
}
export interface UserDefinedTypeSymbol {
	readonly kind: "UserDefinedType";
	name: string;
	declaration: UserDefinedTypeDeclaration;
	environment: TypeEnvironment;
}
export interface TypeAliasSymbol {
	readonly kind: "TypeAlias";
	name: string;
	declaration: TypeAliasDeclaration;
	environment: TypeEnvironment;
}
export interface InterfaceSymbol {
	readonly kind: "Interface";
	name: string;
	declaration: InterfaceDeclaration;
	environment: TypeEnvironment;
}

export interface GenericParameterSymbol {
	readonly kind: "GenericParameter";
	name: string;
	declaration: GenericParameter;
	scope: ScopeTable;
}

export type RuntimeSymbol = VariableSymbol | ParameterSymbol | FunctionSymbol | ClassSymbol | PropertySymbol | MethodSymbol | BuiltinDeclarationSymbol;
export type TypeSymbol = InterfaceSymbol | TypeAliasSymbol | UserDefinedTypeSymbol | ClassSymbol | GenericParameterSymbol | BuiltinTypeSymbol;
export type Symbol = RuntimeSymbol | TypeSymbol;
