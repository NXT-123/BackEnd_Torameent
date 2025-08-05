const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email address']
    },
    passwordHash: {
        type: String,
        required: [true, 'Password hash is required']
    },
    role: {
        type: String,
        enum: ['user', 'organizer', 'admin'],
        default: 'user'
    },
    fullName: {
        type: String,
        trim: true
    },
    avatarUrl: {
        type: String,
        trim: true
    }
}, {
    timestamps: true // Tự động tạo createdAt và updatedAt
});

module.exports = mongoose.model('User', userSchema);