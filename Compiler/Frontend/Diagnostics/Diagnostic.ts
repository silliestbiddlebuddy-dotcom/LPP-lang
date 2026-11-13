import type { Span } from "../Lexer/Lexer.types.ts";

export const enum DiagnosticSeverity {
	Error,
	Warning,
	Info,
}
export class Diagnostic {
	public severity: DiagnosticSeverity;
	public code: string;
	public message: string;
	public name: string;
	public position: Span;
	constructor(severity: DiagnosticSeverity, name: string, message: string, position: Span, currentCode: number) {
		this.severity = severity;
		this.name = name;
		this.message = message;
		this.position = position;
		this.code = "LPP" + currentCode + 1;
	}
}
