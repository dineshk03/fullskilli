const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const user = await User.findById('695b6560b570de70b32c0d80');
  console.log('User with ID 695b6560b570de70b32c0d80:');
  if (user) {
    console.log('Email:', user.email);
    console.log('Account Type:', user.accountType);
    console.log('First Name:', user.firstName);
    console.log('Last Name:', user.lastName);
  } else {
    console.log('User not found!');
  }
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
