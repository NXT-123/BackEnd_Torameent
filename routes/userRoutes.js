const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

router.get('/tournaments/search', (req, res) => {
    // Logic tìm kiếm (giả lập)
    res.json([{ id: '1', name: 'Summer 2025' }]);
});

router.post('/login', UserController.login);

router.get('/tournaments/:id', (req, res) => {
    res.json({ id: req.params.id, name: 'Summer 2025', format: 'single' });
});

module.exports = router;