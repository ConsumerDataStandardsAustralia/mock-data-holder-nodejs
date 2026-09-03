#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
CONTROL_SCRIPT="$SCRIPT_DIR/docker/scripts/docker-control.sh"

if [[ ! -f "$CONTROL_SCRIPT" ]]; then
  echo "Missing Docker control script: $CONTROL_SCRIPT"
  exit 1
fi

if [[ ! -x "$CONTROL_SCRIPT" ]]; then
  echo "The Docker control script is not executable. Run: chmod +x \"$CONTROL_SCRIPT\""
  exit 1
fi

exec "$CONTROL_SCRIPT" "$@"
