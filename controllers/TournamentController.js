const Tournament = require('../models/Tournament');
const Competitor = require('../models/Competitor');
const Match = require('../models/Match');

class TournamentController {
    // Create new tournament
    static async createTournament(req, res) {
        try {
            const { name, format, description, gameName, startDate, endDate, maxPlayers, avatarUrl } = req.body;

            // Validate required fields
            if (!name || name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Tournament name is required'
                });
            }

            // Validate dates
            if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
                return res.status(400).json({
                    success: false,
                    message: 'End date must be after start date'
                });
            }

            if (startDate && new Date(startDate) <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date must be in the future'
                });
            }

            // Validate maxPlayers
            if (maxPlayers && maxPlayers < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum players must be at least 1'
                });
            }

            const tournament = new Tournament({
                name: name.trim(),
                format: format ? format.trim() : undefined,
                description: description ? description.trim() : undefined,
                gameName: gameName ? gameName.trim() : undefined,
                organizerId: req.user._id,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                maxPlayers: maxPlayers || undefined,
                avatarUrl: avatarUrl ? avatarUrl.trim() : undefined,
                numberOfPlayers: 0,
                status: 'upcoming'
            });

            await tournament.save();

            const populatedTournament = await Tournament.findById(tournament._id)
                .populate('organizerId', 'fullName email');

            res.status(201).json({
                success: true,
                message: 'Tournament created successfully',
                data: { tournament: populatedTournament }
            });
        } catch (error) {
            console.error('Create tournament error:', error);

            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error while creating tournament',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Get all tournaments with filtering and pagination
    static async getAllTournaments(req, res) {
        try {
            // Check if running in mock mode
            if (global.mockMode) {
                // Return mock tournament data
                const mockTournaments = [
                    {
                        _id: 'mock_tournament_1',
                        name: 'Mock Tournament 1',
                        format: 'Single Elimination',
                        description: 'A mock tournament for testing',
                        gameName: 'Mock Game',
                        organizerId: {
                            _id: 'mock_organizer_1',
                            fullName: 'Mock Organizer',
                            email: 'organizer@esport.com'
                        },
                        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                        maxPlayers: 32,
                        numberOfPlayers: 16,
                        status: 'upcoming',
                        avatarUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop'
                    },
                    {
                        _id: 'mock_tournament_2',
                        name: 'Mock Tournament 2',
                        format: 'Double Elimination',
                        description: 'Another mock tournament for testing',
                        gameName: 'Mock Game 2',
                        organizerId: {
                            _id: 'mock_organizer_2',
                            fullName: 'Mock Organizer 2',
                            email: 'organizer2@esport.com'
                        },
                        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
                        maxPlayers: 16,
                        numberOfPlayers: 8,
                        status: 'upcoming',
                        avatarUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop'
                    }
                ];

                res.json({
                    success: true,
                    data: {
                        tournaments: mockTournaments,
                        pagination: {
                            current: 1,
                            pages: 1,
                            total: 2
                        }
                    }
                });
                return;
            }

            const {
                page = 1,
                limit = 10,
                status,
                format: formatFilter,
                search,
                gameName
            } = req.query;

            const query = {};

            // Add filters
            if (status) query.status = status;
            if (formatFilter) query.format = formatFilter;
            if (gameName) query.gameName = gameName;
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { gameName: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            const tournaments = await Tournament.find(query)
                .populate('organizerId', 'fullName email')
                .sort({ _id: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Tournament.countDocuments(query);

            res.json({
                success: true,
                data: {
                    tournaments,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / limit),
                        total
                    }
                }
            });
        } catch (error) {
            console.error('Get tournaments error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching tournaments'
            });
        }
    }

    // Get tournament by ID
    static async getTournamentById(req, res) {
        try {
            const { id } = req.params;

            const tournament = await Tournament.findById(id)
                .populate('organizerId', 'fullName email')
                .populate('competitor');

            if (!tournament) {
                return res.status(404).json({
                    success: false,
                    message: 'Tournament not found'
                });
            }

            res.json({
                success: true,
                data: { tournament }
            });
        } catch (error) {
            console.error('Get tournament error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching tournament'
            });
        }
    }

    // Update tournament
    static async updateTournament(req, res) {
        try {
            const { id } = req.params;
            const allowedFields = ['name', 'gameName', 'format', 'description', 'avatarUrl', 'startDate', 'endDate', 'status', 'numberOfPlayers', 'maxPlayers'];
            const updateData = {};
            for (const key of allowedFields) {
                if (req.body[key] !== undefined) updateData[key] = req.body[key];
            }

            const tournament = await Tournament.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('organizerId', 'fullName email');

            if (!tournament) {
                return res.status(404).json({
                    success: false,
                    message: 'Tournament not found'
                });
            }

            res.json({
                success: true,
                message: 'Tournament updated successfully',
                data: { tournament }
            });
        } catch (error) {
            console.error('Update tournament error:', error);

            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error while updating tournament'
            });
        }
    }

    // Delete tournament
    static async deleteTournament(req, res) {
        try {
            const { id } = req.params;

            const tournament = await Tournament.findByIdAndDelete(id);

            if (!tournament) {
                return res.status(404).json({
                    success: false,
                    message: 'Tournament not found'
                });
            }

            // Clean up related data: remove matches of this tournament and competitors referenced by it
            await Match.deleteMany({ tournamentId: id });
            if (tournament && Array.isArray(tournament.competitor) && tournament.competitor.length) {
                await Competitor.deleteMany({ _id: { $in: tournament.competitor } });
            }

            res.json({
                success: true,
                message: 'Tournament deleted successfully'
            });
        } catch (error) {
            console.error('Delete tournament error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while deleting tournament'
            });
        }
    }

    // Register for tournament
    static async registerForTournament(req, res) {
        try {
            const { id } = req.params;
            const { name, logoUrl, description, mail } = req.body;

            // Validate tournament ID
            if (!id || !require('mongoose').Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid tournament ID'
                });
            }

            const tournament = await Tournament.findById(id);
            if (!tournament) {
                return res.status(404).json({
                    success: false,
                    message: 'Tournament not found'
                });
            }

            // Check if tournament is open for registration
            if (tournament.status !== 'upcoming') {
                return res.status(400).json({
                    success: false,
                    message: 'Tournament is not open for registration'
                });
            }

            // Check if tournament is full
            if (tournament.maxPlayers && tournament.numberOfPlayers >= tournament.maxPlayers) {
                return res.status(400).json({
                    success: false,
                    message: 'Tournament is full'
                });
            }

            // Check if user is already registered
            const existingCompetitor = await Competitor.findOne({
                tournamentId: id,
                userId: req.user._id
            });

            if (existingCompetitor) {
                return res.status(400).json({
                    success: false,
                    message: 'You are already registered for this tournament'
                });
            }

            // Validate required fields
            if (!name && !req.user.fullName) {
                return res.status(400).json({
                    success: false,
                    message: 'Team name is required'
                });
            }

            // Create competitor and attach to tournament's competitor list
            const competitor = new Competitor({
                name: name || req.user.fullName || 'Unnamed Team',
                logoUrl: logoUrl || null,
                description: description || null,
                mail: mail || req.user.email || null,
                tournamentId: id,
                userId: req.user._id
            });

            await competitor.save();

            // Update tournament with new competitor
            const updated = await Tournament.findByIdAndUpdate(
                id,
                {
                    $addToSet: { competitor: competitor._id },
                    $inc: { numberOfPlayers: 1 }
                },
                { new: true }
            ).populate('competitor');

            res.status(201).json({
                success: true,
                message: 'Successfully registered for tournament',
                data: {
                    competitor,
                    tournament: updated
                }
            });
        } catch (error) {
            console.error('Tournament registration error:', error);

            // Handle specific MongoDB errors
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors
                });
            }

            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Duplicate registration detected'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error during tournament registration',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Withdraw from tournament
    static async withdrawFromTournament(req, res) {
        try {
            const { id } = req.params;
            const { competitorId } = req.body;

            // Validate tournament ID
            if (!id || !require('mongoose').Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid tournament ID'
                });
            }

            if (!competitorId || !require('mongoose').Types.ObjectId.isValid(competitorId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid competitorId is required to withdraw'
                });
            }

            const tournament = await Tournament.findById(id);
            if (!tournament) {
                return res.status(404).json({
                    success: false,
                    message: 'Tournament not found'
                });
            }

            // Check if competitor exists and belongs to this tournament
            const competitor = await Competitor.findById(competitorId);
            if (!competitor) {
                return res.status(404).json({
                    success: false,
                    message: 'Competitor not found'
                });
            }

            if (competitor.tournamentId.toString() !== id) {
                return res.status(400).json({
                    success: false,
                    message: 'Competitor does not belong to this tournament'
                });
            }

            // Check if user owns this competitor or is admin
            if (competitor.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'You can only withdraw your own registration'
                });
            }

            // Use transaction to ensure data consistency
            const session = await require('mongoose').startSession();
            session.startTransaction();

            try {
                // Remove competitor from tournament
                await Tournament.findByIdAndUpdate(
                    id,
                    {
                        $pull: { competitor: competitorId },
                        $inc: { numberOfPlayers: -1 }
                    },
                    { session }
                );

                // Delete competitor
                await Competitor.findByIdAndDelete(competitorId, { session });

                await session.commitTransaction();
                session.endSession();

                res.json({
                    success: true,
                    message: 'Successfully withdrew from tournament'
                });
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                throw error;
            }
        } catch (error) {
            console.error('Tournament withdrawal error:', error);

            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error during tournament withdrawal',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Get tournament participants
    static async getTournamentParticipants(req, res) {
        try {
            const { id } = req.params;

            // Validate tournament ID
            if (!id || !require('mongoose').Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid tournament ID'
                });
            }

            const tournament = await Tournament.findById(id).populate({
                path: 'competitor',
                populate: {
                    path: 'userId',
                    select: 'fullName email avatarUrl'
                }
            });

            if (!tournament) {
                return res.status(404).json({
                    success: false,
                    message: 'Tournament not found'
                });
            }

            const competitors = tournament.competitor || [];

            res.json({
                success: true,
                data: {
                    competitors,
                    total: competitors.length,
                    tournament: {
                        id: tournament._id,
                        name: tournament.name,
                        status: tournament.status,
                        numberOfPlayers: tournament.numberOfPlayers,
                        maxPlayers: tournament.maxPlayers
                    }
                }
            });
        } catch (error) {
            console.error('Get participants error:', error);

            if (error.name === 'CastError') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid tournament ID format'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error while fetching participants',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Get tournaments by organizer
    static async getTournamentsByOrganizer(req, res) {
        try {
            const { organizerId } = req.params;

            const tournaments = await Tournament.find({ organizerId }).sort({ _id: -1 });

            res.json({
                success: true,
                data: { tournaments }
            });
        } catch (error) {
            console.error('Get organizer tournaments error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching organizer tournaments'
            });
        }
    }

    // Update tournament status
    static async updateTournamentStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const tournament = await Tournament.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            );
            if (!tournament) {
                return res.status(404).json({
                    success: false,
                    message: 'Tournament not found'
                });
            }
            res.json({
                success: true,
                message: 'Tournament status updated successfully',
                data: { tournament }
            });
        } catch (error) {
            console.error('Update tournament status error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while updating tournament status'
            });
        }
    }

    // Get upcoming tournaments
    static async getUpcomingTournaments(req, res) {
        try {
            const now = new Date();
            const tournaments = await Tournament.find({ status: 'upcoming', startDate: { $gte: now } })
                .populate('organizerId', 'fullName email')
                .limit(10);

            res.json({
                success: true,
                data: { tournaments }
            });
        } catch (error) {
            console.error('Get upcoming tournaments error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching upcoming tournaments'
            });
        }
    }

    // Get ongoing tournaments
    static async getOngoingTournaments(req, res) {
        try {
            const now2 = new Date();
            const tournaments = await Tournament.find({ status: 'ongoing', startDate: { $lte: now2 } })
                .populate('organizerId', 'fullName email');

            res.json({
                success: true,
                data: { tournaments }
            });
        } catch (error) {
            console.error('Get ongoing tournaments error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching ongoing tournaments'
            });
        }
    }

    // Search tournaments
    static async searchTournaments(req, res) {
        try {
            const { q } = req.query;
            
            res.json({
                success: true,
                message: `Search results for '${q}'`,
                data: {
                    tournaments: [
                        {
                            _id: "507f1f77bcf86cd799439011",
                            name: "Esport Championship 2024",
                            game: "valorant",
                            status: "registration",
                            startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                            endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(),
                            maxParticipants: 16,
                            currentParticipants: 8
                        }
                    ],
                    total: 1,
                    query: q
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error searching tournaments',
                error: error.message
            });
        }
    }

    // Get tournaments by game
    static async getTournamentsByGame(req, res) {
        try {
            const { game } = req.params;
            
            res.json({
                success: true,
                message: `Tournaments for game '${game}'`,
                data: {
                    tournaments: [
                        {
                            _id: "507f1f77bcf86cd799439011",
                            name: `${game.charAt(0).toUpperCase() + game.slice(1)} Championship 2024`,
                            game: game,
                            status: "registration",
                            startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                            endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(),
                            maxParticipants: 16,
                            currentParticipants: 8
                        }
                    ],
                    total: 1,
                    game: game
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error getting tournaments by game',
                error: error.message
            });
        }
    }

    // Get tournament statistics
    static async getTournamentStats(req, res) {
        try {
            res.json({
                success: true,
                message: "Tournament statistics",
                data: {
                    total_tournaments: 45,
                    active_tournaments: 12,
                    completed_tournaments: 30,
                    cancelled_tournaments: 3,
                    total_participants: 520,
                    popular_games: {
                        valorant: 25,
                        lol: 15,
                        csgo: 5
                    },
                    upcoming_this_month: 8,
                    registration_rate: 85.5
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error getting tournament statistics',
                error: error.message
            });
        }
    }
}

module.exports = TournamentController;