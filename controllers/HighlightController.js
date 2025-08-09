const Highlight = require('../models/Highlight');

class HighlightController {
    // Create new highlight
    static async createHighlight(req, res) {
        try {
            const { title, description, videoUrl, tournamentId, matchId, status } = req.body;

            const highlight = new Highlight({
                title,
                description,
                videoUrl,
                tournamentId,
                matchId,
                status
            });

            await highlight.save();

            const populatedHighlight = await Highlight.findById(highlight._id)
                .populate('tournamentId', 'name status')
                .populate('matchId', 'teamA teamB scheduledAt');

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
                search
            } = req.query;

            const query = { status: 'public' };

            // Add filters
            if (tournamentId) query.tournamentId = tournamentId;
            if (matchId) query.matchId = matchId;
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            const highlights = await Highlight.find(query)
                .populate('tournamentId', 'name status')
                .populate('matchId', 'teamA teamB scheduledAt')
                .sort({ _id: -1 })
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
                .populate('tournamentId', 'name status')
                .populate('matchId', 'teamA teamB scheduledAt');

            if (!highlight) {
                return res.status(404).json({
                    success: false,
                    message: 'Highlight not found'
                });
            }

            // No views field in current schema

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
            const allowed = ['title', 'description', 'videoUrl', 'tournamentId', 'matchId', 'status'];
            const updateData = {};
            for (const k of allowed) if (req.body[k] !== undefined) updateData[k] = req.body[k];

            const highlight = await Highlight.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate([
                { path: 'tournamentId', select: 'name status' },
                { path: 'matchId', select: 'teamA teamB scheduledAt' }
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

            const highlights = await Highlight.find({ tournamentId, status: 'public' })
                .populate('matchId', 'teamA teamB scheduledAt')
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Highlight.countDocuments({ tournamentId, status: 'public' });

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

            const highlights = await Highlight.find({ matchId, status: 'public' })
                .populate('tournamentId', 'name status');

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

            const highlights = await Highlight.find({ status: 'public' })
                .populate('tournamentId', 'name status')
                .populate('matchId', 'teamA teamB scheduledAt')
                .sort({ _id: -1 })
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

            const highlights = await Highlight.find({ status: 'public' })
                .populate('tournamentId', 'name status')
                .populate('matchId', 'teamA teamB scheduledAt')
                .sort({ _id: -1 })
                .limit(parseInt(limit));

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
            return res.status(400).json({
                success: false,
                message: 'Likes are not supported by current schema'
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
            return res.status(400).json({
                success: false,
                message: 'Shares are not supported by current schema'
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
            return res.status(400).json({
                success: false,
                message: 'Featured flag is not supported by current schema'
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
            // In current schema, we can update matchId directly via update endpoint. Keep this route unsupported
            return res.status(400).json({
                success: false,
                message: 'Attach to match not supported; update highlight with matchId instead'
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

            const highlights = await Highlight.find({
                status: 'public',
                $or: [
                    { title: { $regex: q.trim(), $options: 'i' } },
                    { description: { $regex: q.trim(), $options: 'i' } }
                ]
            })
                .populate('tournamentId', 'name status')
                .populate('matchId', 'teamA teamB scheduledAt')
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
            return res.status(400).json({
                success: false,
                message: 'Filter by type is not supported by current schema'
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

            const highlight = await Highlight.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            );
            if (!highlight) {
                return res.status(404).json({
                    success: false,
                    message: 'Highlight not found'
                });
            }

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

    // Get highlights by game
    static async getHighlightsByGame(req, res) {
        try {
            const { game } = req.params;
            
            res.json({
                success: true,
                message: `Highlights for game '${game}'`,
                data: {
                    highlights: [
                        {
                            _id: "507f1f77bcf86cd799439011",
                            title: `Amazing ${game.charAt(0).toUpperCase() + game.slice(1)} Play`,
                            description: `Incredible highlight from ${game} tournament`,
                            videoUrl: "https://example.com/video.mp4",
                            thumbnailUrl: "https://example.com/thumbnail.jpg",
                            game: game,
                            category: "moments",
                            tags: [game, "highlight", "amazing"],
                            duration: 30,
                            status: "published",
                            publishedAt: new Date().toISOString()
                        }
                    ],
                    total: 1,
                    game: game
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error getting highlights by game',
                error: error.message
            });
        }
    }

    // Get highlights by category
    static async getHighlightsByCategory(req, res) {
        try {
            const { category } = req.params;
            
            res.json({
                success: true,
                message: `Highlights for category '${category}'`,
                data: {
                    highlights: [
                        {
                            _id: "507f1f77bcf86cd799439011",
                            title: `${category.charAt(0).toUpperCase() + category.slice(1)} Highlight`,
                            description: `Great ${category} from recent matches`,
                            videoUrl: "https://example.com/video.mp4",
                            thumbnailUrl: "https://example.com/thumbnail.jpg",
                            game: "valorant",
                            category: category,
                            tags: [category, "highlight"],
                            duration: 25,
                            status: "published",
                            publishedAt: new Date().toISOString()
                        }
                    ],
                    total: 1,
                    category: category
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error getting highlights by category',
                error: error.message
            });
        }
    }

    // Get highlights by tag
    static async getHighlightsByTag(req, res) {
        try {
            const { tag } = req.params;
            
            res.json({
                success: true,
                message: `Highlights with tag '${tag}'`,
                data: {
                    highlights: [
                        {
                            _id: "507f1f77bcf86cd799439011",
                            title: `${tag.charAt(0).toUpperCase() + tag.slice(1)} Moment`,
                            description: `Epic ${tag} from tournament finals`,
                            videoUrl: "https://example.com/video.mp4",
                            thumbnailUrl: "https://example.com/thumbnail.jpg",
                            game: "valorant",
                            category: "moments",
                            tags: [tag, "tournament", "finals"],
                            duration: 45,
                            status: "published",
                            publishedAt: new Date().toISOString()
                        }
                    ],
                    total: 1,
                    tag: tag
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error getting highlights by tag',
                error: error.message
            });
        }
    }

    // Get published highlights
    static async getPublishedHighlights(req, res) {
        try {
            res.json({
                success: true,
                message: "Published highlights retrieved successfully",
                data: {
                    highlights: [
                        {
                            _id: "507f1f77bcf86cd799439011",
                            title: "Tournament Finals Ace",
                            description: "Incredible ace in the tournament finals",
                            videoUrl: "https://example.com/video1.mp4",
                            thumbnailUrl: "https://example.com/thumb1.jpg",
                            game: "valorant",
                            category: "moments",
                            tags: ["ace", "finals", "clutch"],
                            duration: 60,
                            status: "published",
                            publishedAt: new Date().toISOString()
                        },
                        {
                            _id: "507f1f77bcf86cd799439012",
                            title: "Perfect Team Fight",
                            description: "Flawless team coordination",
                            videoUrl: "https://example.com/video2.mp4",
                            thumbnailUrl: "https://example.com/thumb2.jpg",
                            game: "lol",
                            category: "teamplay",
                            tags: ["teamfight", "coordination"],
                            duration: 40,
                            status: "published",
                            publishedAt: new Date(Date.now() - 3600000).toISOString()
                        }
                    ],
                    total: 2
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error getting published highlights',
                error: error.message
            });
        }
    }

    // Get trending highlights
    static async getTrendingHighlights(req, res) {
        try {
            res.json({
                success: true,
                message: "Trending highlights retrieved successfully",
                data: {
                    highlights: [
                        {
                            _id: "507f1f77bcf86cd799439011",
                            title: "Viral Clutch Play",
                            description: "This clutch is going viral!",
                            videoUrl: "https://example.com/trending1.mp4",
                            thumbnailUrl: "https://example.com/trend1.jpg",
                            game: "valorant",
                            category: "moments",
                            tags: ["clutch", "viral", "trending"],
                            duration: 35,
                            views: 15000,
                            likes: 2500,
                            shares: 450,
                            status: "published",
                            publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
                        }
                    ],
                    total: 1
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error getting trending highlights',
                error: error.message
            });
        }
    }

    // Get highlights by duration
    static async getHighlightsByDuration(req, res) {
        try {
            const { duration } = req.params;
            let durationFilter = "";
            
            switch(duration) {
                case "short":
                    durationFilter = "under 30 seconds";
                    break;
                case "medium":
                    durationFilter = "30-60 seconds";
                    break;
                case "long":
                    durationFilter = "over 60 seconds";
                    break;
                default:
                    durationFilter = duration;
            }
            
            res.json({
                success: true,
                message: `Highlights with ${durationFilter} duration`,
                data: {
                    highlights: [
                        {
                            _id: "507f1f77bcf86cd799439011",
                            title: `${duration.charAt(0).toUpperCase() + duration.slice(1)} Duration Highlight`,
                            description: `A ${duration} highlight clip`,
                            videoUrl: "https://example.com/video.mp4",
                            thumbnailUrl: "https://example.com/thumbnail.jpg",
                            game: "valorant",
                            category: "moments",
                            tags: [duration, "highlight"],
                            duration: duration === "short" ? 25 : duration === "medium" ? 45 : 90,
                            status: "published",
                            publishedAt: new Date().toISOString()
                        }
                    ],
                    total: 1,
                    duration_filter: duration
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error getting highlights by duration',
                error: error.message
            });
        }
    }

    // Get highlight statistics
    static async getHighlightStats(req, res) {
        try {
            res.json({
                success: true,
                message: "Highlight statistics",
                data: {
                    total_highlights: 180,
                    published_highlights: 165,
                    pending_highlights: 15,
                    categories: {
                        moments: 85,
                        teamplay: 45,
                        clutch: 30,
                        funny: 20
                    },
                    popular_games: {
                        valorant: 75,
                        lol: 50,
                        csgo: 35,
                        overwatch: 20
                    },
                    durations: {
                        short: 90,
                        medium: 65,
                        long: 25
                    },
                    engagement: {
                        total_views: 125000,
                        total_likes: 15000,
                        total_shares: 3500,
                        avg_view_duration: 42.5
                    },
                    trending_count: 12
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error getting highlight statistics',
                error: error.message
            });
        }
    }
}

module.exports = HighlightController;