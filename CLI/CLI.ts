#!/usr/bin/env node
import { Command } from "commander";
import { readFile } from "fs/promises";
import path from "node:path";
import { Lexer } from "../Frontend/src/Lexer/Lexer.ts";
import { Parser } from "../Frontend/src/Parser/Parser.ts";
import { Binder } from "../Frontend/src/Semantic/Binder/Binder.ts";
import { unlinkSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const program = new Command();

program.name("lpp").description("The L++ programming language").version("0.1.0");

program
	.argument("<file>", "L++ source file")
	.option("-d, --debug", "enable debug output")
	.option("--ast", "print the AST")
	.option("--tokens", "print lexer tokens")
	.option("--noEmit", "doesnt emit a file")
	.option("--run", "runs the program");

program.parse();

const options = program.opts();
const file = program.args[0]!;
const fileName = path.basename(file, path.extname(file));
const absolutePath = path.resolve(file);

let text: string;
try {
	text = await readFile(absolutePath, "utf-8");

	const lexer = new Lexer(text);
	const tokens = lexer.readSource();
	if (options.tokens) {
		console.log(`
			==================================================================
			Tokens
			==================================================================
			${JSON.stringify(tokens, null, 2)}
    	`);
	}
	const parser = new Parser(tokens, fileName);
	const AST = parser.parse();
	if (options.ast) {
		console.log(`
			==================================================================
			Abstract Syntax Tree (AST)
			==================================================================
			${JSON.stringify(AST, null, 3)}
		`);
	}
	const binder = new Binder(AST);
	binder.bind();
} catch (error) {
	if (options.debug) {
		console.error(error);
	} else {
		console.error(error instanceof Error ? error.name + ": " + error.message : error);
	}

	process.exit(1);
}
