const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const users = await User.find().select('_id email accountType firstName lastName').limit(5);
  console.log('Available users:');
  users.forEach(user => {
    console.log(`ID: ${user._id}, Email: ${user.email}, Type: ${user.accountType}, Name: ${user.firstName} ${user.lastName}`);
  });
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
