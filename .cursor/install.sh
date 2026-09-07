#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for the tech-demos monorepo.
#
# This repo is "Bun only" (see AGENTS.md): Bun is the runtime, package manager,
# and script runner. Individual demos under apps/<slug>/ are self-contained and
# install their own dependencies, so this script only guarantees that a pinned
# Bun toolchain is present and reachable from every (login or non-login) shell.
set -euo pipefail

BUN_VERSION="1.4.2"
export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"

install_bun() {
  curl -fsSL https://bun.sh/install | bash -s "bun-v${BUN_VERSION}"
}

current_bun_version() {
  "$BUN_INSTALL/bin/bun" --version 2>/dev/null || true
}

if [ "$(current_bun_version)" != "$BUN_VERSION" ]; then
  install_bun
fi

export PATH="$BUN_INSTALL/bin:$PATH"

# Make bun/bunx reachable from non-interactive shells (which do not source
# ~/.bashrc) by linking into a directory that is always on PATH.
if command -v sudo >/dev/null 2>&1 && [ -d /usr/local/bin ]; then
  sudo ln -sf "$BUN_INSTALL/bin/bun" /usr/local/bin/bun
  sudo ln -sf "$BUN_INSTALL/bin/bunx" /usr/local/bin/bunx
fi

echo "Bun ready: $(bun --version)"
