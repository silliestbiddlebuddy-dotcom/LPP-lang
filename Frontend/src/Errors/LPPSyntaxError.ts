import { LPPError } from "./LPPError.ts";

export class LPPSyntaxError extends LPPError {
	name: string = "SyntaxError";
}
