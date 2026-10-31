import type { RuntimeSymbol, Symbol } from "./Symbol.ts";

export class ScopeTable {
	public readonly data: Map<string, RuntimeSymbol>;
	private parent?: ScopeTable | undefined;
	constructor(information: { builtin?: Map<string, RuntimeSymbol>; parent?: ScopeTable }) {
		this.data = information.builtin || new Map<string, RuntimeSymbol>();
		this.parent = information.parent;
	}
	public lookup(key: string): RuntimeSymbol | null {
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
	public declareSymbol(key: string, value: RuntimeSymbol): boolean {
		if (this.data.has(key)) {
			return false;
		} else {
			this.data.set(key, value);
			return true;
		}
	}
}
