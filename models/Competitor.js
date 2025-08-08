const mongoose = require('mongoose');

const competitorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    logoUrl: {
        type: String
    },
    description: {
        type: String
    },
    mail: {
        type: String
    },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: false
});

// Tạo index cho createdAt
competitorSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Competitor', competitorSchema);