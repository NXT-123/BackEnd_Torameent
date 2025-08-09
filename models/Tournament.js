const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tournament name is required'],
        trim: true,
        maxlength: [100, 'Tournament name cannot exceed 100 characters']
    },
    gameName: {
        type: String,
        trim: true,
        maxlength: [50, 'Game name cannot exceed 50 characters']
    },
    format: {
        type: String,
        trim: true,
        maxlength: [50, 'Format cannot exceed 50 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Organizer ID is required']
    },
    competitor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Competitor'
    }],
    avatarUrl: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v) return true; // Allow empty
                return /^https?:\/\/.+/.test(v);
            },
            message: 'Avatar URL must be a valid HTTP/HTTPS URL'
        }
    },
    startDate: {
        type: Date,
        validate: {
            validator: function (v) {
                if (!v) return true; // Allow empty
                return v > new Date();
            },
            message: 'Start date must be in the future'
        }
    },
    endDate: {
        type: Date,
        validate: {
            validator: function (v) {
                if (!v || !this.startDate) return true; // Allow empty or if no start date
                return v > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },
    status: {
        type: String,
        enum: {
            values: ['upcoming', 'ongoing', 'completed'],
            message: 'Status must be one of: upcoming, ongoing, completed'
        },
        default: 'upcoming'
    },
    numberOfPlayers: {
        type: Number,
        default: 0,
        min: [0, 'Number of players cannot be negative']
    },
    maxPlayers: {
        type: Number,
        min: [1, 'Maximum players must be at least 1'],
        validate: {
            validator: function (v) {
                if (!v) return true; // Allow empty
                return v >= this.numberOfPlayers;
            },
            message: 'Maximum players cannot be less than current number of players'
        }
    }
}, {
    timestamps: true
});

// Indexes for performance
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ organizerId: 1 });
tournamentSchema.index({ startDate: 1 });
tournamentSchema.index({ gameName: 1 });
tournamentSchema.index({ name: 'text', description: 'text', gameName: 'text' });

// Pre-save middleware to ensure data consistency
tournamentSchema.pre('save', function (next) {
    // Ensure numberOfPlayers is not negative
    if (this.numberOfPlayers < 0) {
        this.numberOfPlayers = 0;
    }

    // Ensure maxPlayers is valid
    if (this.maxPlayers && this.maxPlayers < this.numberOfPlayers) {
        this.maxPlayers = this.numberOfPlayers;
    }

    next();
});

// Virtual for checking if tournament is full
tournamentSchema.virtual('isFull').get(function () {
    return this.maxPlayers && this.numberOfPlayers >= this.maxPlayers;
});

// Virtual for checking if tournament is open for registration
tournamentSchema.virtual('isOpenForRegistration').get(function () {
    return this.status === 'upcoming' && !this.isFull;
});

module.exports = mongoose.model('Tournament', tournamentSchema);