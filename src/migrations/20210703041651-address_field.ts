// @ts-nocheck
module.exports = {
  async up(db, client) {
    await db.collection('users').updateMany({}, { $set: { address: 'HCM' } });
  },

  async down(db, client) {
    await db.collection('users').updateMany({}, { $unset: { address: null } });
  }
};
