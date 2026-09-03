#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: ./docker-control.sh [options]

Options:
  -p, --profile accc|noauth|panva   Choose the mock setup to manage.
  --build-certs                     Generate the certificates via security-new/generate-certs.sh.
  --build-images                    Build the selected docker images.
  --up                              Bring the selected stack up in detached mode.
  --down                            Stop and remove the selected stack.
                                  --up and --down are mutually exclusive.
  -y, --yes                        Accept prompts automatically.
  -h, --help                        Show this help.

Examples:
  ./docker-control.sh --profile accc --build-certs --build-images --up
  ./docker-control.sh --profile noauth --up
  ./docker-control.sh
EOF
}

confirm() {
  local prompt="$1"
  local default_answer="${2:-n}"
  local response

  while true; do
    if [[ "$default_answer" == "y" ]]; then
      printf '%s [Y/n]: ' "$prompt"
    else
      printf '%s [y/N]: ' "$prompt"
    fi

    read -r response || response=""
    response="${response:-$default_answer}"
    response="${response,,}"

    case "$response" in
      y|yes)
        return 0
        ;;
      n|no)
        return 1
        ;;
      *)
        echo "Please answer yes or no."
        ;;
    esac
  done
}

resolve_compose() {
  if docker compose version >/dev/null 2>&1; then
    COMPOSE_BIN=(docker compose)
  elif podman compose version >/dev/null 2>&1; then
    COMPOSE_BIN=(podman compose)
  else
    echo "Neither docker compose nor podman compose is available."
    exit 1
  fi
}

PROFILE=""
BUILD_CERTS=0
BUILD_IMAGES=0
UP=0
DOWN=0
AUTO_YES=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -p|--profile)
      PROFILE="${2:-}"
      shift 2
      ;;
    --build-certs)
      BUILD_CERTS=1
      shift
      ;;
    --build-images)
      BUILD_IMAGES=1
      shift
      ;;
    --up)
      UP=1
      shift
      ;;
    --down)
      DOWN=1
      shift
      ;;
    -y|--yes)
      AUTO_YES=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

resolve_compose

if [[ -z "$PROFILE" ]]; then
  if [[ "$BUILD_CERTS" -eq 1 && "$BUILD_IMAGES" -eq 0 && "$UP" -eq 0 && "$DOWN" -eq 0 ]]; then
    PROFILE="accc"
  else
    PROFILE="accc"
    if [[ "$AUTO_YES" -eq 0 ]]; then
      printf 'Choose setup [accc/noauth/panva] (default: accc): '
      read -r selected_profile || selected_profile=""
      if [[ -n "$selected_profile" ]]; then
        PROFILE="$selected_profile"
      fi
    fi
  fi
fi
PROFILE="${PROFILE,,}"

case "$PROFILE" in
  accc)
    COMPOSE_FILE="$DOCKER_DIR/compose/docker-compose.yaml"
    ;;
  noauth)
    COMPOSE_FILE="$DOCKER_DIR/compose/docker-compose.noauth.yaml"
    ;;
  panva)
    COMPOSE_FILE="$DOCKER_DIR/compose/docker-compose.panva.yaml"
    ;;
  *)
    echo "Unsupported profile: $PROFILE"
    usage
    exit 1
    ;;
 esac

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose file not found: $COMPOSE_FILE"
  exit 1
fi

if [[ "$UP" -eq 1 && "$DOWN" -eq 1 ]]; then
  echo "Please choose either --up or --down, not both."
  usage
  exit 1
fi

if [[ "$BUILD_CERTS" -eq 0 && "$BUILD_IMAGES" -eq 0 && "$UP" -eq 0 && "$DOWN" -eq 0 ]]; then
  if [[ "$AUTO_YES" -eq 1 ]]; then
    BUILD_CERTS=1
    BUILD_IMAGES=1
    UP=1
  else
    if confirm "Build Docker images" n; then
      BUILD_IMAGES=1
    fi

    if confirm "Bring the selected stack up" y; then
      UP=1
      DOWN=0
    elif confirm "Tear the selected stack down" n; then
      DOWN=1
      UP=0
    else
      UP=0
      DOWN=0
    fi

    if [[ "$BUILD_IMAGES" -eq 1 || "$UP" -eq 1 ]]; then
      if confirm "Generate certificates first" n; then
        BUILD_CERTS=1
      fi
    fi
  fi
fi

if [[ "$DOWN" -eq 1 ]]; then
  echo "Stopping setup: $PROFILE"
  "${COMPOSE_BIN[@]}" -f "$COMPOSE_FILE" down --remove-orphans
fi

if [[ "$BUILD_CERTS" -eq 1 || "$BUILD_IMAGES" -eq 1 ]]; then
  CERT_SCRIPT_PATH="$SCRIPT_DIR/../../security/generate-certs.sh"
  CERT_SCRIPT_ARGS=("$CERT_SCRIPT_PATH")

  if [[ "$BUILD_CERTS" -eq 1 ]]; then
    CERT_SCRIPT_ARGS+=("--rewrite")
  elif [[ "$BUILD_IMAGES" -eq 1 ]]; then
    echo "Certificates will be generated before build because the selected Docker image build requires them."
  fi

  if [[ ! -f "$CERT_SCRIPT_PATH" ]]; then
    echo "Certificate generator not found: $CERT_SCRIPT_PATH"
    exit 1
  fi

  "${CERT_SCRIPT_ARGS[@]}"
fi

if [[ "$BUILD_IMAGES" -eq 1 ]]; then
  echo "Building images for $PROFILE..."
  "${COMPOSE_BIN[@]}" -f "$COMPOSE_FILE" build
fi

if [[ "$UP" -eq 1 ]]; then
  echo "Starting $PROFILE..."
  "${COMPOSE_BIN[@]}" -f "$COMPOSE_FILE" up -d --remove-orphans
fi

if [[ "$DOWN" -eq 0 && "$BUILD_CERTS" -eq 0 && "$BUILD_IMAGES" -eq 0 && "$UP" -eq 0 ]]; then
  echo "No action selected. Use --build-certs for a certificate-only run or --help for usage."
fi
