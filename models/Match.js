const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true
    },
    teamA: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Competitor',
        required: true
    },
    teamB: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Competitor',
        required: true
    },
    scheduledAt: {
        type: Date
    },
    score: {
        a: { type: Number, default: 0 },
        b: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['pending', 'done'],
        default: 'pending'
    }
}, {
    timestamps: false
});

// Tạo index cho createdAt
matchSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Match', matchSchema);