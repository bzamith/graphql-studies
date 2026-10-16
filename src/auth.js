async function requestGithubToken(credentials) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error_description || result.message || 'GitHub token request failed.');
  }

  return result;
}

async function requestGithubUserAccount(accessToken) {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function authorizeWithGithub(code) {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    throw new Error('GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be configured.');
  }

  const { access_token: token } = await requestGithubToken({
    client_id: GITHUB_CLIENT_ID,
    client_secret: GITHUB_CLIENT_SECRET,
    code,
  });

  if (!token) {
    throw new Error('GitHub did not return an access token.');
  }

  const githubUser = await requestGithubUserAccount(token);

  if (!githubUser) {
    throw new Error('Could not retrieve the GitHub user account.');
  }

  return {
    token,
    user: {
      githubLogin: githubUser.login,
      name: githubUser.name,
      avatar: githubUser.avatar_url,
    },
  };
}

async function getCurrentUser(request, db) {
  const authorization = request.headers.authorization;
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1].trim();

  if (!token) {
    return null;
  }

  const fakeUser = await db.collection('users').findOne({ githubToken: token });

  if (fakeUser) {
    return fakeUser;
  }

  const githubUser = await requestGithubUserAccount(token);

  if (!githubUser) {
    return null;
  }

  return db.collection('users').findOne({ githubLogin: githubUser.login });
}

module.exports = { authorizeWithGithub, getCurrentUser };
