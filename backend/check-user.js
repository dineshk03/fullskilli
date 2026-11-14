const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const user = await User.findOne({ email: 'rajan@gmail.com' });
  console.log('User data:');
  console.log('ID:', user._id);
  console.log('Email:', user.email);
  console.log('Account Type:', user.accountType);
  console.log('First Name:', user.firstName);
  console.log('Last Name:', user.lastName);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
