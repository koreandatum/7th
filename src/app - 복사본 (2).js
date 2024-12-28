const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); // 경로 모듈
const mysql = require('mysql2/promise'); // mysql2 패키지 사용
const bcrypt = require('bcrypt'); // 비밀번호 해싱을 위한 bcrypt 패키지 사용
const multer = require('multer'); // 파일 업로드를 위한 multer 패키지 사용
const session = require('express-session'); // 세션 관리 패키지 사용

const app = express();
const port = 3000; // 포트 설정

// MySQL 연결 설정
const dbConfig = {
    host: 'localhost',
    user: 'user1', // MariaDB 사용자 이름
    password: 'kwebpw1', // MariaDB 비밀번호
    database: 'blogdb', // 사용할 데이터베이스 이름
};

// multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads')); // 절대 경로로 설정
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // 파일명 설정
    }
});
const upload = multer({ storage: storage });

// Pug 템플릿 엔진 설정
app.set('views', path.join(__dirname, '../views')); // views 디렉토리 경로 설정
app.set('view engine', 'pug'); // Pug 템플릿 엔진 사용

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // URL 인코딩된 데이터 처리
app.use('/public', express.static('public'));
// 정적 파일 서비스 설정
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // uploads 폴더 정적 파일 제공

// 세션 설정
app.use(session({
    secret: 'your_secret_key', // 비밀 키
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // HTTPS 사용 시 true로 설정
}));

// 기본 루트 처리
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect(`/profile/${req.session.user.username}`); // 로그인된 경우 내 프로필로 리디렉션
    }
    const message = req.session.message; // 메시지를 가져옴
    req.session.message = null; // 메시지 초기화
    res.render('index', { user: req.session.user, message }); // 사용자 정보를 템플릿에 전달
});

// 회원가입 화면 라우트 추가
app.get('/register', (req, res) => {
    const errorMessage = req.session.errorMessage; // 오류 메시지를 가져옴
    req.session.errorMessage = null; // 메시지 초기화
    res.render('register', { errorMessage }); // 오류 메시지를 템플릿에 전달
});

// 회원가입 라우트 추가
app.post('/register', upload.single('profile_picture'), async (req, res) => {
    console.log('Request received for registration');
    if (!req.file) {
        console.log('No file uploaded');
    } else {
        console.log('Uploaded file path:', req.file.path);
    }
    
    const { username, userid, password, bio } = req.body;

    try {
        // 사용자 ID 중복 확인
        const connection = await mysql.createConnection(dbConfig);
        const [existingUsers] = await connection.execute('SELECT * FROM users WHERE username = ?', [userid]);
        if (existingUsers.length > 0) {
            req.session.errorMessage = '이미 존재하는 사용자 ID입니다.'; // 오류 메시지 저장
            return res.redirect('/register'); // 회원가입 페이지로 리디렉션
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // 상대 경로로 수정
        const profilePicturePath = `/uploads/${req.file.filename}`; // 상대 경로 저장
        
        await connection.execute('INSERT INTO users (username, usert, password, profile_picture, bio) VALUES (?, ?, ?, ?, ?)', 
            [userid, username, hashedPassword, profilePicturePath, bio]); // usert에 사용자 이름 저장
        
        req.session.user = { username: userid }; // 세션에 사용자 정보 저장
        req.session.message = '회원가입이 완료되었습니다.';
        res.redirect('/profile'); // 회원가입 후 프로필 페이지로 리디렉션
    } catch (error) {
        res.status(400).send('사용자 등록 오류: ' + error.message);
    }
});

// 로그인 라우트 추가
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length > 0 && await bcrypt.compare(password, rows[0].password)) {
            req.session.user = { username: rows[0].username, id: rows[0].id }; // 로그인 성공 시 사용자 정보 저장
            req.session.message = null; // 로그인 성공 시 메시지 초기화
            res.redirect('/profile'); // 프로필 페이지로 리디렉션
        } else {
            req.session.message = '아이디 또는 비밀번호가 잘못되었습니다.'; // 로그인 실패 메시지 저장
            res.redirect('/'); // 메인 페이지로 리디렉션
        }
    } catch (error) {
        res.status(500).send('서버 오류: ' + error.message);
    }
});

// 기본 프로필 페이지 라우트 추가
app.get('/profile/:userid', async (req, res) => {
    const { userid } = req.params; // URL에서 userid 가져오기

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [userData] = await connection.execute('SELECT * FROM users WHERE username = ?', [userid]); // ID로 사용자 검색

        if (userData.length > 0) {
            res.render('profile', { user: req.session.user, profile: userData[0] }); // 사용자 프로필 렌더링
        } else {
            // 사용자 없음 시 /noprofile로 리디렉션
            res.redirect('/noprofile'); 
        }
    } catch (error) {
        res.status(500).send('서버 오류: ' + error.message);
    }
});

// 없는 프로필 페이지 라우트 추가
app.get('/noprofile', (req, res) => {
    res.render('noprofile', { user: req.session.user }); // 세션 사용자 정보를 템플릿에 전달
});


// 기본 프로필 페이지 라우트 추가 (로그인 시)
app.get('/profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/'); // 로그인하지 않은 경우 메인 페이지로 리디렉션
    }

    // 현재 로그인된 사용자의 프로필로 리디렉션
    res.redirect(`/profile/${req.session.user.username}`);
});

// 프로필 수정 페이지 라우트 추가
app.get('/edit', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/'); // 로그인하지 않은 경우 메인 페이지로 리디렉션
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [userData] = await connection.execute('SELECT * FROM users WHERE username = ?', [req.session.user.username]);

        // 프로필 수정 페이지 렌더링
        res.render('profileEdit', { user: req.session.user, profile: userData[0] }); 
    } catch (error) {
        res.status(500).send('서버 오류: ' + error.message);
    }
});

// 프로필 수정 라우트 추가
app.post('/edit', upload.single('profile_picture'), async (req, res) => {
    const { bio } = req.body; // 자기소개 입력값

    try {
        const connection = await mysql.createConnection(dbConfig);
        const updates = [];

        // 프로필 사진이 업로드된 경우만 업데이트
        if (req.file) {
            const profilePicturePath = `/uploads/${req.file.filename}`; // 상대 경로로 저장
            updates.push(`profile_picture = '${profilePicturePath}'`);
        }

        // 자기소개가 입력된 경우만 업데이트
        if (bio) {
            updates.push(`bio = '${bio}'`);
        }

        // 업데이트할 내용이 있을 경우에만 실행
        if (updates.length > 0) {
            await connection.execute(`UPDATE users SET ${updates.join(', ')} WHERE username = ?`, [req.session.user.username]);
        }

        // 수정 후 해당 프로필 페이지로 리디렉션
        res.redirect(`/profile/${req.session.user.username}`); 
    } catch (error) {
        res.status(400).send('프로필 수정 오류: ' + error.message);
    }
});



// 게시물 조회 라우트
app.get('/profile/:userid/article', async (req, res) => {
    const { userid } = req.params;

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // 해당 사용자의 정보를 가져옴
        const [userData] = await connection.execute('SELECT * FROM users WHERE username = ?', [userid]);

        // 해당 사용자의 게시물과 관련된 좋아요 수 및 댓글을 함께 가져오는 쿼리
        const [posts] = await connection.execute(`
            SELECT p.*, 
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
                   (SELECT GROUP_CONCAT(CONCAT(u.username, ': ', c.content) ORDER BY c.created_at) 
                    FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = p.id) AS comments
            FROM posts p
            WHERE p.user_id = (SELECT id FROM users WHERE username = ?)
            ORDER BY p.created_at DESC
        `, [userid]);

        // 각 게시물에 대해 댓글 데이터를 배열로 변환
        posts.forEach(post => {
            post.comments = post.comments ? post.comments.split(',') : []; // 댓글 데이터 배열로 변환
        });

        console.log('Fetched posts for user:', userid, posts); // 확인

        if (userData.length > 0) {
            res.render('article', { user: req.session.user, profile: userData[0], posts: posts });
        } else {
            res.redirect('/noprofile'); // 사용자가 없는 경우 /noprofile로 리디렉션
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).send('서버 오류: ' + error.message);
    }
});





// 게시물 작성 라우트 추가
app.post('/profile/:userid/article', upload.single('image'), async (req, res) => {
    const { content } = req.body; // 요청 본문에서 내용 가져오기
    const { userid } = req.params; // URL에서 userid 가져오기
    const image = req.file ? `/uploads/${encodeURIComponent(req.file.filename)}` : null; // 파일명 인코딩

    // 로그인한 사용자와 URL의 userid가 다를 경우 접근 거부
    if (!req.session.user || req.session.user.username !== userid) {
        return res.status(403).send('권한이 없습니다.');
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const result = await connection.execute('INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)', 
            [req.session.user.id, content, image]);
        console.log('Inserted post ID:', result[0].insertId); // 확인
        res.redirect(`/profile/${userid}/article`); // 게시물 작성 후 해당 사용자의 게시물 페이지로 리디렉션
    } catch (error) {
        console.error('Error inserting post:', error);
        res.status(500).send('서버 오류: ' + error.message);
    }
});



// 게시물 삭제 라우트
app.post('/profile/:userid/article/delete', async (req, res) => {
    const { postId } = req.body; // POST 요청으로 전달된 postId를 가져옴
    const { userid } = req.params;

    if (!req.session.user) {
        return res.status(403).send('로그인이 필요합니다.');
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // 댓글이 있는 경우 댓글을 먼저 삭제
        await connection.execute('DELETE FROM comments WHERE post_id = ?', [postId]);
        
        // 게시물 삭제
        await connection.execute('DELETE FROM posts WHERE id = ? AND user_id = (SELECT id FROM users WHERE username = ?)', [postId, userid]);

        res.json({ success: true }); // 성공 응답
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).send('서버 오류: ' + error.message);
    }
});

// 알림 페이지 라우트
app.get('/profile/:userid/notice', async (req, res) => {
    const { userid } = req.params;

    // 로그인한 사용자 세션 확인
    if (!req.session.user) {
        return res.redirect('/'); // 로그인하지 않은 경우 메인 페이지로 리디렉션
    }

    // 요청한 사용자와 로그인한 사용자가 다를 경우
    if (req.session.user.username !== userid) {
        return res.redirect(`/profile/${req.session.user.username}`); // 자신의 프로필 페이지로 리디렉션
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        // 해당 사용자의 알림 조회
        const [notifications] = await connection.execute('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.session.user.id]);
        
        res.render('notice', { user: req.session.user, notifications: notifications }); // 알림 페이지 렌더링
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send('서버 오류: ' + error.message);
    }
});


// 게시물에 좋아요 추가 라우트
app.post('/post/:postId/like', async (req, res) => {
    const { postId } = req.params;

    if (!req.session.user) {
        return res.status(403).send('로그인이 필요합니다.');
    }

    const userId = req.session.user.id;

    try {
        const connection = await mysql.createConnection(dbConfig);
        // 좋아요가 이미 있는지 확인
        const [existingLike] = await connection.execute('SELECT * FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]);

        if (existingLike.length > 0) {
            // 이미 좋아요가 눌려있으면 삭제
            await connection.execute('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
        } else {
            // 좋아요 추가
            await connection.execute('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);

            // 알림 생성
            const [postOwner] = await connection.execute('SELECT user_id FROM posts WHERE id = ?', [postId]);
            const postOwnerId = postOwner[0].user_id; // 수정: postOwner[0][0] -> postOwner[0]
            if (postOwnerId !== userId) {
                await connection.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [
                    postOwnerId,
                    `${req.session.user.username}님이 회원님의 게시물에 좋아요를 눌렀습니다!`
                ]);
            }
        }

        res.redirect('back'); // 이전 페이지로 리디렉션
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).send('서버 오류: ' + error.message);
    }
});


// 댓글 추가 라우트
app.post('/profile/:userid/article/comment', async (req, res) => {
    const { postId, content } = req.body; // postId와 content를 body에서 가져옴
    const { userid } = req.params;

    if (!req.session.user) {
        return res.status(403).send('로그인이 필요합니다.');
    }

    const userId = req.session.user.id;

    try {
        const connection = await mysql.createConnection(dbConfig);
        // 댓글 추가
        await connection.execute('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [postId, userId, content]);

        // 알림 생성
        const [postOwner] = await connection.execute('SELECT user_id FROM posts WHERE id = ?', [postId]);
        const postOwnerId = postOwner[0].user_id;
        if (postOwnerId !== userId) {
            await connection.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [
                postOwnerId,
                `${req.session.user.username}님이 회원님의 게시물에 댓글을 달았습니다!`
            ]);
        }

        res.json({ success: true }); // 성공 응답
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).send('서버 오류: ' + error.message);
    }
});





// 로그아웃 라우트 추가
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('로그아웃 오류: ' + err.message);
        }
        res.redirect('/'); // 로그아웃 후 메인 페이지로 리디렉션
    });
});

// 서버 시작
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port}에서 실행 중입니다.`);
});

module.exports = app;
