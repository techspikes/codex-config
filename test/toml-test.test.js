import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { parse, stringify } from '@techspikes/codex-config'

const fixtures = new URL('./fixtures/toml-test/', import.meta.url)
const read = name => readFileSync(new URL(name, fixtures), 'utf8')

function decode (value) {
  if (Array.isArray(value)) return value.map(decode)
  if (typeof value.type === 'string' && typeof value.value === 'string') {
    switch (value.type) {
      case 'integer':
      case 'float': return Number(value.value) || 0
      case 'bool': return value.value === 'true'
      case 'string': return value.value
      default: throw new Error('Unsupported fixture type: ' + value.type)
    }
  }
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, decode(child)]))
}

for (const name of ['valid/integer/underscore', 'valid/float/exponent']) {
  test('toml-test: ' + name, () => {
    const expected = decode(JSON.parse(read(name + '.json')))
    assert.deepEqual(parse(read(name + '.toml')), expected)
    assert.deepEqual(parse(stringify(expected)), expected)
  })
}

test('toml-test: invalid/bool/capitalized-true', () => {
  assert.throws(() => parse(read('invalid/bool/capitalized-true.toml')), SyntaxError)
})
