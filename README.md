# @techspikes/codex-config

[![AI Generated | Codex](https://img.shields.io/badge/AI%20Generated-Codex-blue?style=flat)](https://shields.io/)
[![Node.js CI](https://github.com/techspikes/codex-config/actions/workflows/ci.yml/badge.svg)](https://github.com/techspikes/codex-config/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/techspikes/codex-config/branch/main/graph/badge.svg)](https://app.codecov.io/gh/techspikes/codex-config)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-brightgreen?style=flat)](https://github.com/neostandard/neostandard)
[![npm version](https://img.shields.io/npm/v/%40techspikes/codex-config?style=flat)](https://www.npmjs.com/package/@techspikes/codex-config)

A dependency-free Node.js ESM library for reading and writing Codex CLI
`config.toml` data.

## Usage

```sh
npm install @techspikes/codex-config
```

```js
import { readFileSync } from 'node:fs'
import { parse, stringify } from '@techspikes/codex-config'

// Read and parse the Codex CLI configuration.
const config = parse(readFileSync('config.toml', 'utf8'))

// Change the model in memory.
config.model = 'gpt-5'

// Generate TOML text.
const updatedToml = stringify(config)
```

If you overwrite `config.toml` with the result of `stringify()`, any comments
you added by hand are lost. This applies to both standalone and end-of-line
comments. The original formatting is also discarded.

### Merge configurations

```js
import { readFileSync } from 'node:fs'
import { merge, parse, stringify } from '@techspikes/codex-config'

const destination = parse(readFileSync('config.toml', 'utf8'))
const source = parse(readFileSync('overrides.toml', 'utf8'))
const updatedToml = stringify(merge(destination, source))
```

The source adds or overrides values. Tables merge recursively, and arrays
are replaced in full. Pass `{ removeMissing: true }` as the third argument
to remove destination-only keys at every level. Writing the generated TOML
back to disk discards the original comments and formatting.

## API

- `parse(source)` reads TOML text and returns a JSON-compatible configuration
  object. Invalid or unsupported TOML throws a `SyntaxError` with a line and
  column.
- `stringify(config)` returns TOML text. It writes direct values before nested
  tables and uses inline tables for objects inside arrays. Unsupported values
  and circular references throw a `TypeError`.
- `merge(destination, source, options?)` returns an independent configuration
  object. Both inputs must be configuration objects. `removeMissing` defaults
  to `false`.

TypeScript users can import `CodexConfig` and `MergeOptions`. Codex CLI validates
configuration fields.

## Supported TOML

The supported TOML 1.0 subset includes comments, quoted and dotted keys, single-
and multiline strings, booleans, decimal integers in the JavaScript safe range,
finite decimal floats, arrays, inline tables, tables, and arrays of tables.
Date and time values, other integer bases, non-finite floats, and TOML 1.1
extensions are unsupported.

When written, integer-valued numbers in the safe integer range use integer
notation, and negative zero becomes zero.

## Development

After installing the development tools, run `npm test` to run the Node.js
tests. c8 requires 100% statement, branch, function, and line coverage for the
library implementation and generates an LCOV report. Run
`npm run lint` for linting and `npm run test:typescript` for type tests. TSTyche may need
registry access to populate its compiler cache.

The Codex tests derive their input and expected values from the
[configuration reference](https://developers.openai.com/codex/config-reference),
the [sample configuration](https://learn.chatgpt.com/docs/config-file/config-sample)
and the [CLI 0.171.0 schema](https://github.com/openai/codex/blob/rust-v0.171.0/codex-rs/core/config.schema.json).
The round-trip cases cover project trust, MCP subprocess settings, per-skill
overrides, session-start hooks, developer instructions, granular approval
policy, model providers, permissions profiles, and plugins. See the
[fixture notes](test/fixtures/toml-test/README.md) for upstream TOML tests.
