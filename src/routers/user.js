const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../lib/database');
const router = express.Router();

// 회원가입
router.post('/register', async (req, res) => {
    const { username, password, profile_picture, bio } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, password, profile_picture, bio) VALUES (?, ?, ?, ?)';
    db.query(sql, [username, hashedPassword, profile_picture, bio], (err) => {
        if (err) return res.status(500).send(err);
        res.status(201).send('회원가입 성공');
    });
});

// 로그인
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], async (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(400).send('사용자를 찾을 수 없습니다.');

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).send('비밀번호가 틀립니다.');

        const token = jwt.sign({ id: user.id }, '비밀키', { expiresIn: '1h' });
        res.json({ token });
    });
});

// 프로필 업데이트
router.put('/profile', async (req, res) => {
    const { userId, profile_picture, bio } = req.body;
    const sql = 'UPDATE users SET profile_picture = ?, bio = ? WHERE id = ?';
    db.query(sql, [profile_picture, bio, userId], (err) => {
        if (err) return res.status(500).send(err);
        res.send('프로필 업데이트 성공');
    });
});

// 사용자 프로필 조회
router.get('/:id', (req, res) => {
    const userId = req.params.id;
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).send(err);
        const user = results[0];
        const isOwnProfile = req.user.id === userId; // 로그인한 사용자와 비교
        res.json({ user, isOwnProfile });
    });
});

// 서로이웃 요청
router.post('/friend-request', (req, res) => {
    const { requesterId, receiverId } = req.body;
    const sql = 'INSERT INTO friendships (requester_id, receiver_id) VALUES (?, ?)';
    db.query(sql, [requesterId, receiverId], (err) => {
        if (err) return res.status(500).send(err);
        res.status(201).send('친구 요청 전송 성공');
    });
});

// 서로이웃 승인
router.post('/friend-accept', (req, res) => {
    const { friendshipId } = req.body;
    const sql = 'UPDATE friendships SET status = "accepted" WHERE id = ?';
    db.query(sql, [friendshipId], (err) => {
        if (err) return res.status(500).send(err);
        res.status(200).send('친구 요청 승인 성공');
    });
});

module.exports = router;