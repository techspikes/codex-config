type CodexConfigValue = string | boolean | number | CodexConfigValue[] | CodexConfig

/** JSON-compatible data from a Codex CLI config.toml. */
export interface CodexConfig {
  [key: string]: CodexConfigValue
}

/** Parse TOML text into Codex CLI configuration data. */
export function parse (source: string): CodexConfig

/** Generate TOML text from configuration data. */
export function stringify (config: CodexConfig): string

export interface MergeOptions {
  /** Remove destination-only keys at every level. Defaults to false. */
  removeMissing?: boolean
}

/** Merge configuration data into a new object without modifying either input. */
export function merge (destination: CodexConfig, source: CodexConfig, options?: MergeOptions): CodexConfig
