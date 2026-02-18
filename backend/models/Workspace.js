const db = require('../database/connection');

const Workspace = {
    async create(name, description, ownerId) {
        const [result] = await db.execute(
            'INSERT INTO workspaces (name, description, owner_id) VALUES (?, ?, ?)',
            [name, description, ownerId]
        );
        const workspaceId = result.insertId;
        
        await db.execute(
            'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
            [workspaceId, ownerId, 'owner']
        );
        
        return workspaceId;
    },

    async findById(id) {
        const [rows] = await db.execute('SELECT * FROM workspaces WHERE id = ?', [id]);
        return rows[0];
    },

    async findByUserId(userId) {
        const [rows] = await db.execute(`
            SELECT w.* FROM workspaces w
            JOIN workspace_members wm ON w.id = wm.workspace_id
            WHERE wm.user_id = ?
            ORDER BY w.updated_at DESC
        `, [userId]);
        return rows;
    },

    async update(id, name, description) {
        await db.execute(
            'UPDATE workspaces SET name = ?, description = ? WHERE id = ?',
            [name, description, id]
        );
    },

    async delete(id) {
        await db.execute('DELETE FROM workspaces WHERE id = ?', [id]);
    },

    async addMember(workspaceId, userId, role = 'member') {
        await db.execute(
            'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
            [workspaceId, userId, role]
        );
    },

    async removeMember(workspaceId, userId) {
        await db.execute(
            'DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, userId]
        );
    },

    async getMembers(workspaceId) {
        const [rows] = await db.execute(`
            SELECT u.id, u.username, u.email, u.avatar, wm.role
            FROM users u
            JOIN workspace_members wm ON u.id = wm.user_id
            WHERE wm.workspace_id = ?
        `, [workspaceId]);
        return rows;
    },

    async isMember(workspaceId, userId) {
        const [rows] = await db.execute(
            'SELECT * FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, userId]
        );
        return rows.length > 0;
    }
};

module.exports = Workspace;
