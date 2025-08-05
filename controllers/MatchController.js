const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const Competitor = require('../models/Competitor');

class MatchController {
    // Create new match
    static async createMatch(req, res) {
        try {
            const {
                tournamentId,
                teamAId,
                teamBId,
                scheduleAt,
                round = 1,
                bracket = 'winners',
                bestOf = 1,
                refereeId
            } = req.body;

            // Validate tournament exists
            const tournament = await Tournament.findById(tournamentId);
            if (!tournament) {
                return res.status(404).json({
                    success: false,
                    message: 'Tournament not found'
                });
            }

            // Validate competitors exist and belong to tournament
            const [teamA, teamB] = await Promise.all([
                Competitor.findOne({ _id: teamAId, tournamentId }),
                Competitor.findOne({ _id: teamBId, tournamentId })
            ]);

            if (!teamA || !teamB) {
                return res.status(400).json({
                    success: false,
                    message: 'One or both competitors not found in this tournament'
                });
            }

            const match = new Match({
                tournamentId,
                teamAId,
                teamBId,
                scheduleAt: new Date(scheduleAt),
                round,
                bracket,
                bestOf,
                refereeId
            });

            await match.save();

            const populatedMatch = await Match.findById(match._id)
                .populate('teamAId', 'name logo')
                .populate('teamBId', 'name logo')
                .populate('tournamentId', 'name format')
                .populate('refereeId', 'fullName email');

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
                status,
                round,
                bracket,
                sortBy = 'scheduleAt',
                sortOrder = 'asc'
            } = req.query;

            const query = {};

            // Add filters
            if (tournamentId) query.tournamentId = tournamentId;
            if (status) query.status = status;
            if (round) query.round = parseInt(round);
            if (bracket) query.bracket = bracket;

            // Sort configuration
            const sortConfig = {};
            sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const matches = await Match.find(query)
                .populate('teamAId', 'name logo')
                .populate('teamBId', 'name logo')
                .populate('tournamentId', 'name format status')
                .populate('winnerId', 'name logo')
                .sort(sortConfig)
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
                .populate('teamAId', 'name logo userId')
                .populate('teamBId', 'name logo userId')
                .populate('tournamentId', 'name format status organizerId')
                .populate('winnerId', 'name logo')
                .populate('refereeId', 'fullName email')
                .populate('games.winner', 'name logo');

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
            const updateData = req.body;

            // Remove fields that shouldn't be updated directly
            delete updateData.winnerId;
            delete updateData.startTime;
            delete updateData.endTime;

            const match = await Match.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate([
                { path: 'teamAId', select: 'name logo' },
                { path: 'teamBId', select: 'name logo' },
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

            if (match.status !== 'scheduled') {
                return res.status(400).json({
                    success: false,
                    message: 'Match cannot be started from current status'
                });
            }

            await match.start();

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
            const { result, scoreA, scoreB } = req.body;

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

            await match.setResult(result || '', parseInt(scoreA), parseInt(scoreB));

            // Update competitor stats
            const teamA = await Competitor.findById(match.teamAId);
            const teamB = await Competitor.findById(match.teamBId);

            if (teamA && teamB) {
                if (match.winnerId && match.winnerId.equals(match.teamAId)) {
                    await teamA.updateStats(true);
                    await teamB.updateStats(false);
                } else if (match.winnerId && match.winnerId.equals(match.teamBId)) {
                    await teamB.updateStats(true);
                    await teamA.updateStats(false);
                }
            }

            const populatedMatch = await Match.findById(id)
                .populate('teamAId', 'name logo')
                .populate('teamBId', 'name logo')
                .populate('winnerId', 'name logo');

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

            await match.rescheduleNewDate(new Date(newDate));

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
            const { gameNumber, teamAScore, teamBScore, winnerId, duration, notes } = req.body;

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

            const matches = await Match.findByTournament(tournamentId)
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

            const matches = await Match.findByCompetitor(competitorId);

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

            const matches = await Match.findUpcoming()
                .populate('teamAId', 'name logo')
                .populate('teamBId', 'name logo')
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
            const matches = await Match.findOngoing()
                .populate('teamAId', 'name logo')
                .populate('teamBId', 'name logo')
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
            const { reason } = req.body;

            const match = await Match.findById(id);
            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            await match.cancel(reason || 'No reason provided');

            res.json({
                success: true,
                message: 'Match cancelled successfully',
                data: { match }
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
            const { reason } = req.body;

            const match = await Match.findById(id);
            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            await match.postpone(reason || 'No reason provided');

            res.json({
                success: true,
                message: 'Match postponed successfully',
                data: { match }
            });
        } catch (error) {
            console.error('Postpone match error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while postponing match'
            });
        }
    }
}

module.exports = MatchController;