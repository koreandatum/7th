require('./env');
const app = require('./app');

const port = process.env.PORT || 4000;


// 서버가 이미 실행 중인지 확인하는 함수
const startServer = () => {
    app.listen(port, () => {
        console.log(`KWEB Project: Listening on port ${port}.`);
    });
};

// 서버 시작
startServer();


//app.listen(port, () => {
//	console.log(`KWEB Project: Listening on port ${port}.`);
//});
