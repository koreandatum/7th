$(document).ready(function() {
    $('#register-form').on('submit', function(event) {
        event.preventDefault();
        const formData = $(this).serialize();
        $.post('/api/users/register', formData, function(response) {
            alert(response);
        });
    });

    $('#login-form').on('submit', function(event) {
        event.preventDefault();
        const formData = $(this).serialize();
        $.post('/api/users/login', formData, function(response) {
            localStorage.setItem('token', response.token);
            alert('로그인 성공');
        }).fail(function() {
            alert('로그인 실패');
        });
    });
});