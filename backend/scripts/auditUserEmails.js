require('dotenv').config();
const mongoose = require('mongoose');

// Default is read-only. Never merge or delete duplicate accounts automatically.
(async () => {
    if (!process.env.MONGODB_URL) throw new Error('MONGODB_URL is required');
    await mongoose.connect(process.env.MONGODB_URL);
    const users = mongoose.connection.db.collection('users');
    const duplicateGroups = await users.aggregate([
        { $match: { email: { $type: 'string' } } },
        { $group: { _id: { $toLower: { $trim: { input: '$email' } } }, count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $count: 'groups' }
    ]).toArray();
    const duplicates = duplicateGroups[0]?.groups || 0;
    console.log(JSON.stringify({ duplicateEmailGroups: duplicates, mode: process.argv.includes('--apply') ? 'apply' : 'read-only' }));
    if (duplicates) throw new Error('Resolve duplicate accounts before normalizing emails or creating the unique index');
    if (process.argv.includes('--apply')) {
        await users.updateMany({ email: { $type: 'string' } }, [{ $set: { email: { $toLower: { $trim: { input: '$email' } } } } }]);
        await users.createIndex({ email: 1 }, { unique: true });
        console.log('Email normalization and unique index completed');
    }
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
