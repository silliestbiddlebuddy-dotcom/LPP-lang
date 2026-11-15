import { NodeKind, type BinaryOperator } from "../../../Frontend/Parser/Parser.types.ts";
import type { TypedExpression } from "../../../Frontend/Semantic/TypeChecker/TypedAST.ts";
type Value = number | boolean | string;
export class ConstantEvaluator {
	public evaluate(expression: TypedExpression): Value {
		switch (expression.type) {
			case NodeKind.NumberLiteral:
				return expression.value;
			case NodeKind.BinaryExpression:
				return this.applyOperator(this.evaluate(expression.left), expression.operator, this.evaluate(expression.right));
			case NodeKind.PrefixUnaryExpression:
			case NodeKind.PostfixUnaryExpression:
			case NodeKind.MemberAccessExpression:
			case NodeKind.FunctionCallExpression:
			case NodeKind.ArrayLiteralExpression:
			case NodeKind.IndexExpression:
			case NodeKind.AssertionExpression:
			case NodeKind.ObjectExpression:
			case NodeKind.ConstructorExpression:
			case NodeKind.BooleanLiteral:
			case NodeKind.StringLiteral:
			case NodeKind.Identifier:
		}
	}
	private applyOperator(left: Value, operator: BinaryOperator, right: Value): Value {
		switch (operator) {
			case "+":
				if (typeof left === "string" || typeof right === "string") return String(left) + String(right);

				return (left as number) + (right as number);

			case "-":
				return (left as number) - (right as number);
			case "*":
				return (left as number) * (right as number);
			case "/":
				return (left as number) / (right as number);
			case "**":
				return (left as number) ** (right as number);
			case "%":
				return (left as number) % (right as number);

			case "<":
				return left < right;
			case ">":
				return left > right;
			case "<=":
				return left <= right;
			case ">=":
				return left >= right;

			case "==":
				return left === right;
			case "!=":
				return left !== right;

			case "||":
				return left || right;
			case "&&":
				return left && right;
		}
	}
}
