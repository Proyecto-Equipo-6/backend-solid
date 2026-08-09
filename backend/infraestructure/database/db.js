const UserRepository = require('../../domain/ports/UserRepository');
const db = require('../database/db'); // Tu conexión

class MySQLUserRepository extends UserRepository {
    async save(user) {
        // Aquí metes tu SQL / consulta
        const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        await db.execute(query, [user.name, user.email, user.password]);
    }

    async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ? LIMIT 1';
        const [rows] = await db.execute(query, [email]);
        return rows[0] || null;
    }
}

module.exports = MySQLUserRepository;
