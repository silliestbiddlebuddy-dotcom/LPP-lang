import type { TypeSymbol } from "../Binder/Symbol.ts";
import type { Type } from "./Builtins.ts";

export class TypeEnvironment {
	public readonly data: Map<string, TypeSymbol>;
	private parent?: TypeEnvironment | undefined;
	constructor(information: { builtin?: Record<string, Type>; parent?: TypeEnvironment }) {
		this.data = new Map<string, TypeSymbol>();
		if (information.builtin) {
			for (const [key, value] of Object.entries(information.builtin)) {
				this.declareBuiltin(key, value);
			}
		}
		this.parent = information.parent;
	}
	public lookup(key: string): TypeSymbol | null {
		if (this.data.has(key)) {
			return this.data.get(key)!;
		} else if (this.parent) {
			return this.parent.lookup(key);
		} else {
			return null;
		}
	}
	public has(key: string): boolean {
		return this.data.has(key);
	}
	public declareType(key: string, value: TypeSymbol): boolean {
		if (this.data.has(key)) {
			return false;
		} else {
			this.data.set(key, value);
			return true;
		}
	}
	public declareBuiltin(key: string, value: Type): boolean {
		if (this.data.has(key)) return false;

		this.data.set(key, {
			kind: "BuiltinType",
			name: key,
			type: value,
		});

		return true;
	}
}
