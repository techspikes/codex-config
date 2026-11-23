import { expect, test } from 'tstyche'
import { merge, parse, stringify, type CodexConfig, type MergeOptions } from '@techspikes/codex-config'

test('parse returns Codex configuration data', () => {
  expect(parse('model = "gpt-5"')).type.toBe<CodexConfig>()
  expect(parse).type.not.toBeCallableWith(123)
})

test('stringify accepts nested configuration data', () => {
  expect(stringify({ skills: { config: [{ path: '/example/SKILL.md', enabled: false }] } })).type.toBe<string>()
  expect(stringify).type.not.toBeCallableWith('model = "gpt-5"')
  expect(stringify).type.not.toBeCallableWith({ invalid: null })
  expect(stringify).type.not.toBeCallableWith({ invalid: new Date() })
})

test('merge returns a configuration and accepts a boolean removal option', () => {
  expect(merge({}, {}, { removeMissing: true })).type.toBe<CodexConfig>()
  expect<MergeOptions>().type.toBe<{ removeMissing?: boolean }>()
  expect(merge).type.not.toBeCallableWith({}, {}, { removeMissing: 'yes' })
  expect(merge).type.not.toBeCallableWith('', {})
})
