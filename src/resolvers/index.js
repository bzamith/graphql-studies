const { GraphQLDateTime } = require('graphql-custom-types');

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

async function createPhoto(input, db) {
  const photo = {
    id: await getNextPhotoId(db),
    name: input.name,
    description: input.description ?? null,
    created: new Date(),
    category: input.category,
    githubUser: 'photoshare-demo',
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

const resolvers = {
  DateTime: GraphQLDateTime,
  Query: {
    totalPhotos: getTotalPhotos,
    allPhotos: getAllPhotos,
    totalUsers: getTotalUsers,
    allUsers: getAllUsers,
  },
  Mutation: {
    postPhoto: (_parent, { input }, { db }) => createPhoto(input, db),
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
