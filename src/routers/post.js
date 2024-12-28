const express = require('express');
const db = require('../lib/database');
const router = express.Router();

// 게시물 작성
router.post('/', (req, res) => {
    const { userId, content, image } = req.body;
    const sql = 'INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)';
    db.query(sql, [userId, content, image], (err) => {
        if (err) return res.status(500).send(err);
        res.status(201).send('게시물 작성 성공');
    });
});

// 댓글 작성
router.post('/comments', (req, res) => {
    const { postId, userId, content } = req.body;
    const sql = 'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)';
    db.query(sql, [postId, userId, content], (err, result) => {
        if (err) return res.status(500).send(err);
        
        // 댓글 작성자에게 알림 전송
        const notificationSql = 'INSERT INTO notifications (user_id, post_id, message) VALUES (?, ?, ?)';
        db.query(notificationSql, [postId, userId, '새 댓글이 달렸습니다.'], (err) => {
            if (err) return res.status(500).send(err);
            res.status(201).send('댓글 작성 성공');
        });
    });
});

// 좋아요 추가
router.post('/likes', (req, res) => {
    const { postId, userId } = req.body;
    const sql = 'INSERT INTO likes (post_id, user_id) VALUES (?, ?)';
    db.query(sql, [postId, userId], (err, result) => {
        if (err) return res.status(500).send(err);
        
        // 좋아요 작성자에게 알림 전송
        const notificationSql = 'INSERT INTO notifications (user_id, post_id, message) VALUES (?, ?, ?)';
        db.query(notificationSql, [postId, userId, '좋아요가 추가되었습니다.'], (err) => {
            if (err) return res.status(500).send(err);
            res.status(201).send('좋아요 추가 성공');
        });
    });
});

// 게시물 저장
router.post('/save', (req, res) => {
    const { postId, userId } = req.body;
    const sql = 'INSERT INTO saved_posts (post_id, user_id) VALUES (?, ?)';
    db.query(sql, [postId, userId], (err) => {
        if (err) return res.status(500).send(err);
        res.status(201).send('게시물 저장 성공');
    });
});

module.exports = router;