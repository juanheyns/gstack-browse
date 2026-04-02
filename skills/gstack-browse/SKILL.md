---
name: gstack-browse
description: Persistent headless browser for AI agents — navigate, read, interact, snapshot
version: 1.0.0
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

# browse

Fast headless browser automation CLI. One command per call. ~100ms per command.
Use for: verifying deployments, testing forms, taking screenshots, diffing pages, asserting UI state.

## Setup check

```bash
# Verify browse is installed and Chromium is ready
browse --version
# If Chromium is missing:
browse setup-chromium
```

## Quick reference

| Command | Description |
|---|---|
| `browse goto <url>` | Navigate to URL |
| `browse back` / `browse forward` | Browser history |
| `browse reload` | Reload current page |
| `browse url` | Print current URL |
| `browse text [sel]` | Extract visible text (all or selector) |
| `browse html [sel]` | Extract raw HTML |
| `browse links` | List all links with text and href |
| `browse forms` | List all forms and their fields |
| `browse accessibility` | Accessibility tree |
| `browse snapshot` | Structured snapshot with ref labels |
| `browse snapshot -i` | Snapshot with screenshot |
| `browse snapshot -a` | Annotated screenshot with ref labels |
| `browse snapshot -D` | Diff against previous snapshot |
| `browse screenshot [path]` | Full-page screenshot |
| `browse screenshot --viewport` | Viewport-only screenshot |
| `browse screenshot --clip x,y,w,h` | Clipped screenshot |
| `browse pdf [path]` | Save page as PDF |
| `browse responsive [prefix]` | Screenshots at common breakpoints |
| `browse click <sel>` | Click element |
| `browse fill <sel> <value>` | Fill input field |
| `browse select <sel> <value>` | Select dropdown option |
| `browse hover <sel>` | Hover element |
| `browse type <text>` | Type text at current focus |
| `browse press <key>` | Press keyboard key (e.g. Enter, Tab) |
| `browse scroll [sel]` | Scroll page or element into view |
| `browse wait <sel>` | Wait for selector to appear |
| `browse wait --networkidle` | Wait for network to go idle |
| `browse wait --load` | Wait for load event |
| `browse viewport <WxH>` | Set viewport size (e.g. 1280x800) |
| `browse upload <sel> <file>` | Upload file via input |
| `browse js <expr>` | Evaluate JavaScript expression |
| `browse eval <file>` | Execute JS from file |
| `browse css <sel> <prop>` | Get computed CSS property |
| `browse attrs <sel>` | Get all attributes of element |
| `browse is visible <sel>` | Assert element is visible |
| `browse is hidden <sel>` | Assert element is hidden |
| `browse is enabled <sel>` | Assert element is enabled |
| `browse is disabled <sel>` | Assert element is disabled |
| `browse is checked <sel>` | Assert checkbox is checked |
| `browse is editable <sel>` | Assert element is editable |
| `browse is focused <sel>` | Assert element has focus |
| `browse console` | Get browser console logs |
| `browse console --clear` | Clear console log buffer |
| `browse console --errors` | Get only error entries |
| `browse network` | Get network request log |
| `browse network --clear` | Clear network log buffer |
| `browse dialog` | Get dialog log (alerts, confirms) |
| `browse dialog --clear` | Clear dialog log |
| `browse dialog-accept [text]` | Auto-accept next dialog |
| `browse dialog-dismiss` | Auto-dismiss next dialog |
| `browse cookies` | Get all cookies |
| `browse cookie <n>=<v>` | Set a cookie |
| `browse cookie-import <json-file>` | Import cookies from JSON |
| `browse cookie-import-browser [browser]` | Import from local browser |
| `browse storage` | Get localStorage and sessionStorage |
| `browse storage set <k> <v>` | Set a storage key |
| `browse header <name>:<value>` | Set a request header |
| `browse useragent <string>` | Set User-Agent string |
| `browse perf` | Get performance timing metrics |
| `browse tabs` | List open tabs |
| `browse tab <id>` | Switch to tab by ID |
| `browse newtab [url]` | Open a new tab |
| `browse closetab [id]` | Close tab |
| `browse status` | Print server status |
| `browse stop` | Stop the server |
| `browse restart` | Restart the server |
| `browse diff <url1> <url2>` | Diff two URLs side by side |
| `browse chain` | Run multiple commands from stdin JSON |
| `browse handoff` | Export browser state for resumption |
| `browse resume` | Resume from a handoff state |
| `browse connect` | Launch headed Chrome with extension |
| `browse disconnect` | Stop headed mode |
| `browse watch` | Watch for page changes |
| `browse state` | Get full browser state JSON |
| `browse frame <sel>` | Focus an iframe |
| `browse inspect <sel>` | CDP element inspection |
| `browse config get <key>` | Read a config value |
| `browse config set <key> <val>` | Write a config value |
| `browse config list` | List all config values |
| `browse setup-chromium` | Install Chromium via Playwright |

## Common patterns

### Verify a page loaded and contains expected content

```bash
browse goto https://example.com
browse text | grep "Expected heading"
# Or check a specific selector:
browse text h1
```

### Fill a form and submit

```bash
browse goto https://example.com/login
browse fill "#email" "user@example.com"
browse fill "#password" "secret"
browse click "[type=submit]"
browse wait --networkidle
browse url  # Confirm redirect
```

### Take a screenshot as evidence

```bash
browse goto https://example.com
browse screenshot /tmp/before.png
# ... make changes ...
browse screenshot /tmp/after.png
```

### Snapshot for structured reading with refs

```bash
browse goto https://example.com
browse snapshot
# Output includes @e1, @e2... refs for interactive elements
browse click @e3   # Click the third ref
browse fill @e4 "value"
```

### Diff a page before and after an action

```bash
browse goto https://example.com/cart
browse snapshot -D  # First run: establishes baseline
browse click "#add-to-cart"
browse wait --networkidle
browse snapshot -D  # Second run: shows diff
```

### Assert element state

```bash
browse is visible "#submit-button"
browse is disabled "#submit-button"
browse is checked "#agree-terms"
```

### Check for JavaScript errors

```bash
browse goto https://example.com
browse console --errors
```

### Multi-tab workflow

```bash
browse newtab https://example.com/page-b
browse tabs       # List tab IDs
browse tab 1      # Switch back to tab 1
browse tab 2      # Switch to tab 2
```

### Responsive layout check

```bash
browse goto https://example.com
browse responsive /tmp/responsive  # Saves mobile/tablet/desktop screenshots
```

### Import cookies from Chrome for authenticated testing

```bash
browse cookie-import-browser chrome --domain example.com
browse goto https://example.com/dashboard
```

## Ref system

After running `browse snapshot`, interactive elements are labeled with `@e1`, `@e2`, ... These refs are valid until the next `snapshot` call. Use them as selectors in any command:

```bash
browse snapshot
browse click @e3
browse fill @e4 "search term"
browse hover @e1
```

With `snapshot -C` (cursor-interactive mode), non-ARIA clickable elements get `@c1`, `@c2`, ... refs.

## Snapshot flags

| Flag | Long form | Meaning |
|---|---|---|
| `-i` | `--screenshot` | Include screenshot in output |
| `-a` | `--annotate` | Annotated screenshot with ref labels overlay |
| `-D` | `--diff` | Diff against previous snapshot |
| `-c` | `--compact` | Compact output (fewer details) |
| `-d N` | `--depth N` | Accessibility tree depth limit |
| `-s sel` | `--selector sel` | Snapshot only within selector |
| `-o path` | `--output path` | Save snapshot to file |
| `-C` | `--cursor-interactive` | Find non-ARIA clickable elements |

## Session management

browse runs a persistent background server. It starts automatically on first command and shuts down after 30 minutes of inactivity (configurable via `browse config set idle_timeout 3600`).

```bash
browse status    # Check server health
browse stop      # Stop the server
browse restart   # Restart the server
```

State file: `.browse/browse.json` in the current git project root.
Logs: `.browse/browse-{console,network,dialog}.log`

## browse-agent (optional)

The `browse-agent` add-on enables a Claude-powered sidebar in headed mode. It requires the `claude` CLI in PATH.

```bash
brew install juanheyns/gstack-browse/browse-agent
browse connect  # Launch headed Chrome + start sidebar agent
```
