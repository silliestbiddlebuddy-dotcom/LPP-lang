import { LPPModuleError } from "./LPPModuleError.ts";

export class LPPAmbiguousModuleError extends LPPModuleError {
	name: string = "AmbiguousModule";
}
