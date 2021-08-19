// @ts-nocheck
module.exports = {
  async up(db, client) {
    const users = await db.collection('users').find({}).toArray();
    const operations = users.map((user) => {
      return db.collection('users').updateOne({ _id: user._id }, { $set: { fullname: `${user.firstname} ${user.lastname}` } });
    })
    return Promise.all(operations);
  },

  async down(db, client) {
    await db.collection('users').updateMany({}, { $unset: { fullname: null } });
  }
};
