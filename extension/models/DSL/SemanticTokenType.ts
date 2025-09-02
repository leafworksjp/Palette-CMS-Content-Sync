export type TemplateTokenType =
    | 'SINGLE_CODE'
    | 'CODE'
    | 'ENDCODE'
    | 'SINGLE_INCLUDE'
    | 'SINGLE_IMPORT'
    | 'SINGLE_EXPORT'
    | 'INCLUDE'
    | 'ENDINCLUDE'
    | 'CHILDREN'
    | 'SINGLE_COMMENT'
    | 'COMMENT'
    | 'IF'
    | 'ELSEIF'
    | 'ELSE'
    | 'ENDIF'
    | 'FOR'
    | 'ENDFOR'
    | 'OPEN_OUTPUT'
    | 'CLOSE_OUTPUT'
    | 'EXPRESSION'
    | 'TEXT';
export type ExpressionTokenType =
  | 'IDENT'
  | 'COMMENT'
  | 'STRING'
  | 'NUMBER'
  | 'LITERAL'
  | 'KEYWORD'
  | 'OPERATOR';

export const semanticTokenTypes = [
	'keyword',
	'string',
	'number',
	'operator',
	'variable',
	'constant',
	'function',
	'property',
	'type',
	'comment',
	'namespace',
	'tag',
	'attribute',
] as const;

export type SemanticTokenType = typeof semanticTokenTypes[number];

export const tokenToIndex = (token: TemplateTokenType | ExpressionTokenType): number | undefined =>
{
	switch (token)
	{
		case 'SINGLE_CODE':
		case 'CODE':
		case 'ENDCODE':
		case 'SINGLE_INCLUDE':
		case 'SINGLE_IMPORT':
		case 'SINGLE_EXPORT':
		case 'INCLUDE':
		case 'ENDINCLUDE':
		case 'CHILDREN':
		case 'SINGLE_COMMENT':
		case 'IF':
		case 'ELSEIF':
		case 'ELSE':
		case 'ENDIF':
		case 'FOR':
		case 'ENDFOR':
		case 'OPEN_OUTPUT':
		case 'CLOSE_OUTPUT':
			return semanticTokenTypes.indexOf('namespace');

		case 'KEYWORD':
			return semanticTokenTypes.indexOf('keyword');

		case 'IDENT':
			return semanticTokenTypes.indexOf('variable');

		case 'OPERATOR':
			return semanticTokenTypes.indexOf('operator');

		case 'STRING':
			return semanticTokenTypes.indexOf('string');

		case 'NUMBER':
		case 'LITERAL':
			return semanticTokenTypes.indexOf('number');

		case 'COMMENT':
			return semanticTokenTypes.indexOf('comment');

		case 'EXPRESSION':
		case 'TEXT':
		default:
			return undefined;
	}
};
