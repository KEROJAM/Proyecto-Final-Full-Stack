const db = require('../database/connection');

const List = {
    async create(name, boardId, position = 0) {
        const [result] = await db.execute(
            'INSERT INTO lists (name, board_id, position) VALUES (?, ?, ?)',
            [name, boardId, position]
        );
        return result.insertId;
    },

    async findById(id) {
        const [rows] = await db.execute('SELECT * FROM lists WHERE id = ?', [id]);
        return rows[0];
    },

    async findByBoardId(boardId) {
        const [rows] = await db.execute(
            'SELECT * FROM lists WHERE board_id = ? ORDER BY position ASC',
            [boardId]
        );
        return rows;
    },

    async update(id, name) {
        await db.execute('UPDATE lists SET name = ? WHERE id = ?', [name, id]);
    },

    async delete(id) {
        await db.execute('DELETE FROM lists WHERE id = ?', [id]);
    },

    async updatePositions(updates) {
        for (const update of updates) {
            await db.execute('UPDATE lists SET position = ? WHERE id = ?', [update.position, update.id]);
        }
    }
};

module.exports = List;
