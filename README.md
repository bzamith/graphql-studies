# PhotoShare

A simple application for learning GraphQL, based on the PhotoShare project from *Introduction to GraphQL* by Eve Porcello and Alex Banks.

The server will be built with Apollo Server. GraphQL Playground will be used as a separate client to explore the schema and send GraphQL operations during development.

## Requirements

- macOS, Homebrew, Node.js, and npm

## Installation

From the project root, run:

```bash
./scripts/install-dependencies.sh
```

The script creates a `package.json` if one does not already exist, then installs the server dependencies.

## Dependencies

- `@apollo/server` (version 5): GraphQL server.
- `dotenv`: loads local environment variables from `.env`.
- `graphql`: JavaScript implementation of the GraphQL specification.
- `graphql-custom-types`: reusable custom scalars, including `DateTime`.
- `mongodb`: official MongoDB Node.js driver.
- `nodemon`: restarts the server when JavaScript, JSON, or GraphQL files change.

## Local MongoDB

Install MongoDB Community Edition with Homebrew. The MongoDB formula also installs `mongosh` and the MongoDB Database Tools, so no separate MongoDB-related Homebrew packages are needed.

If the Xcode Command Line Tools are not installed, install them first:

```bash
xcode-select --install
```

```bash
brew tap mongodb/brew
brew trust mongodb/brew
brew update
brew install mongodb-community@8.0
```

Start MongoDB as a background service and connect with the shell:

```bash
brew services start mongodb-community@8.0
mongosh
```

Stop the service when you are done:

```bash
brew services stop mongodb-community@8.0
```

Copy the example environment file before starting the API:

```bash
cp .env.example .env
```

`DB_HOST` should contain the MongoDB connection URI. The example points to the local `photoshare` database. Keep `.env` private; it is ignored by Git.

Load the sample users, photos, and tags with idempotent upserts, then start the API:

```bash
npm run seed
npm start
```

The seed command updates or inserts only the sample records by their IDs; it does not clear the collections.

If Homebrew is not installed, follow the [Homebrew installation guide](https://brew.sh/). MongoDB 8.0 Community Edition requires macOS 14 or later.

> GraphQL Playground is a retired IDE and does not receive support or security updates. Apollo Server no longer bundles it; run Playground separately and connect it to your local GraphQL endpoint. Apollo Server provides Apollo Sandbox as its default browser landing page.

## Running the application

Run `npm start` to start it with automatic restarts. Open the GraphQL endpoint URL in a browser to access Apollo Sandbox, or connect a separate GraphQL Playground client.

## Learning goals

This repository follows the gradual development of PhotoShare to practice GraphQL concepts such as schemas, types, queries, mutations, and resolvers.
