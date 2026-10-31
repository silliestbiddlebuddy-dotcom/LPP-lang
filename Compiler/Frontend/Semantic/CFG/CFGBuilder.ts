import type { BlockStatement, WhileStatement } from "../../Parser/Parser.types.ts";
import { createCFGEdge, type CFG, type CFGBasicBlock, type CFGBlock, type CFGEdge, type CFGEdgeType } from "./CFGTypes.ts";

export class CFGBuilder {
	public buildCFG(blockStatement: BlockStatement): CFG {
		switch (blockStatement.type) {
			case "WhileStatement":
				return this.buildWhileStatementCFG(blockStatement);
			case "ForStatement":
				return this.buildForStatementCFG(blockStatement);
			case "FunctionDeclaration":
				return this.buildFunctionDeclarationCFG(blockStatement);
			case "IfStatement":
				return this.buildIfStatementCFG(blockStatement);
			case "ElseifStatement":
				return this.buildElseifStatementCFG(blockStatement);
		}
	}
	private buildWhileStatementCFG(whileStatement: WhileStatement): CFG {
		const cfg: CFG = {
			kind: "CFG",
		};
		return cfg;
	}

	private connect(cfg: CFG, from: CFGBasicBlock, to: CFGBasicBlock, type: CFGEdgeType): void {
		const edgeExists = cfg.edges.some((edge) => edge.from === from && edge.to === to && edge.type === type);

		if (edgeExists) return;

		from.successors.push(to);
		to.predecessors.push(from);
		cfg.edges.push(createCFGEdge(from, to, type));
	}
}
