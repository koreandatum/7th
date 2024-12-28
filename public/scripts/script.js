// public/scripts/script.js

document.addEventListener('DOMContentLoaded', () => {
    // 프로필 업데이트
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify({
                userId: 1, // 실제 사용자 ID로 교체
                profile_picture: formData.get('profile_picture'),
                bio: formData.get('bio'),
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.text();
        alert(data);
    });

    // 글 작성
    document.getElementById('postForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const response = await fetch('/api/posts', {
            method: 'POST',
            body: JSON.stringify({
                userId: 1, // 실제 사용자 ID로 교체
                content: formData.get('content'),
                image: formData.get('image'),
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.text();
        alert(data);
    });

    // 댓글 작성
    document.getElementById('commentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const response = await fetch('/api/posts/comments', {
            method: 'POST',
            body: JSON.stringify({
                postId: 1, // 실제 게시물 ID로 교체
                userId: 1, // 실제 사용자 ID로 교체
                content: formData.get('content'),
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.text();
        alert(data);
    });
});
