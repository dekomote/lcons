#!/usr/bin/env bash

PORT="${1:-8000}"

echo "Starting local server on http://localhost:$PORT"
echo "Press Ctrl+C to stop."
echo ""
python3 -m http.server -b 127.0.0.1 "$PORT"
