const express = require('express');
const db = require('../lib/database');
const router = express.Router();

// 알림 조회
router.get('/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC';
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

module.exports = router;