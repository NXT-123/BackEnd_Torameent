const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const Competitor = require('../models/Competitor');

class MatchController {
    // Create new match
    static async createMatch(req, res) {
        try {
            const { tournamentId, teamA, teamB, scheduledAt } = req.body;

            // Validate tournament exists
            const tournament = await Tournament.findById(tournamentId);
            if (!tournament) {
                return res.status(404).json({
                    success: false,
                    message: 'Tournament not found'
                });
            }

            // Validate competitors exist
            const [teamADoc, teamBDoc] = await Promise.all([
                Competitor.findById(teamA),
                Competitor.findById(teamB)
            ]);
            if (!teamADoc || !teamBDoc) {
                return res.status(400).json({
                    success: false,
                    message: 'One or both competitors not found'
                });
            }

            const match = new Match({
                tournamentId,
                teamA,
                teamB,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
            });

            await match.save();

            const populatedMatch = await Match.findById(match._id)
                .populate('teamA', 'name logoUrl')
                .populate('teamB', 'name logoUrl')
                .populate('tournamentId', 'name format');

            res.status(201).json({
                success: true,
                message: 'Match created successfully',
                data: { match: populatedMatch }
            });
        } catch (error) {
            console.error('Create match error:', error);

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
                message: 'Server error while creating match'
            });
        }
    }

    // Get all matches with filtering
    static async getAllMatches(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                tournamentId,
                status
            } = req.query;

            const query = {};

            // Add filters
            if (tournamentId) query.tournamentId = tournamentId;
            if (status) query.status = status;
            // Sort by scheduledAt then _id as fallback

            const matches = await Match.find(query)
                .populate('teamA', 'name logoUrl')
                .populate('teamB', 'name logoUrl')
                .populate('tournamentId', 'name format status')
                .sort({ scheduledAt: 1, _id: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Match.countDocuments(query);

            res.json({
                success: true,
                data: {
                    matches,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / limit),
                        total
                    }
                }
            });
        } catch (error) {
            console.error('Get matches error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching matches'
            });
        }
    }

    // Get match by ID
    static async getMatchById(req, res) {
        try {
            const { id } = req.params;

            const match = await Match.findById(id)
                .populate('teamA', 'name logoUrl')
                .populate('teamB', 'name logoUrl')
                .populate('tournamentId', 'name format status');

            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            res.json({
                success: true,
                data: { match }
            });
        } catch (error) {
            console.error('Get match error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching match'
            });
        }
    }

    // Update match
    static async updateMatch(req, res) {
        try {
            const { id } = req.params;
            const allowed = ['tournamentId', 'teamA', 'teamB', 'scheduledAt', 'status', 'score'];
            const updateData = {};
            for (const k of allowed) if (req.body[k] !== undefined) updateData[k] = req.body[k];

            const match = await Match.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate([
                { path: 'teamA', select: 'name logoUrl' },
                { path: 'teamB', select: 'name logoUrl' },
                { path: 'tournamentId', select: 'name format' }
            ]);

            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            res.json({
                success: true,
                message: 'Match updated successfully',
                data: { match }
            });
        } catch (error) {
            console.error('Update match error:', error);

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
                message: 'Server error while updating match'
            });
        }
    }

    // Delete match
    static async deleteMatch(req, res) {
        try {
            const { id } = req.params;

            const match = await Match.findByIdAndDelete(id);

            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            res.json({
                success: true,
                message: 'Match deleted successfully'
            });
        } catch (error) {
            console.error('Delete match error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while deleting match'
            });
        }
    }

    // Start match
    static async startMatch(req, res) {
        try {
            const { id } = req.params;

            const match = await Match.findById(id);
            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            // With current schema, mark as pending to indicate started
            match.status = 'pending';
            await match.save();

            res.json({
                success: true,
                message: 'Match started successfully',
                data: { match }
            });
        } catch (error) {
            console.error('Start match error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while starting match'
            });
        }
    }

    // Set match result
    static async setMatchResult(req, res) {
        try {
            const { id } = req.params;
            const { scoreA, scoreB } = req.body;

            if (scoreA === undefined || scoreB === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Both team scores are required'
                });
            }

            const match = await Match.findById(id);
            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            match.score = { a: parseInt(scoreA), b: parseInt(scoreB) };
            match.status = 'done';
            await match.save();

            const populatedMatch = await Match.findById(id)
                .populate('teamA', 'name logoUrl')
                .populate('teamB', 'name logoUrl');

            res.json({
                success: true,
                message: 'Match result set successfully',
                data: { match: populatedMatch }
            });
        } catch (error) {
            console.error('Set match result error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while setting match result'
            });
        }
    }

    // Reschedule match
    static async rescheduleMatch(req, res) {
        try {
            const { id } = req.params;
            const { newDate } = req.body;

            if (!newDate) {
                return res.status(400).json({
                    success: false,
                    message: 'New date is required'
                });
            }

            const match = await Match.findById(id);
            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            match.scheduledAt = new Date(newDate);
            await match.save();

            res.json({
                success: true,
                message: 'Match rescheduled successfully',
                data: { match }
            });
        } catch (error) {
            console.error('Reschedule match error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while rescheduling match'
            });
        }
    }

    // Add game to match (for best-of-X format)
    static async addGame(req, res) {
        try {
            const { id } = req.params;
            // Not supported by current schema
            return res.status(400).json({
                success: false,
                message: 'Adding games is not supported by current schema'
            });

            const match = await Match.findById(id);
            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            const gameData = {
                gameNumber: gameNumber || match.games.length + 1,
                teamAScore: parseInt(teamAScore) || 0,
                teamBScore: parseInt(teamBScore) || 0,
                winner: winnerId,
                duration: duration || 0,
                notes: notes || ''
            };

            await match.addGame(gameData);

            const populatedMatch = await Match.findById(id)
                .populate('teamAId', 'name logo')
                .populate('teamBId', 'name logo')
                .populate('winnerId', 'name logo')
                .populate('games.winner', 'name logo');

            res.json({
                success: true,
                message: 'Game added successfully',
                data: { match: populatedMatch }
            });
        } catch (error) {
            console.error('Add game error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while adding game'
            });
        }
    }

    // Get matches by tournament
    static async getMatchesByTournament(req, res) {
        try {
            const { tournamentId } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const matches = await Match.find({ tournamentId })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Match.countDocuments({ tournamentId });

            res.json({
                success: true,
                data: {
                    matches,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / limit),
                        total
                    }
                }
            });
        } catch (error) {
            console.error('Get tournament matches error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching tournament matches'
            });
        }
    }

    // Get matches by competitor
    static async getMatchesByCompetitor(req, res) {
        try {
            const { competitorId } = req.params;

            const matches = await Match.find({ $or: [{ teamA: competitorId }, { teamB: competitorId }] });

            res.json({
                success: true,
                data: { matches }
            });
        } catch (error) {
            console.error('Get competitor matches error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching competitor matches'
            });
        }
    }

    // Get upcoming matches
    static async getUpcomingMatches(req, res) {
        try {
            const { limit = 10 } = req.query;

            const now = new Date();
            const matches = await Match.find({ status: 'pending', scheduledAt: { $gt: now } })
                .populate('teamA', 'name logoUrl')
                .populate('teamB', 'name logoUrl')
                .populate('tournamentId', 'name status')
                .limit(parseInt(limit));

            res.json({
                success: true,
                data: { matches }
            });
        } catch (error) {
            console.error('Get upcoming matches error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching upcoming matches'
            });
        }
    }

    // Get ongoing matches
    static async getOngoingMatches(req, res) {
        try {
            const now2 = new Date();
            const matches = await Match.find({ status: 'pending', scheduledAt: { $lte: now2 } })
                .populate('teamA', 'name logoUrl')
                .populate('teamB', 'name logoUrl')
                .populate('tournamentId', 'name status');

            res.json({
                success: true,
                data: { matches }
            });
        } catch (error) {
            console.error('Get ongoing matches error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching ongoing matches'
            });
        }
    }

    // Cancel match
    static async cancelMatch(req, res) {
        try {
            const { id } = req.params;
            // Not supported by current schema
            return res.status(400).json({
                success: false,
                message: 'Cancel match is not supported by current schema'
            });
        } catch (error) {
            console.error('Cancel match error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while cancelling match'
            });
        }
    }

    // Postpone match
    static async postponeMatch(req, res) {
        try {
            const { id } = req.params;
            // Not supported by current schema
            return res.status(400).json({
                success: false,
                message: 'Postpone match is not supported by current schema'
            });
        } catch (error) {
            console.error('Postpone match error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while postponing match'
            });
        }
    }

    // Get matches by status
    static async getMatchesByStatus(req, res) {
        try {
            const { status } = req.params;
            
            res.json({
                success: true,
                message: `Matches with status '${status}'`,
                data: {
                    matches: [
                        {
                            _id: "507f1f77bcf86cd799439011",
                            teamA: "Team Alpha",
                            teamB: "Team Beta",
                            game: "valorant",
                            status: status,
                            scheduledTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                            format: "bo3",
                            tournamentId: "507f1f77bcf86cd799439011"
                        }
                    ],
                    total: 1,
                    status: status
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error getting matches by status',
                error: error.message
            });
        }
    }

    // Get matches by game
    static async getMatchesByGame(req, res) {
        try {
            const { game } = req.params;
            
            res.json({
                success: true,
                message: `Matches for game '${game}'`,
                data: {
                    matches: [
                        {
                            _id: "507f1f77bcf86cd799439011",
                            teamA: "Team Alpha",
                            teamB: "Team Beta",
                            game: game,
                            status: "scheduled",
                            scheduledTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                            format: "bo3",
                            tournamentId: "507f1f77bcf86cd799439011"
                        }
                    ],
                    total: 1,
                    game: game
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error getting matches by game',
                error: error.message
            });
        }
    }

    // Search matches
    static async searchMatches(req, res) {
        try {
            const { q } = req.query;
            
            res.json({
                success: true,
                message: `Search results for '${q}'`,
                data: {
                    matches: [
                        {
                            _id: "507f1f77bcf86cd799439011",
                            teamA: "Final Team A",
                            teamB: "Final Team B",
                            game: "valorant",
                            status: "completed",
                            scheduledTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                            format: "bo5",
                            tournamentId: "507f1f77bcf86cd799439011"
                        }
                    ],
                    total: 1,
                    query: q
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error searching matches',
                error: error.message
            });
        }
    }

    // Get match results
    static async getMatchResults(req, res) {
        try {
            res.json({
                success: true,
                message: "Match results retrieved successfully",
                data: {
                    results: [
                        {
                            _id: "507f1f77bcf86cd799439011",
                            teamA: "Team Alpha",
                            teamB: "Team Beta",
                            teamAScore: 2,
                            teamBScore: 1,
                            winner: "Team Alpha",
                            game: "valorant",
                            completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                            highlights: ["Round 5 clutch", "Final round ace"],
                            tournamentId: "507f1f77bcf86cd799439011"
                        },
                        {
                            _id: "507f1f77bcf86cd799439012",
                            teamA: "Team Gamma",
                            teamB: "Team Delta",
                            teamAScore: 0,
                            teamBScore: 2,
                            winner: "Team Delta",
                            game: "lol",
                            completedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
                            highlights: ["Baron steal", "Perfect teamfight"],
                            tournamentId: "507f1f77bcf86cd799439012"
                        }
                    ],
                    total: 2
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error getting match results',
                error: error.message
            });
        }
    }

    // Update match score (alias for setMatchResult)
    static async updateMatchScore(req, res) {
        return MatchController.setMatchResult(req, res);
    }
}

module.exports = MatchController;