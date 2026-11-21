type CodexConfigValue = string | boolean | number | CodexConfigValue[] | CodexConfig

/** JSON-compatible data from a Codex CLI config.toml. */
export interface CodexConfig {
  [key: string]: CodexConfigValue
}

export function parse (source: string): CodexConfig
export function stringify (config: CodexConfig): string

export interface MergeOptions {
  removeMissing?: boolean
}

export function merge (destination: CodexConfig, source: CodexConfig, options?: MergeOptions): CodexConfig
