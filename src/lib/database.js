const mysql = require('mysql2/promise');

const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

const pool = mysql.createPool({
	host: DB_HOST || 'localhost',
	port: DB_PORT || 3306,
	user: DB_USER,
	password: DB_PASS,
	database: DB_NAME,
});

const runQuery = async (pstmt, data) => {
	const conn = await pool.getConnection();
	try {
		const sql = conn.format(pstmt, data);
		const [result] = await conn.query(sql);
		return result;
	} finally {
		conn.release();
	}
};

module.exports = { runQuery };
