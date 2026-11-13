import path from "node:path";
import type { Module } from "./Module.ts";
import { validExtensions, type ValidName } from "./ModuleTypes.ts";
import type { ModuleResolver } from "./ModuleResolver.ts";

export interface ModuleNode {
	readonly module: Module;
	readonly name: string;
	readonly path: string;
	dependencies: Set<string>
}

export class ModuleGraph {
	private readonly graph: Map<string, ModuleNode> = new Map<string, ModuleNode>();

	public addModule(module: Module, dependencies: Set<string>) {
		if (this.graph.has(module.filePath)) return;
		this.graph.set(module.filePath, {
			module: module,
			name: module.filePath,
			path: module.filePath,
			dependencies: dependencies,
		});
	}
	private getGraph(): Map<string, ModuleNode> {
		return this.graph;
	}
	public addDependency(from: string, dependency: string): void {
		if (!this.graph.has(from)) return;
		this.graph.get(from)!.dependencies.add(dependency);
	}
}