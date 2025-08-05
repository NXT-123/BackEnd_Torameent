const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');

router.get('/stats', AdminController.getStats);

module.exports = router;