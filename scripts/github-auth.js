require('dotenv').config({ quiet: true });

const { execFileSync } = require('node:child_process');

const clientId = process.env.GITHUB_CLIENT_ID;

if (!clientId || clientId === 'your-github-client-id') {
  console.error('Set GITHUB_CLIENT_ID in your .env file before starting GitHub authorization.');
  process.exit(1);
}

const authorizationUrl = new URL('https://github.com/login/oauth/authorize');
authorizationUrl.searchParams.set('client_id', clientId);
authorizationUrl.searchParams.set('scope', 'user');

try {
  execFileSync('open', [authorizationUrl.toString()], { stdio: 'ignore' });
  console.log('Opened GitHub authorization in your browser.');
  console.log('After approving access, copy the code query parameter from the callback URL.');
  console.log('Pass it to the githubAuth mutation in GraphQL Playground.');
} catch (error) {
  console.error('Could not open a browser automatically. Open this URL manually:');
  console.log(authorizationUrl.toString());
  process.exitCode = 1;
}
