import * as B from './supported-babel-types';
import { CompileError } from '../utils';
import { NumericType, parseNumericTypeName } from '../numeric-types';

export type NumericExpressionSlot = 'boundary' | 'cast';

export type NumericAnnotation =
  | { form: 'boundary'; numericType: NumericType }
  | { form: 'cast'; numericType: NumericType };

export interface NumericSourceInfo {
  fileDefaultFloatWidth?: 32 | 64;
  usesNumericTypes: boolean;
  annotationAt(node: B.Node, slot: NumericExpressionSlot): NumericAnnotation | undefined;
}

interface ParentInfo {
  parent: any;
  key: string | number;
}

interface CommentRange {
  start: number;
  end: number;
  value: string;
  type?: string;
}

export function analyzeNumericAnnotations(
  filename: string,
  sourceText: string,
  ast: B.File,
): NumericSourceInfo {
  const parents = new Map<B.Node, ParentInfo>();
  const nodes: B.Node[] = [];
  const visited = new WeakSet<object>();
  collect(ast);

  const annotations = new WeakMap<B.Node, NumericAnnotation>();
  let fileDefaultFloatWidth: 32 | 64 | undefined;
  let usesNumericTypes = false;
  const comments = ((ast as any).comments ?? []) as CommentRange[];

  for (const comment of comments) {
    if (typeof comment.start !== 'number' || typeof comment.end !== 'number') continue;
    if (comment.type && comment.type !== 'CommentBlock') continue;
    const body = comment.value;
    if (/microvium\s*:/.test(body)) {
      if (/\r|\n/.test(body)) {
        fail(comment.start, 'Numeric annotation comments may not contain a line terminator');
      }
      const directive = /^\s*microvium:\s*default-float=(f32|f64)\s*$/.exec(body);
      if (!directive) fail(comment.start, 'Invalid Microvium numeric default directive');
      if (prefixHasCode(sourceText.slice(0, comment.start))) {
        fail(comment.start, 'The default-float directive is only legal in the file header');
      }
      if (fileDefaultFloatWidth !== undefined) {
        fail(comment.start, 'Only one default-float directive is allowed per file');
      }
      fileDefaultFloatWidth = directive[1] === 'f32' ? 32 : 64;
      if (fileDefaultFloatWidth === 32) usesNumericTypes = true;
      continue;
    }

    const trimmed = body.trim();
    const compact = trimmed.replace(/\s+/g, '');
    const hasLineTerminator = /\r|\n/.test(body);
    const typeLike = /^\(?[iu][0-9]+\)?$/.test(compact) || /^\(?f[0-9]+\)?$/.test(compact);
    if (!typeLike) continue;
    if (hasLineTerminator) {
      fail(comment.start, 'Numeric annotation comments may not contain a line terminator');
    }

    let form: NumericAnnotation['form'];
    let name: string;
    const cast = /^\(([^()]*)\)$/.exec(trimmed);
    if (cast) {
      form = 'cast';
      name = cast[1];
    } else {
      form = 'boundary';
      name = trimmed;
    }
    const numericType = parseNumericTypeName(name);
    if (!numericType) fail(comment.start, `Invalid numeric type annotation "${name}"`);

    const candidates = nextExpressionCandidates(comment.end, nodes);
    if (candidates.length === 0) fail(comment.start, 'Numeric annotation is not followed by an expression');
    const target = form === 'boundary'
      ? candidates.reduce((a, b) => nodeEnd(a) >= nodeEnd(b) ? a : b)
      : chooseCastOperand(candidates, nodes, sourceText, comment.end);

    if (form === 'boundary' && !isCompleteExpressionSlot(target, parents)) {
      fail(comment.start, 'A bare numeric boundary must annotate a complete expression slot; parenthesize an operand expression');
    }
    if (annotations.has(target)) {
      fail(comment.start, 'An expression may have only one numeric annotation');
    }
    annotations.set(target, { form, numericType });
    usesNumericTypes = true;
  }

  return {
    fileDefaultFloatWidth,
    usesNumericTypes,
    annotationAt(node, slot) {
      const annotation = annotations.get(node);
      return annotation?.form === slot ? annotation : undefined;
    },
  };

  function collect(node: any, parent?: any, key?: string | number): void {
    if (!node || typeof node !== 'object' || visited.has(node)) return;
    visited.add(node);
    if (typeof node.type === 'string') {
      if (parent) parents.set(node as B.Node, { parent, key: key! });
      nodes.push(node as B.Node);
    }
    for (const [childKey, value] of Object.entries(node)) {
      if (childKey === 'loc' || childKey === 'comments' || childKey === 'tokens' ||
        childKey === 'extra' || childKey === 'leadingComments' || childKey === 'trailingComments' ||
        childKey === 'innerComments') continue;
      if (Array.isArray(value)) {
        value.forEach(child => collect(child, node, childKey));
      } else {
        collect(value, node, childKey);
      }
    }
  }

  function fail(offset: number, message: string): never {
    const prefix = sourceText.slice(0, offset);
    const line = prefix.split(/\r\n|\r|\n/).length;
    const lastLineBreak = Math.max(prefix.lastIndexOf('\n'), prefix.lastIndexOf('\r'));
    const column = offset - lastLineBreak;
    throw new CompileError(`${message}\n      at File (${filename}:${line}:${column})`);
  }
}

function prefixHasCode(prefix: string): boolean {
  return prefix
    .replace(/^\uFEFF?#![^\r\n]*/, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\r\n]*/g, '')
    .trim().length !== 0;
}

function nodeStart(node: B.Node): number {
  return typeof (node as any).start === 'number' ? (node as any).start : Number.MAX_SAFE_INTEGER;
}

function nodeEnd(node: B.Node): number {
  return typeof (node as any).end === 'number' ? (node as any).end : -1;
}

function nextExpressionCandidates(offset: number, nodes: B.Node[]): B.Node[] {
  let nextStart = Number.MAX_SAFE_INTEGER;
  const candidates: B.Node[] = [];
  for (const node of nodes) {
    if (!B.isExpression(node)) continue;
    const start = nodeStart(node);
    if (start < offset) continue;
    if (start < nextStart) {
      nextStart = start;
      candidates.length = 0;
    }
    if (start === nextStart) candidates.push(node);
  }
  return candidates;
}

function chooseCastOperand(
  candidates: B.Node[],
  nodes: B.Node[],
  sourceText: string,
  offset: number,
): B.Node {
  const nextToken = skipTrivia(sourceText, offset);
  if (sourceText[nextToken] === '(') {
    const firstStart = nodeStart(candidates[0]);
    if (firstStart === nextToken) {
      const lowPrecedence = new Set([
        'AssignmentExpression', 'BinaryExpression', 'ConditionalExpression', 'LogicalExpression',
        'SequenceExpression',
      ]);
      const tight = candidates.filter(node => !lowPrecedence.has(node.type));
      if (tight.length) return tight.reduce((a, b) => nodeEnd(a) >= nodeEnd(b) ? a : b);
      const grouped = nodes.filter(node => (node as any).extra?.parenStart === nextToken);
      if (grouped.length) return grouped.reduce((a, b) => nodeEnd(a) >= nodeEnd(b) ? a : b);
    }
  }

  const parenthesized = candidates.filter(node => (node as any).extra?.parenthesized === true);
  if (parenthesized.length) {
    return parenthesized.reduce((a, b) => nodeEnd(a) >= nodeEnd(b) ? a : b);
  }
  const lowPrecedence = new Set([
    'AssignmentExpression', 'BinaryExpression', 'ConditionalExpression', 'LogicalExpression',
    'SequenceExpression',
  ]);
  const tight = candidates.filter(node => !lowPrecedence.has(node.type));
  const choices = tight.length ? tight : candidates;
  return choices.reduce((a, b) => nodeEnd(a) >= nodeEnd(b) ? a : b);
}

function skipTrivia(sourceText: string, offset: number): number {
  while (offset < sourceText.length) {
    if (/\s/.test(sourceText[offset])) {
      offset++;
    } else if (sourceText.startsWith('//', offset)) {
      while (offset < sourceText.length && sourceText[offset] !== '\n' && sourceText[offset] !== '\r') offset++;
    } else if (sourceText.startsWith('/*', offset)) {
      const end = sourceText.indexOf('*/', offset + 2);
      if (end < 0) return offset;
      offset = end + 2;
    } else {
      break;
    }
  }
  return offset;
}

function isCompleteExpressionSlot(node: B.Node, parents: Map<B.Node, ParentInfo>): boolean {
  if ((node as any).extra?.parenthesized === true) return true;
  const parentInfo = parents.get(node);
  if (!parentInfo) return false;
  const parent = parentInfo.parent;
  const key = parentInfo.key;
  switch (parent.type) {
    case 'VariableDeclarator': return key === 'init';
    case 'AssignmentExpression': return key === 'right';
    case 'ReturnStatement': return key === 'argument';
    case 'CallExpression': return key === 'arguments';
    case 'ArrayExpression': return key === 'elements';
    case 'ObjectProperty': return key === 'value';
    case 'ConditionalExpression': return key === 'consequent' || key === 'alternate';
    case 'ArrowFunctionExpression': return key === 'body';
    default: return false;
  }
}

export function parseExactIntegerLiteral(raw: string): bigint {
  const text = raw.replace(/_/g, '');
  const radix = /^([+-]?)(0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+)$/.exec(text);
  if (radix) {
    return (radix[1] === '-' ? -1n : 1n) * BigInt(radix[2]);
  }

  const match = /^([+-]?)([0-9]+)(?:\.([0-9]*))?(?:[eE]([+-]?[0-9]+))?$/.exec(text);
  if (!match) throw new SyntaxError(`Invalid exact integer literal: ${raw}`);
  const sign = match[1] === '-' ? -1n : 1n;
  const fraction = match[3] ?? '';
  const exponent = Number(match[4] ?? 0);
  if (!Number.isSafeInteger(exponent)) throw new RangeError('Numeric exponent is too large');
  let value = BigInt(match[2] + fraction);
  const decimalPlaces = fraction.length - exponent;
  if (decimalPlaces > 0) {
    const divisor = 10n ** BigInt(decimalPlaces);
    if (value % divisor !== 0n) throw new SyntaxError(`Literal is not an exact integer: ${raw}`);
    value /= divisor;
  } else if (decimalPlaces < 0) {
    value *= 10n ** BigInt(-decimalPlaces);
  }
  return sign * value;
}
