const express = require('express');
const HighlightController = require('../controllers/HighlightController');
const { authenticateToken, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', HighlightController.getAllHighlights);
router.get('/featured', HighlightController.getFeaturedHighlights);
router.get('/popular', HighlightController.getPopularHighlights);
router.get('/published', HighlightController.getPublishedHighlights);
router.get('/trending', HighlightController.getTrendingHighlights);
router.get('/search', HighlightController.searchHighlights);
router.get('/stats', HighlightController.getHighlightStats);
router.get('/game/:game', HighlightController.getHighlightsByGame);
router.get('/category/:category', HighlightController.getHighlightsByCategory);
router.get('/tag/:tag', HighlightController.getHighlightsByTag);
router.get('/duration/:duration', HighlightController.getHighlightsByDuration);
router.get('/type/:type', HighlightController.getHighlightsByType);
router.get('/tournament/:tournamentId', HighlightController.getHighlightsByTournament);
router.get('/match/:matchId', HighlightController.getHighlightsByMatch);
router.get('/:id', HighlightController.getHighlightById);

// Protected routes (require authentication)
router.use(authenticateToken);

// User routes (authenticated users can like and share)
router.post('/:id/like', HighlightController.likeHighlight);
router.post('/:id/share', HighlightController.shareHighlight);

// Organizer/Admin routes (content management)
router.post('/', authorize('organizer', 'admin'), HighlightController.createHighlight);
router.put('/:id', authorize('organizer', 'admin'), HighlightController.updateHighlight);
router.delete('/:id', authorize('organizer', 'admin'), HighlightController.deleteHighlight);
router.put('/:id/status', authorize('organizer', 'admin'), HighlightController.updateStatus);
router.put('/:id/featured', authorize('organizer', 'admin'), HighlightController.setFeatured);
router.put('/:id/attach-match', authorize('organizer', 'admin'), HighlightController.attachToMatch);

module.exports = router;