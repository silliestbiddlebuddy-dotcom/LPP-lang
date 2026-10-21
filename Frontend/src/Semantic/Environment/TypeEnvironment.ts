import type { TypeSymbol } from "../Binder/Symbol.ts";

export class TypeEnvironment {
	public readonly data: Map<string, TypeSymbol>;
	private parent?: TypeEnvironment | undefined;
	constructor(information: { builtin?: { [typeName: string]: TypeSymbol }; parent?: TypeEnvironment }) {
		this.data = new Map<string, TypeSymbol>();
		if (information.builtin) {
			for (const [key, value] of Object.entries(information.builtin)) {
				this.declareType(key, value);
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
}
