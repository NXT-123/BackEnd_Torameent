const express = require('express');
const TournamentController = require('../controllers/TournamentController');
const { authenticateToken, authorize, checkTournamentOwnership, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', TournamentController.getAllTournaments);
router.get('/upcoming', TournamentController.getUpcomingTournaments);
router.get('/ongoing', TournamentController.getOngoingTournaments);
router.get('/:id', TournamentController.getTournamentById);
router.get('/:id/participants', TournamentController.getTournamentParticipants);
router.get('/organizer/:organizerId', TournamentController.getTournamentsByOrganizer);

// Protected routes (require authentication)
router.use(authenticateToken);

// User routes (authenticated users)
router.post('/:id/register', TournamentController.registerForTournament);
router.delete('/:id/withdraw', TournamentController.withdrawFromTournament);

// Organizer/Admin routes (require organizer role or tournament ownership)
router.post('/', authorize('organizer', 'admin'), TournamentController.createTournament);

// Routes that require tournament ownership or admin role
router.put('/:id', checkTournamentOwnership, TournamentController.updateTournament);
router.delete('/:id', checkTournamentOwnership, TournamentController.deleteTournament);
router.put('/:id/status', checkTournamentOwnership, TournamentController.updateTournamentStatus);

module.exports = router;