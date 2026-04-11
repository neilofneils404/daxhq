#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-$(python3 - <<'PY'
import socket

sock = socket.socket()
sock.bind(("127.0.0.1", 0))
print(sock.getsockname()[1])
sock.close()
PY
)}"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT

cd "${ROOT_DIR}"

python3 -m http.server "${PORT}" --bind "${HOST}" >/dev/null 2>&1 &
SERVER_PID=$!

for _ in {1..40}; do
  if curl -sf "http://${HOST}:${PORT}/social-preview.html" >/dev/null; then
    break
  fi

  sleep 0.25
done

playwright screenshot \
  --browser chromium \
  --viewport-size "1200,630" \
  --wait-for-selector 'body[data-ready="true"]' \
  --wait-for-timeout 400 \
  "http://${HOST}:${PORT}/social-preview.html" \
  "${ROOT_DIR}/social-preview.png"

echo "Updated ${ROOT_DIR}/social-preview.png"
