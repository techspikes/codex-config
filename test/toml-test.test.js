import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { sep } from 'node:path'
import test from 'node:test'
import { parse, stringify } from '@techspikes/codex-config'

const fixtures = new URL('./fixtures/toml-test/', import.meta.url)
const read = name => readFileSync(new URL(name, fixtures), 'utf8')
const unsupported = new Set([
  'valid/datetime/datetime',
  'valid/float/inf-and-nan',
  'valid/integer/literals',
  'valid/integer/long'
])

function decode (value) {
  if (Array.isArray(value)) {
    return value.map(decode)
  }

  if (typeof value.type === 'string' && typeof value.value === 'string') {
    switch (value.type) {
      case 'integer':
      case 'float': {
        const number = Number(value.value)
        assert.ok(Number.isFinite(number) && (value.type !== 'integer' || Number.isSafeInteger(number)))

        return number === 0 ? 0 : number
      }

      case 'bool':
        return value.value === 'true'
      case 'string':
        return value.value
      default:
        throw new Error('Unsupported fixture type: ' + value.type)
    }
  }

  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, decode(child)]))
}

for (const file of readdirSync(fixtures, { recursive: true }).filter(name => name.endsWith('.toml')).sort()) {
  const name = file.slice(0, -5).split(sep).join('/')
  const source = read(name + '.toml')

  test('toml-test: ' + name, () => {
    if (name.startsWith('invalid/') || unsupported.has(name)) {
      assert.throws(() => parse(source), { name: 'SyntaxError', message: /line \d+, column \d+/ })

      return
    }

    const expected = decode(JSON.parse(read(name + '.json')))
    const parsed = parse(source)

    assert.deepEqual(parsed, expected)
    assert.deepEqual(parse(stringify(parsed)), expected)
  })
}

test('preserves upstream CRLF fixtures', () => {
  for (const name of ['valid/newline-crlf.toml', 'valid/string/multiline-escaped-crlf.toml', 'invalid/control/bare-cr.toml']) {
    assert.match(read(name), /\r\n/, name)
  }
})
