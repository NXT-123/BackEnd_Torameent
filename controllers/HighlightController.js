const Highlight = require('../models/Highlight');

class HighlightController {
    // Create new highlight
    static async createHighlight(req, res) {
        try {
            const {
                title,
                description,
                url,
                tournamentId,
                matchId,
                type = 'video',
                duration,
                thumbnail,
                platform = 'custom',
                externalId,
                tags = [],
                creatorName,
                isFeatured = false,
                metadata = {}
            } = req.body;

            const highlight = new Highlight({
                title,
                description,
                url,
                tournamentId,
                matchId,
                type,
                duration: duration || 0,
                thumbnail,
                platform,
                externalId,
                tags,
                creatorId: req.user._id,
                creatorName: creatorName || req.user.fullName,
                isFeatured,
                metadata
            });

            await highlight.save();

            const populatedHighlight = await Highlight.findById(highlight._id)
                .populate('tournamentId', 'name status logo')
                .populate('matchId', 'teamAId teamBId scheduleAt')
                .populate('creatorId', 'fullName email');

            res.status(201).json({
                success: true,
                message: 'Highlight created successfully',
                data: { highlight: populatedHighlight }
            });
        } catch (error) {
            console.error('Create highlight error:', error);
            
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
                message: 'Server error while creating highlight'
            });
        }
    }

    // Get all highlights with filtering and pagination
    static async getAllHighlights(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                tournamentId,
                matchId,
                type,
                platform,
                search,
                sortBy = 'publishedAt',
                sortOrder = 'desc'
            } = req.query;

            const query = { 
                status: 'published',
                isPublic: true 
            };

            // Add filters
            if (tournamentId) query.tournamentId = tournamentId;
            if (matchId) query.matchId = matchId;
            if (type) query.type = type;
            if (platform) query.platform = platform;
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search, 'i')] } }
                ];
            }

            // Sort configuration
            const sortConfig = {};
            sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const highlights = await Highlight.find(query)
                .populate('tournamentId', 'name status logo')
                .populate('matchId', 'teamAId teamBId scheduleAt')
                .populate('creatorId', 'fullName email avatar')
                .sort(sortConfig)
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Highlight.countDocuments(query);

            res.json({
                success: true,
                data: {
                    highlights,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / limit),
                        total
                    }
                }
            });
        } catch (error) {
            console.error('Get highlights error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching highlights'
            });
        }
    }

    // Get highlight by ID
    static async getHighlightById(req, res) {
        try {
            const { id } = req.params;

            const highlight = await Highlight.findById(id)
                .populate('tournamentId', 'name status logo organizerId')
                .populate('matchId', 'teamAId teamBId scheduleAt result')
                .populate('creatorId', 'fullName email avatar');

            if (!highlight) {
                return res.status(404).json({
                    success: false,
                    message: 'Highlight not found'
                });
            }

            // Increment views
            await highlight.incrementViews();

            res.json({
                success: true,
                data: { highlight }
            });
        } catch (error) {
            console.error('Get highlight error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching highlight'
            });
        }
    }

    // Update highlight
    static async updateHighlight(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Remove fields that shouldn't be updated
            delete updateData.creatorId;
            delete updateData.views;
            delete updateData.likes;
            delete updateData.shares;

            const highlight = await Highlight.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate([
                { path: 'tournamentId', select: 'name status logo' },
                { path: 'matchId', select: 'teamAId teamBId scheduleAt' },
                { path: 'creatorId', select: 'fullName email' }
            ]);

            if (!highlight) {
                return res.status(404).json({
                    success: false,
                    message: 'Highlight not found'
                });
            }

            res.json({
                success: true,
                message: 'Highlight updated successfully',
                data: { highlight }
            });
        } catch (error) {
            console.error('Update highlight error:', error);
            
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
                message: 'Server error while updating highlight'
            });
        }
    }

    // Delete highlight
    static async deleteHighlight(req, res) {
        try {
            const { id } = req.params;

            const highlight = await Highlight.findByIdAndDelete(id);

            if (!highlight) {
                return res.status(404).json({
                    success: false,
                    message: 'Highlight not found'
                });
            }

            res.json({
                success: true,
                message: 'Highlight deleted successfully'
            });
        } catch (error) {
            console.error('Delete highlight error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while deleting highlight'
            });
        }
    }

    // Get highlights by tournament
    static async getHighlightsByTournament(req, res) {
        try {
            const { tournamentId } = req.params;
            const { page = 1, limit = 10, type } = req.query;

            let query = { tournamentId };
            if (type) query.type = type;

            const highlights = await Highlight.findByTournament(tournamentId)
                .find(type ? { type } : {})
                .populate('matchId', 'teamAId teamBId scheduleAt')
                .populate('creatorId', 'fullName email avatar')
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Highlight.countDocuments({ 
                tournamentId,
                status: 'published',
                isPublic: true,
                ...(type && { type })
            });

            res.json({
                success: true,
                data: {
                    highlights,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / limit),
                        total
                    }
                }
            });
        } catch (error) {
            console.error('Get tournament highlights error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching tournament highlights'
            });
        }
    }

    // Get highlights by match
    static async getHighlightsByMatch(req, res) {
        try {
            const { matchId } = req.params;

            const highlights = await Highlight.findByMatch(matchId)
                .populate('tournamentId', 'name status logo')
                .populate('creatorId', 'fullName email avatar');

            res.json({
                success: true,
                data: { highlights }
            });
        } catch (error) {
            console.error('Get match highlights error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching match highlights'
            });
        }
    }

    // Get featured highlights
    static async getFeaturedHighlights(req, res) {
        try {
            const { limit = 5 } = req.query;

            const highlights = await Highlight.findFeatured()
                .populate('tournamentId', 'name status logo')
                .populate('matchId', 'teamAId teamBId scheduleAt')
                .populate('creatorId', 'fullName email avatar')
                .limit(parseInt(limit));

            res.json({
                success: true,
                data: { highlights }
            });
        } catch (error) {
            console.error('Get featured highlights error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching featured highlights'
            });
        }
    }

    // Get popular highlights
    static async getPopularHighlights(req, res) {
        try {
            const { limit = 10 } = req.query;

            const highlights = await Highlight.findPopular(parseInt(limit))
                .populate('tournamentId', 'name status logo')
                .populate('matchId', 'teamAId teamBId scheduleAt')
                .populate('creatorId', 'fullName email avatar');

            res.json({
                success: true,
                data: { highlights }
            });
        } catch (error) {
            console.error('Get popular highlights error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching popular highlights'
            });
        }
    }

    // Like highlight
    static async likeHighlight(req, res) {
        try {
            const { id } = req.params;

            const highlight = await Highlight.findById(id);
            if (!highlight) {
                return res.status(404).json({
                    success: false,
                    message: 'Highlight not found'
                });
            }

            await highlight.toggleLike();

            res.json({
                success: true,
                message: 'Highlight liked successfully',
                data: { likes: highlight.likes }
            });
        } catch (error) {
            console.error('Like highlight error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while liking highlight'
            });
        }
    }

    // Share highlight
    static async shareHighlight(req, res) {
        try {
            const { id } = req.params;

            const highlight = await Highlight.findById(id);
            if (!highlight) {
                return res.status(404).json({
                    success: false,
                    message: 'Highlight not found'
                });
            }

            await highlight.incrementShares();

            res.json({
                success: true,
                message: 'Highlight shared successfully',
                data: { shares: highlight.shares }
            });
        } catch (error) {
            console.error('Share highlight error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while sharing highlight'
            });
        }
    }

    // Set highlight as featured
    static async setFeatured(req, res) {
        try {
            const { id } = req.params;
            const { featured = true, featuredUntil } = req.body;

            const highlight = await Highlight.findById(id);
            if (!highlight) {
                return res.status(404).json({
                    success: false,
                    message: 'Highlight not found'
                });
            }

            await highlight.setFeatured(featured, featuredUntil ? new Date(featuredUntil) : null);

            res.json({
                success: true,
                message: `Highlight ${featured ? 'featured' : 'unfeatured'} successfully`,
                data: { highlight }
            });
        } catch (error) {
            console.error('Set featured highlight error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while setting highlight featured status'
            });
        }
    }

    // Attach highlight to match
    static async attachToMatch(req, res) {
        try {
            const { id } = req.params;
            const { matchId } = req.body;

            const highlight = await Highlight.findById(id);
            if (!highlight) {
                return res.status(404).json({
                    success: false,
                    message: 'Highlight not found'
                });
            }

            await highlight.attachToMatch(matchId);

            const populatedHighlight = await Highlight.findById(id)
                .populate('matchId', 'teamAId teamBId scheduleAt result');

            res.json({
                success: true,
                message: 'Highlight attached to match successfully',
                data: { highlight: populatedHighlight }
            });
        } catch (error) {
            console.error('Attach highlight to match error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while attaching highlight to match'
            });
        }
    }

    // Search highlights
    static async searchHighlights(req, res) {
        try {
            const { q, page = 1, limit = 10 } = req.query;

            if (!q || q.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }

            const highlights = await Highlight.searchByTitle(q.trim())
                .populate('tournamentId', 'name status logo')
                .populate('matchId', 'teamAId teamBId scheduleAt')
                .populate('creatorId', 'fullName email avatar')
                .limit(limit * 1)
                .skip((page - 1) * limit);

            res.json({
                success: true,
                data: { highlights }
            });
        } catch (error) {
            console.error('Search highlights error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while searching highlights'
            });
        }
    }

    // Get highlights by type
    static async getHighlightsByType(req, res) {
        try {
            const { type } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const highlights = await Highlight.findByType(type)
                .populate('tournamentId', 'name status logo')
                .populate('matchId', 'teamAId teamBId scheduleAt')
                .populate('creatorId', 'fullName email avatar')
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Highlight.countDocuments({ 
                type,
                status: 'published',
                isPublic: true 
            });

            res.json({
                success: true,
                data: {
                    highlights,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / limit),
                        total
                    }
                }
            });
        } catch (error) {
            console.error('Get highlights by type error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching highlights by type'
            });
        }
    }

    // Update highlight status
    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const highlight = await Highlight.findById(id);
            if (!highlight) {
                return res.status(404).json({
                    success: false,
                    message: 'Highlight not found'
                });
            }

            await highlight.updateStatus(status);

            res.json({
                success: true,
                message: 'Highlight status updated successfully',
                data: { highlight }
            });
        } catch (error) {
            console.error('Update highlight status error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while updating highlight status'
            });
        }
    }
}

module.exports = HighlightController;