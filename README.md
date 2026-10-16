# PhotoShare

PhotoShare is a small learning project based on the application in *Introduction to GraphQL* by Eve Porcello and Alex Banks. It uses Apollo Server, GraphQL, and MongoDB to explore schemas, resolvers, queries, mutations, and GitHub OAuth.

## Requirements

- macOS 14 or later
- Homebrew
- Node.js and npm

## Install

Run the setup script from the project root:

```bash
./scripts/install-dependencies.sh
```

The script installs MongoDB Community 8.0 and the Node.js dependencies, starts MongoDB as a background service, and creates `.env` from `.env.example` if it does not exist. It does not install Node.js. Add your GitHub OAuth App credentials to `.env` before using GitHub authentication. The `.env` file is ignored by Git.

### Install MongoDB manually

Use these commands instead of the setup script if you want to install MongoDB yourself. The official MongoDB Homebrew tap also installs `mongosh` and the MongoDB Database Tools.

```bash
brew tap mongodb/brew
brew trust mongodb/brew
brew update
brew install mongodb-community@8.0
brew services start mongodb-community@8.0
```

Check that MongoDB is responding:

```bash
mongosh --eval 'db.runCommand({ ping: 1 })'
```

To stop the background service:

```bash
brew services stop mongodb-community@8.0
```

If Homebrew requests the Xcode Command Line Tools, install them with `xcode-select --install`. MongoDB 8.0 requires macOS 14 or later. See the [official MongoDB macOS installation guide](https://www.mongodb.com/docs/v8.0/tutorial/install-mongodb-on-os-x/) and [Homebrew installation guide](https://brew.sh/).

## Configure and run

If `.env` was not created by the setup script, copy the example:

```bash
cp .env.example .env
```

Set `DB_HOST` to your MongoDB connection URI. The example uses the local `photoshare` database. Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` from your GitHub OAuth App to `.env`. Keep the client secret private; do not put it in browser requests or commit it.

Seed the sample users, photos, and tags, then start the server:

```bash
npm run seed
npm start
```

The seed script uses upserts for the sample records, so rerunning it updates those records without clearing the collections. Open the URL printed by the server to use Apollo Sandbox. GraphQL Playground is a separate client and can be pointed at the same GraphQL endpoint; Apollo Server no longer bundles it.

## GitHub OAuth

With `GITHUB_CLIENT_ID` configured in `.env`, open GitHub's authorization page:

```bash
npm run auth:github
```

Approve access in the browser. GitHub redirects to the callback URL configured for your OAuth App with a temporary `code` query parameter. Copy that code and run this mutation in GraphQL Playground, replacing `<RETURNED_BY_URL>` with its value:

```graphql
mutation {
  githubAuth(code: "<RETURNED_BY_URL>") {
    token
    user {
      githubLogin
      name
      avatar
    }
  }
}
```

Copy `data.githubAuth.token` from the result. In GraphQL Playground's **HTTP HEADERS** panel, add it for subsequent requests:

```json
{
  "Authorization": "Bearer <TOKEN>"
}
```

Replace `<TOKEN>` with the returned value. The server validates the token with GitHub and uses the associated user for the request context.

With the header set, the `me` query returns the signed-in user, or `null` when no valid token is provided:

```graphql
query {
  me {
    githubLogin
    name
    avatar
  }
}
```

`postPhoto` also uses this current user as the photo's author and returns an error when the request is unauthenticated.

For local testing, you can create fake users and authenticate as one of them:

```graphql
mutation {
  addFakeUsers(count: 3) {
    githubLogin
    name
  }
}
```

Use one of the returned `githubLogin` values with `fakeUserAuth`, then put its returned token in the **HTTP HEADERS** panel using the same `Authorization: Bearer <TOKEN>` format. Fake-user tokens are for learning and local testing; they are not GitHub credentials.

```graphql
mutation {
  fakeUserAuth(githubLogin: "<GITHUB_LOGIN>") {
    token
    user {
      githubLogin
      name
      avatar
    }
  }
}
```

## Dependencies

- `@apollo/server`: GraphQL server.
- `graphql`: GraphQL implementation for JavaScript.
- `graphql-custom-types`: custom scalar types, including `DateTime`.
- `mongodb`: official MongoDB Node.js driver.
- `dotenv`: loads environment variables from `.env`.
- `nodemon`: restarts the server when JavaScript, JSON, or GraphQL files change.
