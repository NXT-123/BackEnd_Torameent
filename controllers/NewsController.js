const News = require('../models/News');

class NewsController {
    // Create new news article
    static async createNews(req, res) {
        try {
            const { title, content, tournamentId, images = [] } = req.body;

            const news = new News({
                title,
                content,
                authorId: req.user._id,
                tournamentId,
                images
            });

            await news.save();

            const populatedNews = await News.findById(news._id)
                .populate('authorId', 'fullName email')
                .populate('tournamentId', 'name status');

            res.status(201).json({
                success: true,
                message: 'News article created successfully',
                data: { news: populatedNews }
            });
        } catch (error) {
            console.error('Create news error:', error);

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
                message: 'Server error while creating news article'
            });
        }
    }

    // Get all published news with filtering and pagination
    static async getAllNews(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                tournamentId,
                search
            } = req.query;

            const query = { status: 'public' };

            // Add filters
            if (tournamentId) query.tournamentId = tournamentId;
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { content: { $regex: search, $options: 'i' } }
                ];
            }

            const news = await News.find(query)
                .populate('authorId', 'fullName email')
                .populate('tournamentId', 'name status')
                .sort({ publishedAt: -1, _id: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await News.countDocuments(query);

            res.json({
                success: true,
                data: {
                    news,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / limit),
                        total
                    }
                }
            });
        } catch (error) {
            console.error('Get news error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching news'
            });
        }
    }

    // Get news by ID or slug
    static async getNewsById(req, res) {
        try {
            const { id } = req.params;
            let news;

            // Find by ID only (no slug in current schema)
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                news = await News.findById(id);
            }

            if (!news) {
                return res.status(404).json({
                    success: false,
                    message: 'News article not found'
                });
            }

            // Populate related data
            await news.populate([
                { path: 'authorId', select: 'fullName email' },
                { path: 'tournamentId', select: 'name status' }
            ]);

            res.json({
                success: true,
                data: { news }
            });
        } catch (error) {
            console.error('Get news by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching news article'
            });
        }
    }

    // Update news article
    static async updateNews(req, res) {
        try {
            const { id } = req.params;
            const allowed = ['title', 'content', 'tournamentId', 'images', 'status', 'publishedAt'];
            const updateData = {};
            for (const k of allowed) if (req.body[k] !== undefined) updateData[k] = req.body[k];

            const news = await News.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate([
                { path: 'authorId', select: 'fullName email' },
                { path: 'tournamentId', select: 'name status' }
            ]);

            if (!news) {
                return res.status(404).json({
                    success: false,
                    message: 'News article not found'
                });
            }

            res.json({
                success: true,
                message: 'News article updated successfully',
                data: { news }
            });
        } catch (error) {
            console.error('Update news error:', error);

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
                message: 'Server error while updating news article'
            });
        }
    }

    // Delete news article
    static async deleteNews(req, res) {
        try {
            const { id } = req.params;

            const news = await News.findByIdAndDelete(id);

            if (!news) {
                return res.status(404).json({
                    success: false,
                    message: 'News article not found'
                });
            }

            res.json({
                success: true,
                message: 'News article deleted successfully'
            });
        } catch (error) {
            console.error('Delete news error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while deleting news article'
            });
        }
    }

    // Publish news article
    static async publishNews(req, res) {
        try {
            const { id } = req.params;

            const news = await News.findByIdAndUpdate(
                id,
                { status: 'public', publishedAt: new Date() },
                { new: true }
            );
            if (!news) {
                return res.status(404).json({
                    success: false,
                    message: 'News article not found'
                });
            }
            res.json({
                success: true,
                message: 'News article published successfully',
                data: { news }
            });
        } catch (error) {
            console.error('Publish news error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while publishing news article'
            });
        }
    }

    // Get news by tournament
    static async getNewsByTournament(req, res) {
        try {
            const { tournamentId } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const news = await News.find({ tournamentId, status: 'public' })
                .populate('authorId', 'fullName email')
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await News.countDocuments({ tournamentId, status: 'public' });

            res.json({
                success: true,
                data: {
                    news,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / limit),
                        total
                    }
                }
            });
        } catch (error) {
            console.error('Get tournament news error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching tournament news'
            });
        }
    }

    // Get featured news
    static async getFeaturedNews(req, res) {
        try {
            const { limit = 5 } = req.query;

            const news = await News.find({ status: 'public' })
                .populate('authorId', 'fullName email')
                .populate('tournamentId', 'name status')
                .sort({ publishedAt: -1, _id: -1 })
                .limit(parseInt(limit));

            res.json({
                success: true,
                data: { news }
            });
        } catch (error) {
            console.error('Get featured news error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching featured news'
            });
        }
    }

    // Add comment to news
    static async addComment(req, res) {
        try {
            const { id } = req.params;
            return res.status(400).json({
                success: false,
                message: 'Comments are not supported by current schema'
            });
        } catch (error) {
            console.error('Add comment error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while adding comment'
            });
        }
    }

    // Like news article
    static async likeNews(req, res) {
        try {
            const { id } = req.params;

            return res.status(400).json({
                success: false,
                message: 'Likes are not supported by current schema'
            });
        } catch (error) {
            console.error('Like news error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while liking news article'
            });
        }
    }

    // Search news
    static async searchNews(req, res) {
        try {
            const { q, page = 1, limit = 10 } = req.query;

            if (!q || q.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }

            const news = await News.find({
                status: 'public',
                $or: [
                    { title: { $regex: q.trim(), $options: 'i' } },
                    { content: { $regex: q.trim(), $options: 'i' } }
                ]
            })
                .populate('authorId', 'fullName email')
                .populate('tournamentId', 'name status')
                .limit(limit * 1)
                .skip((page - 1) * limit);

            res.json({
                success: true,
                data: { news }
            });
        } catch (error) {
            console.error('Search news error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while searching news'
            });
        }
    }

    // Get news by author
    static async getNewsByAuthor(req, res) {
        try {
            const { authorId } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const news = await News.find({ authorId })
                .populate('tournamentId', 'name status')
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await News.countDocuments({ authorId });

            res.json({
                success: true,
                data: {
                    news,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / limit),
                        total
                    }
                }
            });
        } catch (error) {
            console.error('Get author news error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching author news'
            });
        }
    }
}

module.exports = NewsController;