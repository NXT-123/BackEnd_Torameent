class AdminController {
    static getStats(req, res) {
        res.json({ wins: 10, losses: 5, draws: 2 });
    }
}

module.exports = AdminController;