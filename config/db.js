const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('mongo Db connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1); //exit process ith failure
  }
};

module.exports = connectDB;
