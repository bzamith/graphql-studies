#!/usr/bin/env sh

set -eu

cd "$(dirname "$0")/.."

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm was not found. Install Node.js with npm and try again." >&2
  exit 1
fi

if [ ! -f package.json ]; then
  npm init -y
fi

npm install '@apollo/server@^5' 'graphql@^16.11' dotenv graphql-custom-types mongodb
npm install --save-dev nodemon
