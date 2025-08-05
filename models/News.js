const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        trim: true
    },
    images: [{
        type: String,
        trim: true
    }],
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    publishedAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['private', 'public'],
        default: 'public'
    }
}, {
    timestamps: true // Tự động tạo createdAt, updatedAt
});

module.exports = mongoose.model('News', newsSchema);