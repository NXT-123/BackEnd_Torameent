const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Apply admin authorization to all routes
router.use(authenticateToken);
router.use(authorize('admin'));

// System Statistics
router.get('/stats', AdminController.getStats);

// Management Routes
router.get('/users', AdminController.getUsers);
router.get('/tournaments', AdminController.getTournaments);
router.get('/news', AdminController.getNews);
router.get('/matches', AdminController.getMatches);
router.get('/highlights', AdminController.getHighlights);

// System Monitoring
router.get('/logs', AdminController.getLogs);
router.get('/database/status', AdminController.getDatabaseStatus);
router.get('/health', AdminController.getHealth);
router.get('/performance', AdminController.getPerformance);

// Security & Audit
router.get('/security/logs', AdminController.getSecurityLogs);
router.get('/audit', AdminController.getAudit);

// System Settings
router.get('/settings', AdminController.getSettings);
router.put('/settings', AdminController.updateSettings);

// Analytics
router.get('/analytics/users', AdminController.getUserAnalytics);
router.get('/analytics/tournaments', AdminController.getTournamentAnalytics);
router.get('/analytics/content', AdminController.getContentAnalytics);

// Notifications
router.get('/notifications', AdminController.getNotifications);
router.post('/notifications', AdminController.createNotification);

module.exports = router;