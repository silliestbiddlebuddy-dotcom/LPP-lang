import * as fs from "fs/promises";
import path from "node:path";
import { Token, TokenTypeArray, reservedK, symbols, type TokenType } from "./Lexer.types.ts";
export async function readFile(filePath: string): Promise<string> {
	let body;
	try {
		body = await fs.readFile(path.resolve(filePath), { encoding: "utf-8" });
	} catch (error) {
		throw error;
	}
	return body;
}

export class Lexer {
	private source: string;
	private tokens: Token[];
	private pointer: number;
	private bucket: string;
	constructor(source: string) {
		this.source = source;
		this.tokens = [];
		this.pointer = 0;
		this.bucket = "";
	}
	public readSource() {
		let currentChar;
		for (this.pointer = 0; this.pointer < this.source.length; this.pointer++) {
			currentChar = this.source.charAt(this.pointer);
			if (currentChar === "." && this.bucket !== "" && /^\d+$/.test(this.bucket) && /\d/.test(this.lookAhead())) {
				this.bucket += currentChar;
				continue;
			}
			if (currentChar === "\n" || currentChar === " " || currentChar === "\t" || currentChar === "\r" || currentChar === "") {
				if (this.bucket === "") continue;
				this.tokens.push(this.convertToToken(this.bucket));
				this.flushBucket();
				continue;
			}
			if (currentChar === "/" && this.lookAhead() === "/") {
				this.pointer++;
				this.pointer++;

				while (this.pointer < this.source.length && this.source.charAt(this.pointer) !== "\n") {
					this.pointer++;
				}
				continue;
			}
			if (['"', "'"].includes(currentChar)) {
				if (this.bucket !== "") {
					this.tokens.push(this.convertToToken(this.bucket));
					this.flushBucket();
				}

				const openingChar = currentChar;
				let value = "";

				while (true) {
					this.pointer++;

					if (this.pointer >= this.source.length) {
						throw new Error("unterminated string");
					}

					currentChar = this.source.charAt(this.pointer);

					if (currentChar === openingChar) {
						break;
					}

					value += currentChar;
				}

				this.tokens.push(new Token("String", value, openingChar + value + openingChar));
				continue;
			}
			if (symbols.includes(currentChar)) {
				if (this.bucket !== "") {
					this.tokens.push(this.convertToToken(this.bucket));
					this.flushBucket();
				}
				if (symbols.includes(currentChar + this.lookAhead())) {
					this.tokens.push(new Token("Symbol", currentChar + this.lookAhead(), currentChar + this.lookAhead()));
					this.pointer++;

					this.flushBucket();
					continue;
				}
				this.tokens.push(new Token("Symbol", currentChar, currentChar));

				continue;
			}

			this.bucket += currentChar;
		}
		if (this.bucket !== "") {
			this.tokens.push(this.convertToToken(this.bucket));
			this.flushBucket();
		}
		this.tokens.push(new Token("EOF", "", ""));
		return this.tokens;
	}
	private convertToToken(text: string) {
		if (/^\d+(\.\d+)?$/.test(text)) {
			return new Token("Number", text, Number(text));
		}
		if (!isNaN(Number(text))) {
			return new Token("Number", text, Number(text));
		} else if (reservedK.includes(text)) {
			const Uppercase = String(text).charAt(0).toUpperCase() + String(text).slice(1);

			if (TokenTypeArray.includes(("Reserved" + Uppercase) as TokenType)) {
				return new Token(("Reserved" + Uppercase) as TokenType, text, text);
			} else {
				throw new Error("Keyword " + text + " found inside reserved keywords array but not found token type");
			}
		} else if (symbols.includes(text)) {
			return new Token("Symbol", text, text);
		} else return new Token("Identifier", text, text);
	}
	private flushBucket() {
		this.bucket = "";
	}
	private peek() {
		return this.source.charAt(this.pointer);
	}
	private consume() {
		const char = this.source.charAt(this.pointer);
		this.pointer++;
		return char;
	}
	private lookAhead() {
		return this.source.charAt(this.pointer + 1);
	}
}
