import path from "node:path";
import * as fs from "node:fs";

import { LPPModuleNotFoundError } from "../../Errors/Modules/LPPModuleNotFoundError.ts";
import { validExtensions } from "./ModuleTypes.ts";
import { NodeKind, type ImportSourceStatement, type ImportStdlibStatement } from "../../Parser/Parser.types.ts";
import { runtimePath } from "../../Globals.ts";

export class ModuleResolver {
	public resolvePath(importer: string, specifier: string, importStatement: ImportSourceStatement | ImportStdlibStatement) {
		switch (importStatement.type) {
			case NodeKind.ImportSourceStatement:
				return this.resolveImportSourceStatement(importer, specifier);
			case NodeKind.ImportStdlibStatement:
				return this.resolveImportStdlibStatement(importStatement);
		}
	}
	private resolveImportSourceStatement(importer: string, specifier: string) {
		if (!path.isAbsolute(importer)) throw new LPPModuleNotFoundError("Importer must be absolute");
		const extension = path.extname(specifier);
		let filePath: string;
		if (extension === "") {
			filePath = path.join(path.dirname(importer), specifier + (validExtensions[0] ?? ".lpp"));
			for (let index = 0; index < validExtensions.length; index++) {
				const element = validExtensions[index]!;
				filePath = path.join(path.dirname(importer), specifier + element);
				if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
					continue;
				} else break;
			}
		} else {
			if (!validExtensions.includes(extension)) throw new LPPModuleNotFoundError("Extension " + extension + " is not a valid extension. (" + validExtensions + ")");
			filePath = path.join(path.dirname(importer), specifier);
		}

		if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) throw new LPPModuleNotFoundError("Module " + path.basename(filePath) + " not found.");
		return fs.realpathSync(filePath);
	}
	private resolveImportStdlibStatement(importStatement: ImportStdlibStatement) {
		const extension = path.extname(importStatement.stdlib);
		const name = path.basename(importStatement.stdlib, extension === "" ? undefined : extension);
		let filePath: string = path.join(runtimePath, name, name + ".lpp");

		if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) throw new LPPModuleNotFoundError("Module " + path.basename(filePath) + " not found.");
		//trust me the files will exist boii
		return fs.realpathSync(filePath);
	}
}
