const News = require('../models/News');

class NewsController {
    // Create new news article
    static async createNews(req, res) {
        try {
            const {
                title,
                content,
                tournamentId,
                tags = [],
                priority = 'normal',
                metaDescription,
                images = [],
                isFeatured = false
            } = req.body;

            const news = new News({
                title,
                content,
                authorId: req.user._id,
                tournamentId,
                tags,
                priority,
                metaDescription,
                images,
                isFeatured
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
                priority,
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
            if (priority) query.priority = priority;
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { content: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search, 'i')] } }
                ];
            }

            // Sort configuration
            const sortConfig = {};
            sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const news = await News.find(query)
                .populate('authorId', 'fullName email avatar')
                .populate('tournamentId', 'name status logo')
                .sort(sortConfig)
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

            // Try to find by ID first, then by slug
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                news = await News.findById(id);
            } else {
                news = await News.findOne({ slug: id });
            }

            if (!news) {
                return res.status(404).json({
                    success: false,
                    message: 'News article not found'
                });
            }

            // Increment views
            await news.incrementViews();

            // Populate related data
            await news.populate([
                { path: 'authorId', select: 'fullName email avatar' },
                { path: 'tournamentId', select: 'name status logo' },
                { path: 'comments.userId', select: 'fullName avatar' }
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
            const updateData = req.body;

            // Remove fields that shouldn't be updated
            delete updateData.authorId;
            delete updateData.views;
            delete updateData.likes;

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

            const news = await News.findById(id);
            if (!news) {
                return res.status(404).json({
                    success: false,
                    message: 'News article not found'
                });
            }

            await news.publish();

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

            const news = await News.findByTournament(tournamentId)
                .populate('authorId', 'fullName email avatar')
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await News.countDocuments({ 
                tournamentId,
                status: 'published',
                isPublic: true 
            });

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

            const news = await News.findFeatured()
                .populate('authorId', 'fullName email avatar')
                .populate('tournamentId', 'name status logo')
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
            const { content } = req.body;

            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Comment content is required'
                });
            }

            const news = await News.findById(id);
            if (!news) {
                return res.status(404).json({
                    success: false,
                    message: 'News article not found'
                });
            }

            await news.addComment(req.user._id, content.trim());

            // Populate the newly added comment
            await news.populate('comments.userId', 'fullName avatar');

            res.status(201).json({
                success: true,
                message: 'Comment added successfully',
                data: { 
                    comment: news.comments[news.comments.length - 1]
                }
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

            const news = await News.findById(id);
            if (!news) {
                return res.status(404).json({
                    success: false,
                    message: 'News article not found'
                });
            }

            await news.toggleLike();

            res.json({
                success: true,
                message: 'News article liked successfully',
                data: { likes: news.likes }
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

            const news = await News.searchByTitle(q.trim())
                .populate('authorId', 'fullName email avatar')
                .populate('tournamentId', 'name status logo')
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

            const news = await News.findByAuthor(authorId)
                .populate('tournamentId', 'name status logo')
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