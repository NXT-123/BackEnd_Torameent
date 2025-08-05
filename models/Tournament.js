const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    gameName: {
        type: String
    },
    format: {
        type: String
    },
    description: {
        type: String
    },
    organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    competitor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Competitor'
    }],
    avatarUrl: {
        type: String
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed'],
        default: 'upcoming'
    },
    numberOfPlayers: {
        type: Number
    },
    maxPlayers: {
        type: Number
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Tournament', tournamentSchema);