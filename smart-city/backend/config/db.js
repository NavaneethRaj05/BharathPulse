const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-city-complaints');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Keep API server alive for stateless endpoints (e.g., chatbot health checks)
    // even when MongoDB is unavailable in local development.
    console.error(`MongoDB connection failed: ${error.message}`);
    console.warn('Running without database connection. Complaint CRUD endpoints will fail until MongoDB starts.');
  }
};

module.exports = connectDB;
