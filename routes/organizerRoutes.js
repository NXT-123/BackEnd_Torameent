const express = require('express');
const router = express.Router();
const OrganizerController = require('../controllers/OrganizerController');

router.post('/tournaments', OrganizerController.createTournament);

module.exports = router;