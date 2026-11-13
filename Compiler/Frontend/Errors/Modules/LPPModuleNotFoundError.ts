import { LPPModuleError } from "./LPPModuleError.ts";

export class LPPModuleNotFoundError extends LPPModuleError {
	name: string = "ModuleNotFound";
}
