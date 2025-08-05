const Organizer = require('../models/Organizer');
const Tournament = require('../models/Tournament');

class OrganizerController {
    static createTournament(req, res) {
        const { name, format } = req.body;
        const tournament = new Tournament(Date.now().toString(), name, format);
        res.json(tournament);
    }
}

module.exports = OrganizerController;