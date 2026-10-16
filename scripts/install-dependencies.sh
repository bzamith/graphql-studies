#!/usr/bin/env sh

set -eu

cd "$(dirname "$0")/.."

if ! command -v brew >/dev/null 2>&1; then
  echo "Error: Homebrew was not found. Install Homebrew and try again." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm was not found. Install Node.js with npm and try again." >&2
  exit 1
fi

brew tap mongodb/brew
brew trust mongodb/brew
brew update
brew install mongodb-community@8.0
brew services start mongodb-community@8.0

if [ ! -f package.json ]; then
  npm init -y
fi

npm install '@apollo/server@^5' 'graphql@^16.11' dotenv graphql-custom-types mongodb
npm install --save-dev nodemon

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Add your GitHub OAuth credentials before using githubAuth."
fi

echo "Dependencies installed and MongoDB service started. Run 'npm run seed' and then 'npm start'."
