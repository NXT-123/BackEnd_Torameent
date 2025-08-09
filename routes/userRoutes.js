const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Apply admin authorization to all routes (users endpoint requires admin access)
router.use(authenticateToken);
router.use(authorize('admin'));

// User management routes
router.get('/', UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
router.get('/role/:role', UserController.getUsersByRole);
router.get('/search', UserController.searchUsers);
router.get('/stats', UserController.getUserStats);
router.get('/activity', UserController.getUserActivity);

// User modification routes
router.put('/:id/role', UserController.updateUserRole);
router.put('/:id/deactivate', UserController.deactivateUser);
router.put('/:id/reactivate', UserController.reactivateUser);

module.exports = router;