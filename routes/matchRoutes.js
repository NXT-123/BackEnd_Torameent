const express = require('express');
const MatchController = require('../controllers/MatchController');
const { authenticateToken, authorize, checkTournamentOwnership, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', MatchController.getAllMatches);
router.get('/upcoming', MatchController.getUpcomingMatches);
router.get('/ongoing', MatchController.getOngoingMatches);
router.get('/results', MatchController.getMatchResults);
router.get('/status/:status', MatchController.getMatchesByStatus);
router.get('/game/:game', MatchController.getMatchesByGame);
router.get('/search', MatchController.searchMatches);
router.get('/:id', MatchController.getMatchById);
router.get('/tournament/:tournamentId', MatchController.getMatchesByTournament);
router.get('/competitor/:competitorId', MatchController.getMatchesByCompetitor);

// Protected routes (require authentication)
router.use(authenticateToken);

// Organizer/Admin routes (match management)
router.post('/', authorize('organizer', 'admin'), MatchController.createMatch);
router.put('/:id', authorize('organizer', 'admin'), MatchController.updateMatch);
router.delete('/:id', authorize('organizer', 'admin'), MatchController.deleteMatch);
router.put('/:id/start', authorize('organizer', 'admin'), MatchController.startMatch);
router.put('/:id/result', authorize('organizer', 'admin'), MatchController.setMatchResult);
router.put('/:id/score', authorize('organizer', 'admin'), MatchController.updateMatchScore);
router.put('/:id/reschedule', authorize('organizer', 'admin'), MatchController.rescheduleMatch);
router.put('/:id/cancel', authorize('organizer', 'admin'), MatchController.cancelMatch);
router.put('/:id/postpone', authorize('organizer', 'admin'), MatchController.postponeMatch);
router.post('/:id/game', authorize('organizer', 'admin'), MatchController.addGame);

module.exports = router;