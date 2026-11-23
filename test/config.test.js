import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { parse, stringify } from '@techspikes/codex-config'
import nonData from './fixtures/config/non-data.js'

const fixtures = new URL('./fixtures/config/', import.meta.url)
const read = name => readFileSync(new URL(name, fixtures), 'utf8')
const readJson = name => JSON.parse(read(name + '.json'))

test('writes root values before quoted project tables', () => {
  assert.equal(stringify(readJson('root-first')), read('root-first.toml'))
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

// Includes adapted examples from the Codex configuration reference and sample.
for (const name of ['documented', 'instructions', 'codex-sample', 'basic-strings', 'arrays', 'implicit-table']) {
  test('round-trips ' + name, () => {
    const expected = readJson(name)
    const parsed = parse(read(name + '.toml'))

    assert.deepEqual(parsed, expected)
    assert.deepEqual(parse(stringify(parsed)), expected)
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
