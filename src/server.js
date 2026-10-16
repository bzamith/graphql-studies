require('dotenv').config();

const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { MongoClient } = require('mongodb');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { getCurrentUser } = require('./auth');
const resolvers = require('./resolvers');

const DB_HOST = process.env.DB_HOST;

if (!DB_HOST) {
  throw new Error('DB_HOST is required. Set it in your .env file.');
}

const MONGO_CLIENT = new MongoClient(DB_HOST);
const typeDefs = readFileSync(
  join(__dirname, 'schema/type-defs.graphql'),
  'utf8'
);

async function startServer() {
  await MONGO_CLIENT.connect();
  const MONGO_DB = MONGO_CLIENT.db();
  const server = new ApolloServer({ typeDefs, resolvers });

  const { url } = await startStandaloneServer(server, {
    context: async ({ req }) => ({
      db: MONGO_DB,
      currentUser: await getCurrentUser(req, MONGO_DB),
    }),
    listen: { port: 4000 },
  });

  console.log(`GraphQL service running at ${url}`);
}

startServer().catch(async error => {
  console.error('Failed to start GraphQL service:', error);
  await MONGO_CLIENT.close();
  process.exitCode = 1;
});
