const session = require('express-session');
const mongoose = require('mongoose');
const schema = new mongoose.Schema({ _id: String, data: String, expiresAt: { type: Date, expires: 0 } });
const Session = mongoose.models.Session || mongoose.model('Session', schema);
class MongoSessionStore extends session.Store {
    get(id, done) {
        Session.findById(id).lean().then(record => done(null, record && record.expiresAt > new Date() ? JSON.parse(record.data) : null)).catch(done);
    }
    set(id, value, done = () => {}) {
        Session.updateOne({ _id: id }, { $set: { data: JSON.stringify(value), expiresAt: value.cookie?.expires || new Date(Date.now() + 30 * 60 * 1000) } }, { upsert: true }).then(() => done()).catch(done);
    }
    destroy(id, done = () => {}) { Session.deleteOne({ _id: id }).then(() => done()).catch(done); }
    touch(id, value, done = () => {}) {
        Session.updateOne({ _id: id }, { $set: { expiresAt: value.cookie?.expires || new Date(Date.now() + 30 * 60 * 1000) } }).then(() => done()).catch(done);
    }
}
module.exports = { MongoSessionStore };
