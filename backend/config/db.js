const mongoose = require("mongoose");

let cached = global._mongooseConn;

if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI)
      .then((connection) => {
        console.log(`MongoDB Connected: ${connection.connection.host}`);
        return connection;
      })
      .catch((error) => {
        console.error("MongoDB connection failed:");
        console.error(error.message);
        cached.promise = null; 
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;