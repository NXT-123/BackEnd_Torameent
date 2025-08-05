const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
    },
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
    },
    title: {
        type: String,
        trim: true
    },
    videoUrl: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['private', 'public'],
        default: 'public'
    }
}, {
    timestamps: false // Không sử dụng timestamps vì chỉ có createdAt
});

// Tạo index cho createdAt
highlightSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Highlight', highlightSchema);