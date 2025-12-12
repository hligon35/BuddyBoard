#!/usr/bin/env bash
set -euo pipefail

if [ -z "${KEY_ID-}" ] || [ -z "${ISSUER_ID-}" ] || [ -z "${P8_FILE-}" ]; then
  echo "Usage: KEY_ID=... ISSUER_ID=... P8_FILE=path/to/key.p8 $0"
  exit 1
fi

if [ ! -f "$P8_FILE" ]; then
  echo "p8 file not found: $P8_FILE"
  exit 1
fi

python3 - <<PY > appstore_connect.json
import json, os
key = open(os.environ['P8_FILE'], 'r', encoding='utf-8').read()
out = {
  'keyId': os.environ['KEY_ID'],
  'issuerId': os.environ['ISSUER_ID'],
  'key': key
}
print(json.dumps(out))
PY

echo "Wrote ./appstore_connect.json (use this locally or add to GitHub Secrets as APP_STORE_CONNECT_JSON)"
