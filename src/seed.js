require('dotenv').config();

const { MongoClient } = require('mongodb');

const DB_HOST = process.env.DB_HOST;

if (!DB_HOST) {
  throw new Error('DB_HOST is required. Set it in your .env file.');
}

const MONGO_CLIENT = new MongoClient(DB_HOST);
const MY_WEBSITE = 'https://bzamith.github.io';

const users = [
  { githubLogin: 'bzamith', name: 'Bruna Zamith' },
  { githubLogin: 'gustavosassaki', name: 'Gustavo Sassaki' },
  {
    githubLogin: 'photoshare-demo',
    name: 'PhotoShare Demo',
    avatar: `${MY_WEBSITE}/avatar.png`,
  },
];

const photos = [
  {
    id: '1',
    name: 'Dropping the Heart Chute',
    description: 'The heart chute is one of my favorite chutes',
    created: new Date('2025-01-15T12:00:00.000Z'),
    category: 'ACTION',
    githubUser: 'bzamith',
  },
  {
    id: '2',
    name: 'Enjoying the sunshine',
    created: new Date('2025-02-20T15:30:00.000Z'),
    category: 'SELFIE',
    githubUser: 'gustavosassaki',
  },
];

const tags = [
  { photoID: '1', userID: 'gustavosassaki' },
  { photoID: '2', userID: 'bzamith' },
  { photoID: '2', userID: 'photoshare-demo' },
];

async function seedDatabase() {
  await MONGO_CLIENT.connect();
  const db = MONGO_CLIENT.db();

  await Promise.all([
    db.collection('users').createIndex({ githubLogin: 1 }, { unique: true }),
    db.collection('photos').createIndex({ id: 1 }, { unique: true }),
    db
      .collection('tags')
      .createIndex({ photoID: 1, userID: 1 }, { unique: true }),
  ]);

  await Promise.all([
    ...users.map(user =>
      db.collection('users').updateOne(
        { githubLogin: user.githubLogin },
        { $set: user },
        { upsert: true }
      )
    ),
    ...photos.map(photo =>
      db.collection('photos').updateOne(
        { id: photo.id },
        { $set: photo },
        { upsert: true }
      )
    ),
    ...tags.map(tag =>
      db.collection('tags').updateOne(
        { photoID: tag.photoID, userID: tag.userID },
        { $setOnInsert: tag },
        { upsert: true }
      )
    ),
  ]);

  console.log('PhotoShare sample data seeded successfully.');
}

seedDatabase()
  .catch(error => {
    console.error('Failed to seed MongoDB:', error);
    process.exitCode = 1;
  })
  .finally(() => MONGO_CLIENT.close());
