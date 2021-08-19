require('ts-node').register();
// @ts-ignore
const dotenv = require('dotenv');
const path = require('path');
process.env.DEBUG = 'mongo-seeding';
const { Seeder } = require('mongo-seeding');

dotenv.config();

const config = {
  database: `${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`,
  dropDatabase: true,
};
const seeder = new Seeder(config);
const collections = seeder.readCollectionsFromPath(
  path.resolve('./src/seeders'),
  {
    extensions: ['js', 'json', 'ts'],
    transformers: [
      // Seeder.Transformers.replaceDocumentIdWithUnderscoreId,
      Seeder.Transformers.setCreatedAtTimestamp,
      Seeder.Transformers.setUpdatedAtTimestamp
    ],
  },
);

const run = async () => {
  try {
    await seeder.import(collections);
  } catch (err) {
    console.log('Error', err);
  }
};

run();
