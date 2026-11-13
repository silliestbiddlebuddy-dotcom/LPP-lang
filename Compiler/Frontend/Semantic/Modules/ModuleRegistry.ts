import type { Module } from "./Module.ts";

export class ModuleRegistry {
	private modules: Map<string, Module> = new Map<string, Module>();
	public registerModule(module: Module): Module {
		if (this.modules.has(module.filePath)) return this.modules.get(module.filePath)!;
		this.modules.set(module.filePath, module);
		return module;
	}
	public retrieveModule(path: string): Module | undefined {
		return this.modules.get(path);
	}
	public hasModule(path: string): boolean {
		return this.modules.has(path);
	}
	public getModules(): IterableIterator<Module> {
		return this.modules.values();
	}
}
