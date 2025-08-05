const Tournament = require('../models/Tournament');
const Competitor = require('../models/Competitor');
const Match = require('../models/Match');

class TournamentController {
    // Create new tournament
    static async createTournament(req, res) {
        try {
            const {
                name,
                format,
                description,
                gameName,
                startDate,
                endDate,
                maxPlayers,
                registrationDeadline,
                prizePool,
                entryFee,
                rules,
                logo,
                tags
            } = req.body;

            const tournament = new Tournament({
                name,
                format,
                description,
                gameName,
                organizerId: req.user._id,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                maxPlayers,
                registrationDeadline: new Date(registrationDeadline),
                prizePool: prizePool || 0,
                entryFee: entryFee || 0,
                rules,
                logo,
                tags: tags || []
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
                message: 'Server error while creating tournament'
            });
        }
    }

    // Get all tournaments with filtering and pagination
    static async getAllTournaments(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                status, 
                format, 
                search,
                sortBy = 'startDate',
                sortOrder = 'asc'
            } = req.query;

            const query = { isPublic: true };

            // Add filters
            if (status) query.status = status;
            if (format) query.format = format;
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { gameName: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            // Sort configuration
            const sortConfig = {};
            sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const tournaments = await Tournament.find(query)
                .populate('organizerId', 'fullName email')
                .sort(sortConfig)
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
                .populate('organizerId', 'fullName email avatar')
                .populate({
                    path: 'competitors',
                    populate: {
                        path: 'userId',
                        select: 'fullName email avatar'
                    }
                });

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
            const updateData = req.body;

            // Remove fields that shouldn't be updated
            delete updateData.organizerId;
            delete updateData.currentPlayers;

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

            // Clean up related data
            await Competitor.deleteMany({ tournamentId: id });
            await Match.deleteMany({ tournamentId: id });

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
            const { name, logo, teamMembers = [] } = req.body;

            const tournament = await Tournament.findById(id);
            if (!tournament) {
                return res.status(404).json({
                    success: false,
                    message: 'Tournament not found'
                });
            }

            // Check if registration is open
            if (!tournament.isRegistrationOpen()) {
                return res.status(400).json({
                    success: false,
                    message: 'Registration is closed for this tournament'
                });
            }

            // Check if user already registered
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

            // Create competitor
            const competitor = new Competitor({
                name: name || req.user.fullName,
                logo,
                tournamentId: id,
                userId: req.user._id,
                teamMembers
            });

            await competitor.save();

            // Update tournament participant count
            await tournament.addTeam(competitor._id);

            res.status(201).json({
                success: true,
                message: 'Successfully registered for tournament',
                data: { competitor }
            });
        } catch (error) {
            console.error('Tournament registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during tournament registration'
            });
        }
    }

    // Withdraw from tournament
    static async withdrawFromTournament(req, res) {
        try {
            const { id } = req.params;

            const competitor = await Competitor.findOne({
                tournamentId: id,
                userId: req.user._id
            });

            if (!competitor) {
                return res.status(404).json({
                    success: false,
                    message: 'You are not registered for this tournament'
                });
            }

            const tournament = await Tournament.findById(id);
            if (tournament.status !== 'upcoming') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot withdraw from ongoing or completed tournament'
                });
            }

            // Remove competitor
            await Competitor.findByIdAndDelete(competitor._id);

            // Update tournament participant count
            await tournament.removeTeam(competitor._id);

            res.json({
                success: true,
                message: 'Successfully withdrew from tournament'
            });
        } catch (error) {
            console.error('Tournament withdrawal error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during tournament withdrawal'
            });
        }
    }

    // Get tournament participants
    static async getTournamentParticipants(req, res) {
        try {
            const { id } = req.params;

            const competitors = await Competitor.findByTournament(id);

            res.json({
                success: true,
                data: { competitors }
            });
        } catch (error) {
            console.error('Get participants error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching participants'
            });
        }
    }

    // Get tournaments by organizer
    static async getTournamentsByOrganizer(req, res) {
        try {
            const { organizerId } = req.params;

            const tournaments = await Tournament.findByOrganizer(organizerId);

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

            const tournament = await Tournament.findById(id);
            if (!tournament) {
                return res.status(404).json({
                    success: false,
                    message: 'Tournament not found'
                });
            }

            await tournament.updateStatus(status);

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
            const tournaments = await Tournament.findUpcoming()
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
            const tournaments = await Tournament.findOngoing()
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
}

module.exports = TournamentController;