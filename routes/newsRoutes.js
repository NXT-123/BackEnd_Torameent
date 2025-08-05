const express = require('express');
const NewsController = require('../controllers/NewsController');
const { authenticateToken, authorize, checkTournamentOwnership, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', NewsController.getAllNews);
router.get('/featured', NewsController.getFeaturedNews);
router.get('/search', NewsController.searchNews);
router.get('/tournament/:tournamentId', NewsController.getNewsByTournament);
router.get('/author/:authorId', NewsController.getNewsByAuthor);
router.get('/:id', NewsController.getNewsById);

// Protected routes (require authentication)
router.use(authenticateToken);

// User routes (authenticated users can comment and like)
router.post('/:id/comment', NewsController.addComment);
router.post('/:id/like', NewsController.likeNews);

// Organizer/Admin routes (content creation and management)
router.post('/', authorize('organizer', 'admin'), NewsController.createNews);
router.put('/:id', authorize('organizer', 'admin'), NewsController.updateNews);
router.delete('/:id', authorize('organizer', 'admin'), NewsController.deleteNews);
router.put('/:id/publish', authorize('organizer', 'admin'), NewsController.publishNews);

module.exports = router;