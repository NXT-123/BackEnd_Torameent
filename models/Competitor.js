const mongoose = require('mongoose');

const competitorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Team name is required'],
        trim: true,
        maxlength: [100, 'Team name cannot exceed 100 characters']
    },
    logoUrl: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v) return true; // Allow empty
                return /^https?:\/\/.+/.test(v);
            },
            message: 'Logo URL must be a valid HTTP/HTTPS URL'
        }
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    mail: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                if (!v) return true; // Allow empty
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Email must be a valid email address'
        }
    },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: [true, 'Tournament ID is required']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate registrations
competitorSchema.index({ tournamentId: 1, userId: 1 }, { unique: true });

// Index for performance
competitorSchema.index({ tournamentId: 1 });
competitorSchema.index({ userId: 1 });
competitorSchema.index({ createdAt: 1 });

// Pre-save middleware to ensure data consistency
competitorSchema.pre('save', function (next) {
    // Ensure name is not empty
    if (!this.name || this.name.trim() === '') {
        this.name = 'Unnamed Team';
    }

    // Ensure description is not empty if provided
    if (this.description && this.description.trim() === '') {
        this.description = undefined;
    }

    next();
});

module.exports = mongoose.model('Competitor', competitorSchema);