const mongoose = require('mongoose');

module.exports = async function connectDB(uri) {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
};
