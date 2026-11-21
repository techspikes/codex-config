import { expect, test } from 'tstyche'
import { parse, stringify, type CodexConfig } from '@techspikes/codex-config'

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
