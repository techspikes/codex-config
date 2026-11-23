# Upstream TOML fixtures

The 28 cases here come from the `v2.2.0` release of [`toml-test`](https://github.com/toml-lang/toml-test/tree/v2.2.0).
Their paths are relative to the upstream `tests/` directory and appear in the
[TOML 1.0 case list](https://github.com/toml-lang/toml-test/blob/v2.2.0/tests/files-toml-1.0.0).
The fixture files retain their upstream bytes, including CRLF and bare CR
characters in the newline cases. The upstream license is included here.

The selected cases cover keys, escaping, line endings, arrays, tables,
numbers, and invalid syntax. Four files under `valid/` exercise deliberate
limits of the Codex TOML subset. `datetime/datetime`, `float/inf-and-nan`,
`integer/literals`, and `integer/long` must be rejected by this parser.
