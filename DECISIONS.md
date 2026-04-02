# Extraction Design Decisions

Design decisions made when extracting `browse` from the [garrytan/gstack](https://github.com/garrytan/gstack) monorepo into this standalone package.

---

## State directory: `.browse/` not `.gstack/`

The state directory was renamed from `.gstack/` to `.browse/` so that the standalone package and a full gstack install can coexist in the same project without sharing state files. Users migrating from gstack get a clean slate.

## Config-store replaces shell subprocesses

The monorepo used `gstack-config get/set` shell scripts (invoked via subprocess) for persistent user preferences. The standalone package replaces this with `src/config-store.ts`, which reads and writes `~/.config/browse/config.json` directly. No external binaries or shell wrappers required.

## Sidebar agent is an optional add-on

The Claude AI sidebar integration (`browse-agent`) ships as a separate Homebrew formula and optional binary rather than being bundled. The `connect` command discovers it at runtime via `BROWSE_AGENT_PATH`, an adjacent binary, or `which browse-agent`, and silently skips it if not found. This keeps the core install lightweight for users without Claude CLI.

## Binary discovery is distribution-first

The monorepo looked for the browse binary inside skill directories (`.claude/skills/gstack/`, `.codex/`, `.agents/`). The standalone package flips this: Homebrew install paths first (`/opt/homebrew/bin/browse`, `/usr/local/bin/browse`), then PATH lookup, then local build fallback (`~/.config/browse/dist/browse`). All references to gstack skill paths were removed entirely.

## Telemetry and update checks removed

`gstack-telemetry` and `gstack-update-check` integrations were dropped. These depend on monorepo infrastructure that doesn't exist in the standalone package. The corresponding test files were deleted rather than stubbed — they tested something that no longer applies.

## Two-binary Homebrew distribution

The release produces two separate Homebrew formulae: `browse` (core) and `browse-agent` (optional Claude add-on). Keeping them separate avoids pulling in the Anthropic SDK for users who don't need it, and allows the two to version independently.

## Chromium provisioned via Playwright post-install hook

The Homebrew formula runs `browse setup-chromium` in `post_install`, which delegates to `playwright install chromium`. This keeps the release tarball small (no bundled browser) and ensures the Playwright cache is set up consistently. A guard checks for `bun` in PATH before running, failing gracefully if it's absent.

## SKILL.md is hand-written, not templated

The monorepo uses a templated SKILL.md with a generated preamble block for version injection and multi-tool metadata. The standalone SKILL.md is hand-written and version-locked in source. Simpler to maintain, easier for contributors to read, and makes no assumptions about gstack tooling.
