import type { Expression, Node } from "../../Parser/Parser.types.ts";
import type { TypeEnvironment } from "../Environment/TypeEnvironment.ts";
export interface CFG {
	readonly kind: "CFG";
	exitBlock: CFGExitBlock;
	entryBlock: CFGEntryBlock;
	nodes: CFGBlock[];
	edges: CFGEdge[];
}

export type CFGBlock = CFGEntryBlock | CFGExitBlock | CFGBasicBlock | CFGBranchCondition;
export type CFGEdgeType = "sequential" | "conditionalTrue" | "conditionalFalse";

export interface CFGEntryBlock {
	readonly kind: "EntryBlock";
	id: string;

	label: "entryBlock";
	statements: Node[];
	successors: CFGBlock[];
	predecessors: CFGBlock[];
}
export interface CFGExitBlock {
	readonly kind: "ExitBlock";
	id: string;

	label: "exitBlock";
	statements: Node[];
	successors: CFGBlock[];
	predecessors: CFGBlock[];
}

export interface CFGBasicBlock {
	readonly kind: "BasicBlock";
	id: string;
	label: string;
	statements: Node[];
	predecessors: CFGBlock[];
	successors: CFGBlock[];
}
export interface CFGBranchCondition {
	readonly kind: "BranchCondition";
	id: string;

	label: "branchCondition";
	condition: Expression;
	successors: CFGBlock[];
	predecessors: CFGBlock[];
}
export interface CFGEdge {
	readonly kind: "Edge";
	from: CFGBlock;
	to: CFGBlock;
	type: CFGEdgeType;
}
export function createCFGEdge(from: CFGBlock, to: CFGBlock, type: CFGEdgeType): CFGEdge {
	return {
		kind: "Edge",
		from: from,
		to: to,
		type: type,
	};
}