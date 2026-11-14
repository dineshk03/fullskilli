const mongoose = require('mongoose');
const schema = new mongoose.Schema({ _id: String, value: { type: Number, default: 0 } });
module.exports = mongoose.models.Counter || mongoose.model('Counter', schema);
