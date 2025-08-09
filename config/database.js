const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // Try to connect to MongoDB
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.warn('MongoDB connection failed, running in mock mode:', error.message);
        console.log('Server will run with mock data responses.');
        
        // Set a flag to indicate we're running in mock mode
        global.mockMode = true;
        return false;
    }
};

module.exports = connectDB;