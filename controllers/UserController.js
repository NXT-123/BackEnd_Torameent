const User = require('../models/User');

class UserController {
    static login(req, res) {
        const { email } = req.body;
        const user = new User('1', 'John Doe', email); // Giả lập
        res.json(user);
    }
}

module.exports = UserController;