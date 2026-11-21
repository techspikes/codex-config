import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { merge, parse, stringify } from '@techspikes/codex-config'

const read = name => JSON.parse(readFileSync(new URL('./fixtures/merge/' + name + '.json', import.meta.url), 'utf8'))

test('merges tables recursively and replaces arrays and values from the source', () => {
  const result = merge(read('destination'), read('source'))
  assert.deepEqual(result, read('expected'))
  assert.deepEqual(parse(stringify(result)), read('expected'))
  assert.equal(Object.getPrototypeOf(result), Object.prototype)
})

test('optionally removes destination-only keys at every level', () => {
  assert.deepEqual(merge(read('destination'), read('source'), { removeMissing: true }), read('source'))
  assert.deepEqual(merge(read('destination'), read('empty'), { removeMissing: true }), read('empty'))
})

test('accepts empty configurations and treats false as retaining keys', () => {
  assert.deepEqual(merge(read('empty'), read('source')), read('source'))
  assert.deepEqual(merge(read('destination'), read('empty'), { removeMissing: false }), read('destination'))
})

test('returns data independent of both inputs', () => {
  const destination = read('destination')
  const source = read('source')
  const result = merge(destination, source)
  result.mcp_servers.legacy.enabled = false
  result.mcp_servers.docs.args.push('extra')
  result.skills.config[0].name = 'changed'
  result.approval_policy.granular.sandbox_approval = false
  assert.deepEqual(destination, read('destination'))
  assert.deepEqual(source, read('source'))
})

test('requires two configuration objects', () => {
  for (const value of read('invalid')) {
    assert.throws(() => merge(value, read('empty')), TypeError)
    assert.throws(() => merge(read('empty'), value), TypeError)
  }
})
