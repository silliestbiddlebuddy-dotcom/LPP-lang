import type { AccessModifier, generalModifier, Modifier, Token, TokenType } from "../Lexer/Lexer.types.ts";
import {
	type Argument,
	type ArrayLiteralExpression,
	type AssertionExpression,
	type AssignmentOperator,
	type AssignmentStatement,
	type ASTType,
	type BinaryOperator,
	type Block,
	type BreakStatement,
	type ContinueStatement,
	type ElseifStatement,
	type Expression,
	type Identifier,
	type ForStatement,
	type FunctionCallExpression,
	type FunctionDeclaration,
	type GenericParameter,
	type IfStatement,
	type IndexExpression,
	type IntersectionType,
	type MemberAccessExpression,
	type Node,
	type Parameter,
	type PostfixUnaryOperator,
	type PrefixUnaryOperator,
	type Property,
	type ReturnStatement,
	type Type,
	type TypeAliasDeclaration,
	type TypeReference,
	type UnionType,
	type UserDefinedTypeDeclaration,
	type VariableDeclaration,
	type variableScope,
	type WhileStatement,
	type StringLiteral,
	type typeOperator,
	type ClassDeclaration,
	type HierarchyType,
	type InterfaceDeclaration,
	type ConstructorExpression,
	type ImportSourceStatement,
	type ImportStdlibStatement,
} from "./Parser.types.ts";

import {
	createArgument,
	createArrayLiteralExpression,
	createAssertionExpression,
	createAssignmentStatement,
	createBinaryExpression,
	createBlock,
	createBooleanLiteral,
	createBreakStatement,
	createContinueStatement,
	createElseifStatement,
	createForStatement,
	createFunctionCallExpression,
	createFunctionDeclaration,
	createGenericParameter,
	createIdentifier,
	createIfStatement,
	createIndexExpression,
	createMemberAccessExpression,
	createNumberLiteral,
	createParameter,
	createPostfixUnaryExpression,
	createPrefixUnaryExpression,
	createProgram,
	createProperty,
	createReturnStatement,
	createStringLiteral,
	createTypeReference,
	createTypeAliasDeclaration,
	createUserDefinedTypeDeclaration,
	createVariableDeclaration,
	createWhileStatement,
	createUnionType,
	createIntersectionType,
	createClassDeclaration,
	createFunctionType,
	createInterfaceDeclaration,
	createObjectExpression,
	createConstructorExpression,
} from "../Factory/ASTFactory.ts";

import {
	isClassKeyword,
	isConstKeyword,
	isExtendsKeyword,
	isGlobalKeyword,
	isImplementsKeyword,
	isImportKeyword,
	isInterfaceKeyword,
	isLocalKeyword,
} from "../Lexer/TokenGuards.ts";
import {
	isAccessModifier,
	isAssignmentOperator,
	isBinaryOperator,
	isBoolean,
	isBreakKeyword,
	isContinueKeyword,
	isExtendsOrImplementsToken,
	isForKeyword,
	isFunctionKeyword,
	isGeneralModifier,
	isIdentifier,
	isIfKeyword,
	isModifier,
	isPostfixUnaryOperator,
	isPrefixUnaryOperator,
	isReturnKeyword,
	isTypeKeyword,
	isTypeOperator,
	isWhileKeyword,
} from "./ASTGuards.ts";

import { log } from "console";
import { LPPSyntaxError } from "../Errors/LPPSyntaxError.ts";

export class Parser {
	private tokens: Token[];
	private AST: ASTType;
	private pointer: number;
	constructor(tokens: Token[], programName: string) {
		this.pointer = 0;
		this.tokens = tokens;
		this.AST = [createProgram(programName)];
	}
	// ─────────────────────────────────────────────
	// Program
	// ─────────────────────────────────────────────
	public parse(): ASTType {
		this.pointer = 0;
		while (this.peek().type !== "EOF") {
			const node = this.parseStatement();
			(this.AST[0] as any).body.push(node);
		}
		return this.AST;
	}

	// ─────────────────────────────────────────────
	// Statements
	// ─────────────────────────────────────────────

	private parseStatement(): Node {
		let currentToken = this.peek();

		if (isIfKeyword(currentToken)) {
			const val = this.parseIfStatement();
			if (this.peek().value === ";") this.expect("Symbol", ";", "Expected statement terminator `;`");
			return val;
		} else if (isReturnKeyword(currentToken)) {
			const val = this.parseReturnStatement();
			this.expect("Symbol", ";", "Expected statement terminator `;`");
			return val;
		} else if (isWhileKeyword(currentToken)) {
			const val = this.parseWhileStatement();
			if (this.peek().value === ";") this.expect("Symbol", ";", "Expected statement terminator `;`");
			return val;
		} else if (isIdentifier(currentToken) || currentToken.value === "(") {
			const expression = this.parseExpression();
			if (isAssignmentOperator(this.peek().value)) {
				const val = this.parseAssignmentStatement(expression);
				this.expect("Symbol", ";", "Expected statement terminator `;`");
				return val;
			}
			if (this.peek().value === ";") this.expect("Symbol", ";", "Expected statement terminator `;`");
			if (expression.type !== "FunctionCallExpression") throw new LPPSyntaxError("Expression statements aren't allowed, onlly function calls are.");
			return expression;
		} else if (isForKeyword(currentToken)) {
			const val = this.parseForStatement();
			if (this.peek().value === ";") this.expect("Symbol", ";", "Expected statement terminator `;`");
			return val;
		} else if (isContinueKeyword(currentToken)) {
			const val = this.parseContinueStatement();
			this.expect("Symbol", ";", "Expected statement terminator `;`");
			return val;
		} else if (isBreakKeyword(currentToken)) {
			const val = this.parseBreakStatement();
			this.expect("Symbol", ";", "Expected statement terminator `;`");
			return val;
		} else if (isImportKeyword(currentToken)) {
			const importStatement = this.parseImportStatement();
			this.expect("Symbol", ";", "Expected statement terminator `;`");
			return importStatement;
		} else {
			const modifiers = this.parseGeneralModifiers();
			currentToken = this.peek();
			if (isConstKeyword(currentToken) || isLocalKeyword(currentToken) || isGlobalKeyword(currentToken)) {
				const val = this.parseVariableDeclaration(modifiers);
				this.expect("Symbol", ";", "Expected statement terminator `;`");
				return val;
			} else if (isTypeKeyword(currentToken)) {
				const val = this.parseTypeDeclaration(modifiers);
				if (this.peek().value === ";") this.expect("Symbol", ";", "Expected statement terminator `;`");
				return val;
			} else if (isAccessModifier(currentToken) || isModifier(currentToken) || isFunctionKeyword(currentToken)) {
				const val = this.parseFunctionDeclaration(modifiers);
				if (this.peek().value === ";") this.expect("Symbol", ";", "Expected statement terminator `;`");
				return val;
			} else if (isClassKeyword(currentToken)) {
				const val = this.parseClassDeclaration(modifiers);
				if (this.peek().value === ";") this.expect("Symbol", ";", "Expected statement terminator `;`");
				return val;
			} else if (isInterfaceKeyword(currentToken)) {
				const val = this.parseInterfaceDeclaration(modifiers);
				if (this.peek().value === ";") this.expect("Symbol", ";", "Expected statement terminator `;`");
				return val;
			} else throw new LPPSyntaxError("Expected a declaration or a statement.");
		}

		/*if (isConstKeyword(currentToken) || isLocalKeyword(currentToken) || isGlobalKeyword(currentToken)) {
			return this.parseVariableDeclaration();
		}*/
	}
	private parseGeneralModifiers(): generalModifier[] {
		const modifiers: generalModifier[] = [];
		while (isGeneralModifier(this.peek())) {
			modifiers.push(this.consume().value as generalModifier);
		}

		return modifiers;
	}
	private parseIdentifierList(until?: string): Identifier[] {
		const identifiers: Identifier[] = [];
		while (this.peek().type === "Identifier" && this.peek().value !== until) {
			identifiers.push(this.consume() as Identifier);
			if (this.peek().type === "Symbol" && this.peek().value === ",") {
				this.consume();
				continue;
			} else break;
		}
		return identifiers;
	}
	private parseBlock(endTokenType: TokenType, value: string): Block {
		const block = createBlock([]);
		while (this.peek().type !== endTokenType && this.peek().value !== value) {
			if (this.peek().type === "EOF") {
				throw new LPPSyntaxError(`Expected ${endTokenType} but reached EOF`);
			}
			const node = this.parseStatement();
			block.body.push(node);
		}
		if (this.peek().value === ";") this.expect("Symbol", ";", "Expected statement terminator `;`");
		return block;
	}
	private parseObject(endTokenType: TokenType, value: string): Property[] {
		const properties: Property[] = [];
		while (this.peek().type !== endTokenType && this.peek().value !== value) {
			if (this.peek().type === "EOF") {
				throw new LPPSyntaxError(`Expected ${endTokenType} but reached EOF`);
			}
			const property = this.parseProperty();
			properties.push(property);
			if (this.peek().value === ",") {
				this.consume();
			} else break;
		}
		return properties;
	}
	private parseElseifStatement(): ElseifStatement {
		this.expect("ReservedElseif");
		const condition = this.parseExpression();
		this.expect("ReservedDo");
		this.expect("Symbol", "{");
		const body = this.parseBlock("Symbol", "}");
		this.expect("Symbol", "}");
		return createElseifStatement(body, condition);
	}
	private parseIfStatement(): IfStatement {
		this.expect("ReservedIf");
		const condition = this.parseExpression();
		this.expect("ReservedDo");
		this.expect("Symbol", "{");
		const body = this.parseBlock("Symbol", "}");
		this.expect("Symbol", "}");
		const elseifs: ElseifStatement[] = [];
		while (this.peek().type === "ReservedElseif") {
			elseifs.push(this.parseElseifStatement());
		}
		let elseBlock = undefined;
		if (this.peek().type === "ReservedElse") {
			this.consume();
			this.expect("Symbol", "{");
			elseBlock = this.parseBlock("Symbol", "}");
			this.expect("Symbol", "}");
		}
		return createIfStatement(body, condition, elseifs, elseBlock);
	}
	private parseWhileStatement(): WhileStatement {
		this.expect("ReservedWhile");
		const condition = this.parseExpression();
		this.expect("ReservedDo");
		this.expect("Symbol", "{");
		const body = this.parseBlock("Symbol", "}");
		this.expect("Symbol", "}");
		return createWhileStatement(body, condition);
	}
	private parseReturnStatement(): ReturnStatement {
		this.expect("ReservedReturn");
		return createReturnStatement(this.parseExpression());
	}
	private parseAssignmentStatement(target: Expression = this.parseExpression()): AssignmentStatement {
		const operator = this.expect("Symbol");
		const value = this.parseExpression();
		return createAssignmentStatement(target, operator.value as AssignmentOperator, value);
	}
	private parseForStatement(): ForStatement {
		this.expect("ReservedFor");
		this.expect("Symbol", "(");
		const initializer = this.parseVariableDeclaration([]);
		this.expect("Symbol", ";");
		const condition = this.parseExpression();
		this.expect("Symbol", ";");
		const update = this.parseAssignmentStatement();
		this.expect("Symbol", ")");
		this.expect("ReservedDo");
		this.expect("Symbol", "{");
		const body = this.parseBlock("Symbol", "}");
		this.expect("Symbol", "}");
		return createForStatement(initializer, condition, update, body);
	}
	private parseContinueStatement(): ContinueStatement {
		this.expect("ReservedContinue");
		return createContinueStatement();
	}
	private parseBreakStatement(): BreakStatement {
		this.expect("ReservedBreak");
		return createBreakStatement();
	}
	private parseImportStatement(): ImportSourceStatement | ImportStdlibStatement {
		this.consume();
		const imports = this.parseIdentifierList("from");
		if (imports.length === 0) throw new LPPSyntaxError("Missing imports from an import statement.");
		this.expect("Identifier", "from", "Missing `from` after import specifiers");
		if (this.peek().type === "String") {
			const source = this.consume().value;
			if (source.length === 0) throw new LPPSyntaxError("Expected a source file");
			return {
				type: "ImportSourceStatement",
				source: source,
				imports: imports,
			};
		} else {
			this.expect("Symbol", "<", "Expected opening `<` to import an stdlib.");
			const stdlib = this.expect("Identifier", "all", "Expected an stdlib");

			this.expect("Symbol", ">", "Expected closing `>` to close the opening `<`.");
			return {
				type: "ImportStdlibStatement",
				stdlib: stdlib.value,
				imports: imports,
			};
		}
	}
	// ─────────────────────────────────────────────
	// Declarations
	// ─────────────────────────────────────────────

	private parseParameter(): Parameter {
		const name = this.expect("Identifier").value;
		this.expect("Symbol", ":", "Expected a type annotation");
		const type = this.parseType();
		return createParameter(name, type);
	}
	private parseProperty(needsAccessModifier: boolean = false): Property {
		const currentToken = this.peek();
		const modifiers: Modifier[] = [];
		let accessModifier;
		if (isAccessModifier(currentToken)) {
			accessModifier = currentToken;
			this.consume();
		}
		if (needsAccessModifier && accessModifier == null) {
			throw new LPPSyntaxError("expect an access modifier ");
		}
		while (isModifier(this.peek())) {
			modifiers.push(this.consume().value as Modifier);
		}
		const identifier = this.expect("Identifier");
		this.expect("Symbol", ":", "expected a type annotation");
		const type = this.parseType();

		return createProperty(identifier.value, type, modifiers, accessModifier?.value as AccessModifier);
	}
	private parseBareProperty(modifiers: Modifier[], accessModifier: AccessModifier): Property {
		const identifier = this.expect("Identifier");
		this.expect("Symbol", ":", "expected a type annotation");
		const type = this.parseType();
		if (this.peek().value === ";") this.expect("Symbol", ";");
		return createProperty(identifier.value, type, modifiers, accessModifier);
	}
	private parseExtends(): Type {
		this.expect("ReservedExtends", "all", "expected `extends` keyword");
		return this.parseType();
	}
	private parseImplements(): Type {
		this.expect("ReservedImplements", "all", "expected `implements` keyword");
		return this.parseType();
	}
	private parseFunctionDeclaration(generalModifiers: generalModifier[], needsAccessModifier: boolean = false): FunctionDeclaration {
		const currentToken = this.peek();
		const modifiers: Modifier[] = [];
		const parameters: Parameter[] = [];
		const genericParameters: GenericParameter[] = [];

		let type: Type;

		let accessModifier;
		if (isAccessModifier(currentToken)) {
			accessModifier = currentToken;
			this.consume();
		}
		if (needsAccessModifier && accessModifier == null) {
			throw new LPPSyntaxError("expect an access modifier ");
		}
		while (isModifier(this.peek())) {
			modifiers.push(this.consume().value as Modifier);
		}
		this.expect("ReservedFunction");
		const name = this.expect("Identifier").value;
		if (this.peek().type === "Symbol" && this.peek().value === "<") {
			this.expect("Symbol", "<");
			while (!(this.peek().type === "Symbol" && this.peek().value === ">")) {
				genericParameters.push(this.parseGenericParameter());

				if (this.peek().type === "Symbol" && this.peek().value === ",") {
					this.expect("Symbol", ",");
				} else {
					break;
				}
			}

			this.expect("Symbol", ">");
		}
		this.expect("Symbol", "(");
		while (this.peek().value !== ")") {
			parameters.push(this.parseParameter());
			if (this.peek().value === ",") {
				this.expect("Symbol", ",");
			} else if (this.peek().value !== ")") {
				throw new LPPSyntaxError("expected `,` or `)` but got " + this.peek().value);
			}
		}
		this.expect("Symbol", ")");
		this.expect("Symbol", ":", "expected a type annotation after function declaration");
		type = this.parseType();
		this.expect("Symbol", "{");
		const body: Block = this.parseBlock("Symbol", "}");
		this.expect("Symbol", "}");

		return createFunctionDeclaration(name, type, modifiers, parameters, body, generalModifiers, genericParameters, accessModifier?.value as AccessModifier);
	}
	private parseBareFunctionDeclaration(generalModifiers: generalModifier[], modifiers: Modifier[], accessModifier?: AccessModifier): FunctionDeclaration {
		let type: Type;
		const parameters: Parameter[] = [];
		const genericParameters: GenericParameter[] = [];
		this.expect("ReservedFunction");
		const name = this.expect("Identifier").value;
		if (this.peek().type === "Symbol" && this.peek().value === "<") {
			this.expect("Symbol", "<");
			while (!(this.peek().type === "Symbol" && this.peek().value === ">")) {
				genericParameters.push(this.parseGenericParameter());

				if (this.peek().type === "Symbol" && this.peek().value === ",") {
					this.expect("Symbol", ",");
				} else {
					break;
				}
			}

			this.expect("Symbol", ">");
		}
		this.expect("Symbol", "(");
		while (this.peek().value !== ")") {
			parameters.push(this.parseParameter());
			if (this.peek().value === ",") {
				this.expect("Symbol", ",");
			} else if (this.peek().value !== ")") {
				throw new LPPSyntaxError("expected `,` or `)` but got " + this.peek().value);
			}
		}
		this.expect("Symbol", ")");
		this.expect("Symbol", ":", "expected a type annotation after function declaration");
		type = this.parseType();
		this.expect("Symbol", "{");
		const body: Block = this.parseBlock("Symbol", "}");
		this.expect("Symbol", "}");
		if (this.peek().value === ";") this.expect("Symbol", ";", "Expected statement terminator `;`");
		return createFunctionDeclaration(name, type, modifiers, parameters, body, generalModifiers, genericParameters, accessModifier);
	}
	private parseTypeDeclaration(generalModifiers: generalModifier[]): UserDefinedTypeDeclaration | TypeAliasDeclaration {
		this.expect("ReservedType");
		const identifier = this.expect("Identifier", "all", "expected an identifier after a type declaration").value;
		const parameters: GenericParameter[] = [];
		if (this.peek().type === "Symbol" && this.peek().value === "<") {
			this.expect("Symbol", "<");
			while (!(this.peek().type === "Symbol" && this.peek().value === ">")) {
				parameters.push(this.parseGenericParameter());

				if (this.peek().type === "Symbol" && this.peek().value === ",") {
					this.expect("Symbol", ",");
				} else {
					break;
				}
			}

			this.expect("Symbol", ">");
		}
		this.expect("Symbol", "=", "expected assignment operator after type declaration");
		if (this.peek().value === "{") {
			return this.parseUserDefinedTypeDeclaration(identifier, parameters, generalModifiers);
		} else {
			return this.parseTypeAliasDeclaration(identifier, parameters, generalModifiers);
		}
	}
	private parseUserDefinedTypeDeclaration(identifier: string, parameters: GenericParameter[], modifiers: generalModifier[]): UserDefinedTypeDeclaration {
		this.expect("Symbol", "{");
		const properties = this.parseObject("Symbol", "}");
		this.expect("Symbol", "}");
		return createUserDefinedTypeDeclaration(identifier, parameters, properties, modifiers);
	}
	private parseTypeAliasDeclaration(identifier: string, parameters: GenericParameter[], modifiers: generalModifier[]): TypeAliasDeclaration {
		const value = this.parseType();
		return createTypeAliasDeclaration(identifier, value, parameters, modifiers);
	}
	private parseClassDeclaration(generalModifiers: generalModifier[], needsAccessModifier: boolean = false): ClassDeclaration {
		this.expect("ReservedClass");
		const properties: Property[] = [];
		const methods: FunctionDeclaration[] = [];
		const identifier = this.expect("Identifier", "all", "A class must have a name");
		const parameters: GenericParameter[] = [];
		const hierarchy: HierarchyType = {
			extends: [],
			implements: [],
		};
		if (this.peek().type === "Symbol" && this.peek().value === "<") {
			this.expect("Symbol", "<");
			while (!(this.peek().type === "Symbol" && this.peek().value === ">")) {
				parameters.push(this.parseGenericParameter());

				if (this.peek().type === "Symbol" && this.peek().value === ",") {
					this.expect("Symbol", ",");
				} else {
					break;
				}
			}

			this.expect("Symbol", ">");
		}
		while (isExtendsOrImplementsToken(this.peek())) {
			if (isExtendsKeyword(this.peek())) {
				hierarchy.extends.push(this.parseExtends());
			} else if (isImplementsKeyword(this.peek())) {
				hierarchy.implements.push(this.parseImplements());
			}
		}
		this.expect("Symbol", "{");
		while (this.peek().value !== "}") {
			let accessModifier;
			const modifiers: Modifier[] = [];
			if (isAccessModifier(this.peek())) {
				accessModifier = this.peek();
				this.consume();
			}
			if (needsAccessModifier && accessModifier == null) {
				throw new LPPSyntaxError("expect an access modifier ");
			}
			while (isModifier(this.peek())) {
				modifiers.push(this.consume().value as Modifier);
			}
			if (this.peek().type === "Identifier") {
				properties.push(this.parseBareProperty(modifiers, accessModifier?.value as AccessModifier));
			} else if (this.peek().type === "ReservedFunction") {
				methods.push(this.parseBareFunctionDeclaration([], modifiers, accessModifier?.value as AccessModifier));
			} else {
				throw new LPPSyntaxError("expected a property or a method");
			}
		}
		this.expect("Symbol", "}");
		return createClassDeclaration(generalModifiers, parameters, identifier.value, properties, methods, hierarchy);
	}
	private parseInterfaceDeclaration(generalModifiers: generalModifier[]): InterfaceDeclaration {
		this.expect("ReservedInterface");
		const properties: Property[] = [];

		const identifier = this.expect("Identifier", "all", "expected an identifier after interface keyword");
		const parameters: GenericParameter[] = [];
		const hierarchy: HierarchyType = {
			extends: [],
			implements: [],
		};
		if (this.peek().type === "Symbol" && this.peek().value === "<") {
			this.expect("Symbol", "<");
			while (!(this.peek().type === "Symbol" && this.peek().value === ">")) {
				parameters.push(this.parseGenericParameter());

				if (this.peek().type === "Symbol" && this.peek().value === ",") {
					this.expect("Symbol", ",");
				} else {
					break;
				}
			}

			this.expect("Symbol", ">");
		}
		while (isExtendsOrImplementsToken(this.peek())) {
			if (isExtendsKeyword(this.peek())) {
				hierarchy.extends.push(this.parseExtends());
			} else if (isImplementsKeyword(this.peek())) {
				hierarchy.implements.push(this.parseImplements());
			}
		}
		this.expect("Symbol", "{");
		while (this.peek().value !== "}") {
			let accessModifier;
			const modifiers: Modifier[] = [];
			if (isAccessModifier(this.peek())) {
				accessModifier = this.peek();
				this.consume();
			}

			while (isModifier(this.peek())) {
				modifiers.push(this.consume().value as Modifier);
			}
			if (this.peek().type === "Identifier") {
				properties.push(this.parseBareProperty(modifiers, accessModifier?.value as AccessModifier));
			} else {
				throw new LPPSyntaxError("expected a property");
			}
		}
		this.expect("Symbol", "}");
		return createInterfaceDeclaration(generalModifiers, parameters, identifier.value, properties, hierarchy);
	}

	// ─────────────────────────────────────────────
	// Expressions
	// ─────────────────────────────────────────────

	private parseArgument(): Argument {
		return createArgument(this.parseExpression());
	}
	private parseAssertionExpression(left: Expression): AssertionExpression {
		this.expect("Symbol", "::");
		const type = this.parseType();
		return createAssertionExpression(left, type);
	}
	private parseMemberAccessExpression(left: Expression): Expression {
		while (this.peek().value === ".") {
			this.consume();
			const right = createIdentifier(this.expect("Identifier").value);
			left = createMemberAccessExpression(left, right);
		}
		return left;
	}
	private parseFunctionCall(left: Expression): FunctionCallExpression {
		const argumentArray = [];
		this.expect("Symbol", "(");
		while (this.peek().value !== ")") {
			argumentArray.push(this.parseArgument());
			if (this.peek().value === ",") {
				this.expect("Symbol", ",");
			} else if (this.peek().value !== ")") {
				throw new LPPSyntaxError("expected `,` or `)` but got " + this.peek().value);
			}
		}
		this.expect("Symbol", ")");
		left = createFunctionCallExpression(left, argumentArray);
		return left;
	}
	private parseArrayLiteralExpression(): ArrayLiteralExpression {
		const elements = [];
		this.expect("Symbol", "[");
		while (this.peek().value !== "]") {
			elements.push(this.parseExpression());
			if (this.peek().value === ",") {
				this.expect("Symbol", ",");
			} else if (this.peek().value !== "]") {
				throw new LPPSyntaxError("expected `,` or `]` but got " + this.peek().value);
			}
		}
		this.expect("Symbol", "]");

		return createArrayLiteralExpression(elements);
	}
	private parseIndexExpression(left: Expression): IndexExpression {
		this.expect("Symbol", "[");
		const index = this.parseExpression();
		this.expect("Symbol", "]");
		left = createIndexExpression(left, index);
		return left;
	}
	private parseExpression(minPrecedence: number = 0): Expression {
		let left = this.parsePostfixExpression();
		while (isBinaryOperator(this.peek())) {
			let operator = this.peek();
			const precedence = this.getPrecedence(operator.value as BinaryOperator);
			if (precedence < minPrecedence) {
				break;
			}
			this.consume();
			const right = this.parseExpression(precedence);
			left = createBinaryExpression(left, operator.value as BinaryOperator, right);
		}
		return left;
	}
	private parsePostfixExpression(): Expression {
		let left = this.parsePrimaryExpression();
		while (true) {
			if (this.peek().value === ".") {
				left = this.parseMemberAccessExpression(left);
			} else if (this.peek().value === "(") {
				left = this.parseFunctionCall(left);
			} else if (this.peek().value === "[") {
				left = this.parseIndexExpression(left);
			} else if (this.peek().value === "::") {
				left = this.parseAssertionExpression(left);
			} else break;
		}
		return left;
	}
	private parsePrimaryExpression(): Expression {
		const token = this.peek();
		if (isPrefixUnaryOperator(token)) {
			this.consume();
			const expression = this.parseExpression(40);
			return createPrefixUnaryExpression(token.value as PrefixUnaryOperator, expression);
		}

		if (token.type === "Number") {
			this.consume();
			return createNumberLiteral(token.rawVal as number);
		}
		if (isBoolean(token)) {
			this.consume();
			return createBooleanLiteral(token.value);
		}
		if (token.type === "String") {
			this.consume();
			return createStringLiteral(token.value);
		}
		if (token.type === "Identifier") {
			this.consume();
			return createIdentifier(token.value);
		}
		if (token.type === "Symbol" && token.value === "(") {
			this.consume();
			const expression = this.parseExpression();
			this.expect("Symbol", ")");
			return expression;
		}
		if (token.type === "Symbol" && token.value === "[") {
			const array = this.parseArrayLiteralExpression();

			return array;
		}
		if (token.type === "Symbol" && token.value === "{") {
			this.consume();
			const expression = createObjectExpression(this.parseObject("Symbol", "}"));
			this.expect("Symbol", "}");
			return expression;
		}
		if (token.type === "ReservedNew") {
			return this.parseConstructorExpression();
		}
		throw new LPPSyntaxError("expected a value but couldnt find it");
	}
	private parseVariableDeclaration(modifiers: generalModifier[]): VariableDeclaration {
		let currentToken = this.peek();
		let constant: boolean = false;

		let scope: variableScope;
		if (currentToken.type === "ReservedConst") {
			constant = true;
			this.consume();
			currentToken = this.peek();
		}
		if (currentToken.type === "ReservedLocal" || currentToken.type === "ReservedGlobal") {
			if (this.peek().type === "ReservedGlobal") {
				scope = "global";
				this.expect("ReservedGlobal");
			} else {
				scope = "local";
				this.expect("ReservedLocal");
			}
		} else {
			throw new LPPSyntaxError("Expected variable declaration");
		}
		const name = this.expect("Identifier").value;
		if (this.expect("Symbol", ":", "Expected a type annotation")) {
			var type = this.parseType();
			if (this.expect("Symbol").value === "=") {
				var value = this.parseExpression();
			} else {
				throw new LPPSyntaxError("Expected a type");
			}
		} else {
			throw new LPPSyntaxError(); //cant happen since expect throws an error but wtv
		}
		return createVariableDeclaration(scope, constant, name, type, value, modifiers);
	}
	private getPrecedence(operator: BinaryOperator): number {
		switch (operator) {
			case ">":
			case "<":
			case ">=":
			case "<=":
				return 5;
			case "==":
			case "!=":
				return 4;
			case "&&":
				return 3;
			case "||":
				return 2;
			case "+":
			case "-":
				return 10;
			case "*":
			case "/":
			case "%":
				return 20;
			case "**":
				return 30;
			default:
				return -1;
		}
	}
	private parseConstructorExpression(): ConstructorExpression {
		this.expect("ReservedNew");
		const classExpr = this.parsePrimaryExpression();
		const argumentsArray: Argument[] = [];
		this.expect("Symbol", "(");
		while (this.peek().value !== ")") {
			argumentsArray.push(this.parseArgument());
			if (this.peek().value === ",") {
				this.expect("Symbol", ",");
			} else {
				break;
			}
		}
		this.expect("Symbol", ")");
		return createConstructorExpression(classExpr, argumentsArray);
	}
	// ─────────────────────────────────────────────
	// Types
	// ─────────────────────────────────────────────
	private parseType(minPrecedence: number = 0): Type {
		if (this.peek().type === "Symbol" && (this.peek().value === "(" || this.peek().value === "<")) {
			const genericParameters: GenericParameter[] = [];
			if (this.peek().type === "Symbol" && this.peek().value === "<") {
				this.expect("Symbol", "<");
				while (!(this.peek().type === "Symbol" && this.peek().value === ">")) {
					genericParameters.push(this.parseGenericParameter());

					if (this.peek().type === "Symbol" && this.peek().value === ",") {
						this.expect("Symbol", ",");
					} else {
						break;
					}
				}

				this.expect("Symbol", ">");
			}
			this.expect("Symbol", "(", "Expected an opening `(` after generic parameters declaration.");
			const parameters: Parameter[] = [];
			while (this.peek().value !== ")") {
				parameters.push(this.parseParameter());
				if (this.peek().value === ",") {
					this.consume();
				} else break;
			}
			this.expect("Symbol", ")", "expected a closing `)`");
			this.expect("Symbol", "->", "expected a return type annotation");
			const returnType = this.parseType();
			return createFunctionType(parameters, genericParameters, returnType);
		}
		let left = this.parsePrimaryType();
		while (isTypeOperator(this.peek())) {
			let operator = this.peek();
			const precedence = this.getTypePrecedece(operator.value as typeOperator);
			if (precedence < minPrecedence) {
				break;
			}
			this.consume();
			const right = this.parseType(precedence);
			left = this.createTypeOperator(left, operator.value as typeOperator, right);
		}
		return left;
	}
	private parsePrimaryType(): Type {
		let identifier = this.parsePrimaryExpression();
		if (
			identifier.type === "ArrayLiteralExpression" ||
			identifier.type === "NumberLiteral" ||
			identifier.type === "StringLiteral" ||
			identifier.type === "BooleanLiteral" ||
			identifier.type === "ObjectExpression"
		)
			return identifier;
		if (identifier.type !== "Identifier") throw new LPPSyntaxError("Cannot assign expression of type `" + identifier.type + "` to a literal or an identifier.");
		const genericTypes: Type[] = [];
		if (identifier.type === "Identifier") {
			if (this.peek().type === "Symbol" && this.peek().value === "<") {
				this.expect("Symbol", "<");
				while (!(this.peek().type === "Symbol" && this.peek().value === ">")) {
					genericTypes.push(this.parseGeneric());

					if (this.peek().type === "Symbol" && this.peek().value === ",") {
						this.expect("Symbol", ",");
					} else {
						break;
					}
				}
				this.expect("Symbol", ">", "expected closing `>`");
			}
		}

		let optional = false;
		if (this.peek().type === "Symbol" && this.peek().value === "?") {
			this.consume();
			optional = true;
		}

		return createTypeReference(createIdentifier(identifier.value), genericTypes, optional);
	}
	private createTypeOperator(left: Type, operator: typeOperator, right: Type): Type {
		switch (operator) {
			case "&":
				return createIntersectionType(left, right);

			case "|":
				return createUnionType(left, right);
			default:
				throw new LPPSyntaxError("expected a valid type operator");
		}
	}
	private parseGeneric(): Type {
		const type = this.parseType();

		return type;
	}
	private parseGenericParameter(): GenericParameter {
		const identifier = this.expect("Identifier").value;
		this.expect("Symbol", ":", "expect type annotation");
		const type = this.parseType();

		return createGenericParameter(identifier, type);
	}
	private getTypePrecedece(operator: typeOperator) {
		switch (operator) {
			case "|":
				return 10;
			case "&":
				return 20;
			default:
				return -1;
		}
	}
	// ─────────────────────────────────────────────
	// Utilities
	// ─────────────────────────────────────────────

	private peek(): Token {
		if (!this.tokens[this.pointer]) throw new LPPSyntaxError("Cannot get token");

		return this.tokens[this.pointer]!;
	}
	private consume(): Token {
		if (!this.tokens[this.pointer]) throw new LPPSyntaxError("Cannot get token");
		const token = this.tokens[this.pointer]!;

		this.pointer++;
		return token;
	}
	private lookAhead(): Token {
		if (!this.tokens[this.pointer + 1]) throw new LPPSyntaxError("Cannot get token");

		return this.tokens[this.pointer + 1]!;
	}
	private expect(tokenType: TokenType, desired?: string, error?: string): Token {
		if (!(this.peek().type === tokenType)) {
			throw new LPPSyntaxError(error || "Expected token of type `" + tokenType + "` but got `" + this.peek().type + "` of value `" + this.peek().value + "`.");
		}

		if (!desired || desired === "all") {
			return this.consume();
		} else if (desired && this.peek().value === desired) {
			return this.consume();
		} else {
			throw new LPPSyntaxError(error || "Expected value  `" + desired + "` but got `" + this.peek().value + "`.");
		}
	}
}
