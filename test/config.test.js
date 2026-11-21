import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { parse, stringify } from '@techspikes/codex-config'
import nonData from './fixtures/config/non-data.js'

const fixtures = new URL('./fixtures/config/', import.meta.url)
const read = name => readFileSync(new URL(name, fixtures), 'utf8')
const readJson = name => JSON.parse(read(name + '.json'))

// Codex CLI 0.171.0 config reference and sample: projects, MCP servers,
// skills.config, and hooks. See README for source links.
test('reads documented Codex configuration structures and preserves their data', () => {
  const expected = readJson('documented')
  assert.deepEqual(parse(read('documented.toml')), expected)
  assert.deepEqual(parse(stringify(expected)), expected)
})

test('writes root values before quoted project tables', () => {
  assert.equal(stringify(readJson('root-first')), read('root-first.toml'))
})

test('reads multiline instructions and inline approval policy', () => {
  assert.deepEqual(parse(read('instructions.toml')), readJson('instructions'))
})

test('rejects unsupported values and redefinitions with source locations', () => {
  for (const name of readdirSync(new URL('invalid/', fixtures)).sort()) {
    const source = read('invalid/' + name)
    assert.throws(() => parse(source), { name: 'SyntaxError', message: /line \d+, column \d+/ }, name)
  }
  assert.deepEqual(parse(read('numbers.toml')), readJson('numbers'))
})

test('preserves special property names and rejects non-data values', () => {
  const data = readJson('special-properties')
  assert.deepEqual(parse(stringify(data)), data)
  for (const value of nonData) {
    assert.throws(() => stringify(value), TypeError)
  }
})

// TOML 1.0 strings, arrays, tables, and arrays of tables.
for (const name of ['basic-strings', 'arrays', 'implicit-table']) {
  test('reads ' + name, () => {
    const expected = readJson(name)
    assert.deepEqual(parse(read(name + '.toml')), expected)
    assert.deepEqual(parse(stringify(expected)), expected)
  })
}

for (const name of ['empty', 'large-floats']) {
  test('writes ' + name, () => {
    const expected = readJson(name)
    assert.equal(stringify(expected), read(name + '.toml'))
    assert.deepEqual(parse(read(name + '.toml')), expected)
  })
}

test('rejects invalid argument types and lone UTF-16 surrogates', () => {
  const { invalidSource, invalidConfig, malformedToml, malformedConfig } = readJson('invalid-js-input')
  assert.throws(() => parse(invalidSource), TypeError)
  assert.throws(() => stringify(invalidConfig), TypeError)
  assert.throws(() => parse(malformedToml), SyntaxError)
  assert.throws(() => stringify(malformedConfig), TypeError)
})
