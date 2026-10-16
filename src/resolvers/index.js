const { GraphQLDateTime } = require('graphql-custom-types');
const { authorizeWithGithub } = require('../auth');

const MY_WEBSITE = 'https://bzamith.github.io';

function getTotalPhotos(_parent, _args, { db }) {
  return db.collection('photos').estimatedDocumentCount();
}

function getTotalUsers(_parent, _args, { db }) {
  return db.collection('users').estimatedDocumentCount();
}

function getAllPhotos(_parent, _args, { db }) {
  return db.collection('photos').find().toArray();
}

function getAllUsers(_parent, _args, { db }) {
  return db.collection('users').find().toArray();
}

async function getNextPhotoId(db) {
  const existingPhotos = await db
    .collection('photos')
    .find({}, { projection: { id: 1 } })
    .toArray();

  const highestId = Math.max(
    0,
    ...existingPhotos.map(photo => Number(photo.id) || 0)
  );

  return String(highestId + 1);
}

async function createPhoto(input, db, currentUser) {
  const photo = {
    id: await getNextPhotoId(db),
    name: input.name,
    description: input.description ?? null,
    created: new Date(),
    category: input.category,
    githubUser: currentUser.githubLogin,
  };

  await db.collection('photos').insertOne(photo);
  return photo;
}

function getPhotoUrl(photo) {
  return `${MY_WEBSITE}/img/${photo.id}.jpg`;
}

function getPhotoPostedBy(photo, _args, { db }) {
  return db.collection('users').findOne({ githubLogin: photo.githubUser });
}

async function getTaggedUsersForPhoto(photo, _args, { db }) {
  const photoTags = await db
    .collection('tags')
    .find({ photoID: photo.id })
    .toArray();

  const githubLogins = photoTags.map(tag => tag.userID);

  return db
    .collection('users')
    .find({ githubLogin: { $in: githubLogins } })
    .toArray();
}

function getPhotosPostedByUser(user, _args, { db }) {
  return db.collection('photos').find({ githubUser: user.githubLogin }).toArray();
}

async function getPhotosTaggedForUser(user, _args, { db }) {
  const userTags = await db
    .collection('tags')
    .find({ userID: user.githubLogin })
    .toArray();

  const photoIds = userTags.map(tag => tag.photoID);

  return db.collection('photos').find({ id: { $in: photoIds } }).toArray();
}

async function githubAuth(_parent, { code }, { db }) {
  const { token, user } = await authorizeWithGithub(code);

  await db.collection('users').updateOne(
    { githubLogin: user.githubLogin },
    { $set: user },
    { upsert: true }
  );

  return { user, token };
}

async function fakeUserAuth(_parent, { githubLogin }, { db }) {
  const user = await db.collection('users').findOne({ githubLogin });

  if (!user) {
    throw new Error(`Cannot find user with githubLogin "${githubLogin}".`);
  }

  if (!user.githubToken) {
    throw new Error(`User "${githubLogin}" does not have a fake authentication token.`);
  }

  return { token: user.githubToken, user };
}

function postPhoto(_parent, { input }, { db, currentUser }) {
  if (!currentUser) {
    throw new Error('You must be signed in to post a photo.');
  }

  return createPhoto(input, db, currentUser);
}

async function addFakeUsers(_parent, { count = 1 }, { db }) {
  const resultsCount = count ?? 1;

  if (resultsCount < 0) {
    throw new Error('count must be zero or greater.');
  }

  if (resultsCount === 0) {
    return [];
  }

  const randomUserApi = `https://randomuser.me/api/?results=${resultsCount}`;
  const response = await fetch(randomUserApi);

  if (!response.ok) {
    throw new Error('Could not fetch fake users.');
  }

  const { results } = await response.json();
  if (!Array.isArray(results)) {
    throw new Error('Random User API returned an invalid response.');
  }

  const fakeUsers = results.map(({ login, name, picture }) => ({
    githubLogin: login.username,
    githubToken: login.uuid,
    name: `${name.first} ${name.last}`,
    avatar: picture.thumbnail,
  }));

  await db.collection('users').insertMany(fakeUsers);
  return fakeUsers;
}

const resolvers = {
  DateTime: GraphQLDateTime,
  Query: {
    me: (_parent, _args, { currentUser }) => currentUser,
    totalPhotos: getTotalPhotos,
    allPhotos: getAllPhotos,
    totalUsers: getTotalUsers,
    allUsers: getAllUsers,
  },
  Mutation: {
    addFakeUsers,
    fakeUserAuth,
    postPhoto,
    githubAuth,
  },
  Photo: {
    url: getPhotoUrl,
    postedBy: getPhotoPostedBy,
    taggedUsers: getTaggedUsersForPhoto,
  },
  User: {
    postedPhotos: getPhotosPostedByUser,
    inPhotos: getPhotosTaggedForUser,
  },
};

module.exports = resolvers;
