import { Diagnostic, DiagnosticSeverity } from "./Diagnostic.ts";

export class DiagnosticReporter {
	private diagnostics: Diagnostic[] = [];
	public currentCode = 0;
	public report(diagnostic: Diagnostic): void {
		this.diagnostics.push(diagnostic);
		this.currentCode++;
	}
	public hasErrors(): boolean {
		return this.diagnostics.some((diagnostic: Diagnostic) => diagnostic.severity === DiagnosticSeverity.Error);
	}
	public getDiagnostics(): Diagnostic[] {
		return this.diagnostics;
	}
}
