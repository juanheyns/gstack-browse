#!/usr/bin/env bash
# Sync raw upstream files from garrytan/gstack into the vendor branch.
#
# Usage:
#   scripts/sync-upstream.sh --check            # show what changed
#   scripts/sync-upstream.sh --apply <SHA>      # update vendor to <SHA>
#
# See UPSTREAM.md for the full workflow.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
UPSTREAM_REMOTE="upstream"
UPSTREAM_REPO="https://github.com/garrytan/gstack.git"

# ── Helpers ────────────────────────────────────────────────────────────────

die() { echo "error: $*" >&2; exit 1; }

ensure_remote() {
  if ! git -C "$REPO_DIR" remote get-url "$UPSTREAM_REMOTE" &>/dev/null; then
    echo "Adding remote '$UPSTREAM_REMOTE' → $UPSTREAM_REPO"
    git -C "$REPO_DIR" remote add "$UPSTREAM_REMOTE" "$UPSTREAM_REPO"
  fi
}

fetch_upstream() {
  echo "Fetching $UPSTREAM_REMOTE..."
  git -C "$REPO_DIR" fetch "$UPSTREAM_REMOTE" --quiet
}

current_branch() {
  git -C "$REPO_DIR" rev-parse --abbrev-ref HEAD
}

require_clean() {
  if ! git -C "$REPO_DIR" diff --quiet || ! git -C "$REPO_DIR" diff --cached --quiet; then
    die "Working tree is dirty. Commit or stash changes before syncing."
  fi
}

# ── File map ───────────────────────────────────────────────────────────────
# Each entry is "upstream_path:local_path[:flag]"
# flag "surgical" = file has surgical patches beyond mechanical substitutions

declare -a FILE_MAP=(
  "browse/src/activity.ts:src/activity.ts"
  "browse/src/browser-manager.ts:src/browser-manager.ts:surgical"
  "browse/src/buffers.ts:src/buffers.ts"
  "browse/src/bun-polyfill.cjs:src/bun-polyfill.cjs"
  "browse/src/cdp-inspector.ts:src/cdp-inspector.ts"
  "browse/src/cli.ts:src/cli.ts:surgical"
  "browse/src/commands.ts:src/commands.ts"
  "browse/src/config.ts:src/config.ts"
  "browse/src/cookie-import-browser.ts:src/cookie-import-browser.ts"
  "browse/src/cookie-picker-routes.ts:src/cookie-picker-routes.ts"
  "browse/src/cookie-picker-ui.ts:src/cookie-picker-ui.ts"
  "browse/src/find-browse.ts:src/find-browse.ts:surgical"
  "browse/src/meta-commands.ts:src/meta-commands.ts"
  "browse/src/platform.ts:src/platform.ts"
  "browse/src/read-commands.ts:src/read-commands.ts"
  "browse/src/server.ts:src/server.ts:surgical"
  "browse/src/sidebar-agent.ts:src/sidebar-agent.ts:surgical"
  "browse/src/sidebar-utils.ts:src/sidebar-utils.ts"
  "browse/src/snapshot.ts:src/snapshot.ts"
  "browse/src/url-validation.ts:src/url-validation.ts"
  "browse/src/write-commands.ts:src/write-commands.ts"
  "browse/scripts/build-node-server.sh:scripts/build-node-server.sh"
  "browse/SKILL.md:SKILL.md"
  "LICENSE:LICENSE"
  # bin/ → scripts/ (moved upstream)
  "browse/bin/find-browse:scripts/find-browse"
  "browse/bin/remote-slug:scripts/remote-slug"
  # monorepo root shared files
  "extension/background.js:extension/background.js"
  "extension/content.css:extension/content.css"
  "extension/content.js:extension/content.js"
  "extension/inspector.css:extension/inspector.css"
  "extension/inspector.js:extension/inspector.js"
  "extension/manifest.json:extension/manifest.json"
  "extension/popup.html:extension/popup.html"
  "extension/popup.js:extension/popup.js"
  "extension/sidepanel.css:extension/sidepanel.css"
  "extension/sidepanel.html:extension/sidepanel.html"
  "extension/sidepanel.js:extension/sidepanel.js"
  "extension/icons/icon-16.png:extension/icons/icon-16.png"
  "extension/icons/icon-48.png:extension/icons/icon-48.png"
  "extension/icons/icon-128.png:extension/icons/icon-128.png"
  "lib/worktree.ts:lib/worktree.ts"
  # tests
  "browse/test/activity.test.ts:test/activity.test.ts"
  "browse/test/adversarial-security.test.ts:test/adversarial-security.test.ts:surgical"
  "browse/test/browser-manager-unit.test.ts:test/browser-manager-unit.test.ts"
  "browse/test/bun-polyfill.test.ts:test/bun-polyfill.test.ts"
  "browse/test/commands.test.ts:test/commands.test.ts"
  "browse/test/compare-board.test.ts:test/compare-board.test.ts:surgical"
  "browse/test/config.test.ts:test/config.test.ts"
  "browse/test/cookie-import-browser.test.ts:test/cookie-import-browser.test.ts"
  "browse/test/cookie-picker-routes.test.ts:test/cookie-picker-routes.test.ts"
  "browse/test/file-drop.test.ts:test/file-drop.test.ts"
  "browse/test/find-browse.test.ts:test/find-browse.test.ts"
  "browse/test/findport.test.ts:test/findport.test.ts"
  "browse/test/gstack-config.test.ts:test/gstack-config.test.ts"
  "browse/test/gstack-update-check.test.ts:test/gstack-update-check.test.ts"
  "browse/test/handoff.test.ts:test/handoff.test.ts"
  "browse/test/path-validation.test.ts:test/path-validation.test.ts"
  "browse/test/platform.test.ts:test/platform.test.ts"
  "browse/test/server-auth.test.ts:test/server-auth.test.ts"
  "browse/test/sidebar-agent-roundtrip.test.ts:test/sidebar-agent-roundtrip.test.ts"
  "browse/test/sidebar-agent.test.ts:test/sidebar-agent.test.ts"
  "browse/test/sidebar-integration.test.ts:test/sidebar-integration.test.ts"
  "browse/test/sidebar-security.test.ts:test/sidebar-security.test.ts"
  "browse/test/sidebar-unit.test.ts:test/sidebar-unit.test.ts"
  "browse/test/sidebar-ux.test.ts:test/sidebar-ux.test.ts:surgical"
  "browse/test/snapshot.test.ts:test/snapshot.test.ts"
  "browse/test/state-ttl.test.ts:test/state-ttl.test.ts"
  "browse/test/test-server.ts:test/test-server.ts"
  "browse/test/url-validation.test.ts:test/url-validation.test.ts"
  "browse/test/watch.test.ts:test/watch.test.ts"
  # fixtures
  "browse/test/fixtures/basic.html:test/fixtures/basic.html"
  "browse/test/fixtures/cursor-interactive.html:test/fixtures/cursor-interactive.html"
  "browse/test/fixtures/dialog.html:test/fixtures/dialog.html"
  "browse/test/fixtures/empty.html:test/fixtures/empty.html"
  "browse/test/fixtures/forms.html:test/fixtures/forms.html"
  "browse/test/fixtures/iframe.html:test/fixtures/iframe.html"
  "browse/test/fixtures/network-idle.html:test/fixtures/network-idle.html"
  "browse/test/fixtures/qa-eval-checkout.html:test/fixtures/qa-eval-checkout.html"
  "browse/test/fixtures/qa-eval-spa.html:test/fixtures/qa-eval-spa.html"
  "browse/test/fixtures/qa-eval.html:test/fixtures/qa-eval.html"
  "browse/test/fixtures/responsive.html:test/fixtures/responsive.html"
  "browse/test/fixtures/snapshot.html:test/fixtures/snapshot.html"
  "browse/test/fixtures/spa.html:test/fixtures/spa.html"
  "browse/test/fixtures/states.html:test/fixtures/states.html"
  "browse/test/fixtures/upload.html:test/fixtures/upload.html"
)

copy_upstream_file() {
  local upstream_path="$1"
  local local_path="$2"
  local target="$REPO_DIR/$local_path"

  # Try to get file from git upstream ref
  local content
  if content=$(git -C "$REPO_DIR" show "$TARGET_SHA:$upstream_path" 2>/dev/null); then
    mkdir -p "$(dirname "$target")"
    printf '%s' "$content" > "$target"
    # Preserve executable bit for scripts
    case "$upstream_path" in
      browse/bin/*|browse/scripts/*.sh)
        chmod +x "$target" ;;
    esac
    return 0
  fi

  # Fallback: check alternate location (browse/bin → browse/scripts for older refs)
  local alt_path="${upstream_path/browse\/bin\//browse\/scripts\/}"
  if [[ "$alt_path" != "$upstream_path" ]] && \
     content=$(git -C "$REPO_DIR" show "$TARGET_SHA:$alt_path" 2>/dev/null); then
    mkdir -p "$(dirname "$target")"
    printf '%s' "$content" > "$target"
    chmod +x "$target"
    return 0
  fi

  echo "  WARN: $upstream_path not found at $TARGET_SHA (skipped)"
  return 1
}

# ── --check mode ───────────────────────────────────────────────────────────

cmd_check() {
  ensure_remote
  fetch_upstream

  local upstream_head
  upstream_head=$(git -C "$REPO_DIR" rev-parse "$UPSTREAM_REMOTE/main")
  local current_ref
  current_ref=$(cat "$REPO_DIR/UPSTREAM_REF" 2>/dev/null || echo "(none)")

  echo ""
  echo "Current vendor: $current_ref"
  echo "Upstream HEAD:  $upstream_head"
  echo ""

  if [[ "$upstream_head" == "$current_ref" ]]; then
    echo "Already up to date."
    return 0
  fi

  TARGET_SHA="$upstream_head"

  echo "Changed files:"
  local changed=0
  local surgical=0

  for entry in "${FILE_MAP[@]}"; do
    IFS=: read -r upstream_path local_path flag <<< "$entry"
    flag="${flag:-}"

    # Get upstream content at new SHA
    local new_content
    new_content=$(git -C "$REPO_DIR" show "$TARGET_SHA:$upstream_path" 2>/dev/null || true)

    # Get vendor content
    local vendor_content
    vendor_content=$(git -C "$REPO_DIR" show "vendor:$local_path" 2>/dev/null || true)

    if [[ "$new_content" != "$vendor_content" ]]; then
      local label=""
      [[ "$flag" == "surgical" ]] && label=" [SURGICAL PATCH — review diff carefully]"
      echo "  CHANGED  $local_path$label"
      changed=$((changed + 1))
      [[ "$flag" == "surgical" ]] && surgical=$((surgical + 1))
    fi
  done

  if [[ $changed -eq 0 ]]; then
    echo "  (no mapped files changed)"
  else
    echo ""
    echo "  $changed file(s) changed, $surgical require surgical patch review"
    echo ""
    echo "To apply: scripts/sync-upstream.sh --apply $upstream_head"
  fi
}

# ── --apply mode ───────────────────────────────────────────────────────────

cmd_apply() {
  local target_sha="$1"
  [[ -z "$target_sha" ]] && die "Usage: sync-upstream.sh --apply <SHA>"

  ensure_remote
  fetch_upstream

  # Validate SHA
  git -C "$REPO_DIR" cat-file -e "${target_sha}^{commit}" 2>/dev/null \
    || die "Unknown commit: $target_sha"

  TARGET_SHA="$target_sha"

  require_clean

  local orig_branch
  orig_branch=$(current_branch)

  [[ "$orig_branch" == "vendor" ]] && die "Already on vendor branch. Check out main first."

  echo "Switching to vendor branch..."
  git -C "$REPO_DIR" checkout vendor

  echo "Copying upstream files at $target_sha..."
  for entry in "${FILE_MAP[@]}"; do
    IFS=: read -r upstream_path local_path flag <<< "$entry"
    copy_upstream_file "$upstream_path" "$local_path"
  done

  echo "$target_sha" > "$REPO_DIR/UPSTREAM_REF"
  git -C "$REPO_DIR" add -A

  if git -C "$REPO_DIR" diff --cached --quiet; then
    echo "No changes — vendor already matches $target_sha"
    git -C "$REPO_DIR" checkout "$orig_branch"
    return 0
  fi

  local short_sha="${target_sha:0:12}"
  git -C "$REPO_DIR" commit -m "$(cat <<EOF
vendor: update to garrytan/gstack@${short_sha}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"

  echo "Switching back to $orig_branch..."
  git -C "$REPO_DIR" checkout "$orig_branch"

  echo ""
  echo "Vendor updated. Now rebase your patches:"
  echo ""
  echo "  git rebase vendor"
  echo ""
  echo "Then verify:"
  echo ""
  echo "  bunx tsc --noEmit"
  echo "  bun test"
  echo ""
  echo "See UPSTREAM.md for guidance on resolving surgical patch conflicts."
}

# ── Entry point ────────────────────────────────────────────────────────────

TARGET_SHA=""

case "${1:-}" in
  --check)
    cmd_check
    ;;
  --apply)
    cmd_apply "${2:-}"
    ;;
  *)
    echo "Usage:"
    echo "  scripts/sync-upstream.sh --check"
    echo "  scripts/sync-upstream.sh --apply <UPSTREAM_SHA>"
    echo ""
    echo "See UPSTREAM.md for the full workflow."
    exit 1
    ;;
esac
