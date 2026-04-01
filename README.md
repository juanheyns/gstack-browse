# browse

Persistent headless browser CLI for AI agents. Navigate, interact, snapshot, and assert page state — one shell command at a time. Built on Playwright + Bun.

## Install

```bash
brew tap juanheyns/gstack-browse
brew install browse
```

## Quick start

```bash
browse goto https://example.com
browse snapshot
browse click @e1
browse text
browse screenshot /tmp/result.png
```

## Commands

See [SKILL.md](./SKILL.md) for the full command reference (60+ commands) with examples.

## browse-agent (optional Claude add-on)

`browse-agent` adds a Claude-powered sidebar to headed mode. It requires the `claude` CLI in PATH.

```bash
brew install juanheyns/gstack-browse/browse-agent
browse connect
```

When installed, `browse connect` launches headed Chrome with the extension and auto-starts the sidebar agent. Without `browse-agent`, the headed mode still works — the sidebar panel is present but unresponsive.

## Chrome extension

The Chrome extension enables headed mode with a side panel, activity feed, and CSS inspector. It is bundled with browse and loaded automatically when you run `browse connect`.

To load it manually:

1. Open Chrome → `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the `extension/` directory from this repo

The extension communicates only with the local browse server via WebSocket. It makes no external network requests.

## Building from source

```bash
git clone https://github.com/juanheyns/gstack-browse.git
cd gstack-browse
./setup
dist/browse --help
```

Requires [bun](https://bun.sh) >= 1.0.0.

## Configuration

```bash
browse config set idle_timeout 3600     # Auto-shutdown after 1 hour (default: 1800)
browse config set headed true           # Always launch in headed mode
browse config set chromium_profile /path/to/profile
```

Config is stored at `~/.config/browse/config.json`.

## Upgrade

```bash
brew upgrade browse
```

## Note for existing gstack users

If you already have gstack installed, browse is available at `~/.claude/skills/gstack/browse/dist/browse`. This standalone package is for using browse independently of gstack. Both installations can coexist — they use separate state files (`.gstack/` for gstack, `.browse/` for this package).

## License

MIT
