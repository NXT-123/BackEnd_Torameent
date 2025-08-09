const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // Force quick failure for MongoDB connection
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 1000, // Reduced timeout to 1 second
            connectTimeoutMS: 1000, // Connection timeout
            socketTimeoutMS: 1000, // Socket timeout
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.warn('MongoDB connection failed, running in mock mode:', error.message);
        console.log('Server will run with mock data responses.');
        
        // Set a flag to indicate we're running in mock mode
        global.mockMode = true;
        console.log('Mock mode flag set:', global.mockMode);
        return false;
    }
};

module.exports = connectDB;