#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
OUTPUT_DIR="$SCRIPT_DIR/output"
REWRITE_CERTS=false

usage() {
  cat >&2 <<'EOF'
Usage: generate-certs.sh [--rewrite|-r]

Regenerate certificates in security/output if the directory is empty or if --rewrite is supplied.
EOF
}

while (($#)); do
  case "$1" in
    -r|--rewrite|--rewrite-certs)
      REWRITE_CERTS=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

if ! { command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; } && ! { command -v podman >/dev/null 2>&1 && podman compose version >/dev/null 2>&1; }; then
  echo "docker or podman compose is required to run the certificate generator" >&2
  exit 1
fi

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_BIN=(docker compose)
else
  COMPOSE_BIN=(podman compose)
fi

if [ -d "$OUTPUT_DIR" ] && [ -n "$(find "$OUTPUT_DIR" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ] && [ "$REWRITE_CERTS" != true ]; then echo "Certificates already exist in $OUTPUT_DIR. Use --rewrite to regenerate them."; fi

STEP_CERT_ARGS=(run --rm)
if [ "$REWRITE_CERTS" = true ]; then
  STEP_CERT_ARGS+=(-e REWRITE_CERTS=1)
fi
STEP_CERT_ARGS+=(step-cert)

"${COMPOSE_BIN[@]}" -f "$SCRIPT_DIR/docker-compose.security.yaml" "${STEP_CERT_ARGS[@]}"
"${COMPOSE_BIN[@]}" -f "$SCRIPT_DIR/docker-compose.security.yaml" run --rm openssl-pfx

echo "Generated certificates in $SCRIPT_DIR/output"