import { LPPError } from "./LPPError.ts";

export class LPPTypeError extends LPPError {
	name: string = "TypeError";
}
