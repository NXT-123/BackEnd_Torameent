const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');
const config = require('./config/config');

// Import routes
const authRoutes = require('./routes/authRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const newsRoutes = require('./routes/newsRoutes');
const matchRoutes = require('./routes/matchRoutes');
const highlightRoutes = require('./routes/highlightRoutes');

const app = express();
const port = config.port;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files for frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, '../../')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/highlights', highlightRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Tournament Management System API is running',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv
    });
});

// API Documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Tournament Management System API',
        version: '1.0.0',
        endpoints: {
            auth: {
                base: '/api/auth',
                endpoints: [
                    'POST /register - Register new user',
                    'POST /login - User login',
                    'GET /profile - Get user profile (auth required)',
                    'PUT /profile - Update user profile (auth required)',
                    'PUT /change-password - Change password (auth required)',
                    'POST /logout - User logout (auth required)'
                ]
            },
            tournaments: {
                base: '/api/tournaments',
                endpoints: [
                    'GET / - Get all tournaments',
                    'GET /upcoming - Get upcoming tournaments',
                    'GET /ongoing - Get ongoing tournaments',
                    'GET /:id - Get tournament by ID',
                    'GET /:id/participants - Get tournament participants',
                    'GET /organizer/:organizerId - Get tournaments by organizer',
                    'POST / - Create tournament (organizer/admin required)',
                    'PUT /:id - Update tournament (owner/admin required)',
                    'DELETE /:id - Delete tournament (owner/admin required)',
                    'POST /:id/register - Register for tournament (auth required)',
                    'DELETE /:id/withdraw - Withdraw from tournament (auth required)',
                    'PUT /:id/status - Update tournament status (owner/admin required)'
                ]
            },
            news: {
                base: '/api/news',
                endpoints: [
                    'GET / - Get all published news',
                    'GET /featured - Get featured news',
                    'GET /search - Search news',
                    'GET /tournament/:tournamentId - Get news by tournament',
                    'GET /author/:authorId - Get news by author',
                    'GET /:id - Get news by ID',
                    'POST / - Create news (organizer/admin required)',
                    'PUT /:id - Update news (organizer/admin required)',
                    'DELETE /:id - Delete news (organizer/admin required)',
                    'PUT /:id/publish - Publish news (organizer/admin required)',
                    'POST /:id/comment - Add comment (auth required)',
                    'POST /:id/like - Like news (auth required)'
                ]
            },
            matches: {
                base: '/api/matches',
                endpoints: [
                    'GET / - Get all matches',
                    'GET /upcoming - Get upcoming matches',
                    'GET /ongoing - Get ongoing matches',
                    'GET /:id - Get match by ID',
                    'GET /tournament/:tournamentId - Get matches by tournament',
                    'GET /competitor/:competitorId - Get matches by competitor',
                    'POST / - Create match (organizer/admin required)',
                    'PUT /:id - Update match (organizer/admin required)',
                    'DELETE /:id - Delete match (organizer/admin required)',
                    'PUT /:id/start - Start match (organizer/admin required)',
                    'PUT /:id/result - Set match result (organizer/admin required)',
                    'PUT /:id/reschedule - Reschedule match (organizer/admin required)',
                    'PUT /:id/cancel - Cancel match (organizer/admin required)',
                    'PUT /:id/postpone - Postpone match (organizer/admin required)',
                    'POST /:id/game - Add game to match (organizer/admin required)'
                ]
            },
            highlights: {
                base: '/api/highlights',
                endpoints: [
                    'GET / - Get all highlights',
                    'GET /featured - Get featured highlights',
                    'GET /popular - Get popular highlights',
                    'GET /search - Search highlights',
                    'GET /type/:type - Get highlights by type',
                    'GET /tournament/:tournamentId - Get highlights by tournament',
                    'GET /match/:matchId - Get highlights by match',
                    'GET /:id - Get highlight by ID',
                    'POST / - Create highlight (organizer/admin required)',
                    'PUT /:id - Update highlight (organizer/admin required)',
                    'DELETE /:id - Delete highlight (organizer/admin required)',
                    'PUT /:id/status - Update highlight status (organizer/admin required)',
                    'PUT /:id/featured - Set highlight featured (organizer/admin required)',
                    'PUT /:id/attach-match - Attach highlight to match (organizer/admin required)',
                    'POST /:id/like - Like highlight (auth required)',
                    'POST /:id/share - Share highlight (auth required)'
                ]
            }
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }
    
    // Mongoose cast error
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }
    
    // Duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `${field} already exists`
        });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }
    
    // Default error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Tournament Management System Server running on http://localhost:${port}`);
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api`);
    console.log(`🏥 Health Check: http://localhost:${port}/api/health`);
});
