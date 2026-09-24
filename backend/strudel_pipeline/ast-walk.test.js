import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as acorn from 'acorn';
import { walk } from './ast-walk.js';

test('visits every node in a simple AST, including nested call arguments', () => {
  const ast = acorn.parse('foo(bar(1), 2)', { ecmaVersion: 'latest' });
  const types = [];
  walk(ast, (node) => types.push(node.type));
  assert.ok(types.includes('CallExpression'));
  assert.ok(types.includes('Identifier'));
  assert.ok(types.includes('Literal'));
  assert.equal(types.filter((t) => t === 'CallExpression').length, 2);
});

test('does not descend into loc/range/start/end bookkeeping fields', () => {
  const ast = acorn.parse('1', { ecmaVersion: 'latest', locations: true });
  let visitedLocLike = false;
  walk(ast, (node) => {
    if (typeof node.type !== 'string') visitedLocLike = true;
  });
  assert.equal(visitedLocLike, false);
});
