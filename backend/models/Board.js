const db = require('../database/connection');

const Board = {
    async create(name, description, workspaceId, ownerId, backgroundColor = '#0079BF') {
        const [result] = await db.execute(
            'INSERT INTO boards (name, description, workspace_id, owner_id, background_color) VALUES (?, ?, ?, ?, ?)',
            [name, description, workspaceId, ownerId, backgroundColor]
        );
        const boardId = result.insertId;
        
        await db.execute(
            'INSERT INTO board_members (board_id, user_id, role) VALUES (?, ?, ?)',
            [boardId, ownerId, 'owner']
        );
        
        return boardId;
    },

    async findById(id) {
        const [rows] = await db.execute('SELECT * FROM boards WHERE id = ?', [id]);
        return rows[0];
    },

    async findByWorkspaceId(workspaceId) {
        const [rows] = await db.execute(
            'SELECT * FROM boards WHERE workspace_id = ? ORDER BY position ASC',
            [workspaceId]
        );
        return rows;
    },

    async update(id, data) {
        const fields = [];
        const values = [];
        
        if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
        if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
        if (data.background_color !== undefined) { fields.push('background_color = ?'); values.push(data.background_color); }
        if (data.banner_image !== undefined) { fields.push('banner_image = ?'); values.push(data.banner_image); }
        if (data.orientation !== undefined) { fields.push('orientation = ?'); values.push(data.orientation); }
        if (data.position !== undefined) { fields.push('position = ?'); values.push(data.position); }
        
        if (fields.length > 0) {
            values.push(id);
            await db.execute(`UPDATE boards SET ${fields.join(', ')} WHERE id = ?`, values);
        }
    },

    async delete(id) {
        await db.execute('DELETE FROM boards WHERE id = ?', [id]);
    },

    async addMember(boardId, userId, role = 'member') {
        await db.execute(
            'INSERT INTO board_members (board_id, user_id, role) VALUES (?, ?, ?)',
            [boardId, userId, role]
        );
    },

    async removeMember(boardId, userId) {
        await db.execute(
            'DELETE FROM board_members WHERE board_id = ? AND user_id = ?',
            [boardId, userId]
        );
    },

    async getMembers(boardId) {
        const [rows] = await db.execute(`
            SELECT u.id, u.username, u.email, u.avatar, bm.role
            FROM users u
            JOIN board_members bm ON u.id = bm.user_id
            WHERE bm.board_id = ?
        `, [boardId]);
        return rows;
    },

    async isMember(boardId, userId) {
        const [rows] = await db.execute(
            'SELECT * FROM board_members WHERE board_id = ? AND user_id = ?',
            [boardId, userId]
        );
        return rows.length > 0;
    },

    async updatePositions(updates) {
        for (const update of updates) {
            await db.execute('UPDATE boards SET position = ? WHERE id = ?', [update.position, update.id]);
        }
    }
};

module.exports = Board;
