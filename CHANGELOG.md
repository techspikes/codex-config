# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Stage npm releases for maintainer approval with two-factor authentication before publication.

## [1.0.1] - 2026-11-23

### Added

- Automated npm publishing for new stable versions after a GitHub Release and successful CI on `main`.
- Added 25 upstream TOML test cases and round-trip tests for documented Codex configurations.

### Changed

- Moved TypeScript declarations and TSTyche tests into `types/`.
- Tracked `package-lock.json` for reproducible development installs.

## [1.0.0] - 2026-11-21

### Added

- Added `parse` and `stringify` for the subset of TOML used by Codex CLI configuration files.
- Added TypeScript declarations for the public API, including the `CodexConfig` type.
- Added recursive configuration merging with optional removal of destination-only keys.
