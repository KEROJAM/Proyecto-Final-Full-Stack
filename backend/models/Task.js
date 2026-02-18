const db = require('../database/connection');

const Task = {
    async create(title, description, listId, dueDate = null, position = 0) {
        const [result] = await db.execute(
            'INSERT INTO tasks (title, description, list_id, due_date, position) VALUES (?, ?, ?, ?, ?)',
            [title, description, listId, dueDate, position]
        );
        return result.insertId;
    },

    async findById(id) {
        const [rows] = await db.execute(`
            SELECT t.*, l.board_id, l.name as list_name
            FROM tasks t
            JOIN lists l ON t.list_id = l.id
            WHERE t.id = ?
        `, [id]);
        return rows[0];
    },

    async findByListId(listId) {
        const [rows] = await db.execute(
            'SELECT * FROM tasks WHERE list_id = ? ORDER BY position ASC',
            [listId]
        );
        return rows;
    },

    async findByBoardId(boardId) {
        const [rows] = await db.execute(`
            SELECT t.*, l.name as list_name
            FROM tasks t
            JOIN lists l ON t.list_id = l.id
            WHERE l.board_id = ?
            ORDER BY l.position ASC, t.position ASC
        `, [boardId]);
        return rows;
    },

    async findByDateRange(startDate, endDate) {
        const [rows] = await db.execute(`
            SELECT t.*, l.board_id, l.name as list_name, b.name as board_name
            FROM tasks t
            JOIN lists l ON t.list_id = l.id
            JOIN boards b ON l.board_id = b.id
            WHERE t.due_date BETWEEN ? AND ?
            ORDER BY t.due_date ASC
        `, [startDate, endDate]);
        return rows;
    },

    async findByUserId(userId, startDate = null, endDate = null) {
        let query = `
            SELECT t.*, l.board_id, l.name as list_name, b.name as board_name
            FROM tasks t
            JOIN lists l ON t.list_id = l.id
            JOIN boards b ON l.board_id = b.id
            JOIN task_members tm ON t.id = tm.task_id
            WHERE tm.user_id = ?
        `;
        const params = [userId];

        if (startDate && endDate) {
            query += ' AND t.due_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY t.due_date ASC';

        const [rows] = await db.execute(query, params);
        return rows;
    },

    async update(id, data) {
        const fields = [];
        const values = [];
        
        if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
        if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
        if (data.due_date !== undefined) { fields.push('due_date = ?'); values.push(data.due_date); }
        if (data.completed !== undefined) { fields.push('completed = ?'); values.push(data.completed); }
        if (data.position !== undefined) { fields.push('position = ?'); values.push(data.position); }
        if (data.list_id !== undefined) { fields.push('list_id = ?'); values.push(data.list_id); }
        
        if (fields.length > 0) {
            values.push(id);
            await db.execute(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);
        }
    },

    async delete(id) {
        await db.execute('DELETE FROM tasks WHERE id = ?', [id]);
    },

    async addMember(taskId, userId) {
        await db.execute(
            'INSERT INTO task_members (task_id, user_id) VALUES (?, ?)',
            [taskId, userId]
        );
    },

    async removeMember(taskId, userId) {
        await db.execute(
            'DELETE FROM task_members WHERE task_id = ? AND user_id = ?',
            [taskId, userId]
        );
    },

    async getMembers(taskId) {
        const [rows] = await db.execute(`
            SELECT u.id, u.username, u.email, u.avatar
            FROM users u
            JOIN task_members tm ON u.id = tm.user_id
            WHERE tm.task_id = ?
        `, [taskId]);
        return rows;
    },

    async getTaskCountByDate(startDate, endDate) {
        const [rows] = await db.execute(`
            SELECT 
                due_date as date,
                COUNT(*) as total_tasks,
                SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as completed_tasks
            FROM tasks
            WHERE due_date BETWEEN ? AND ?
            GROUP BY due_date
            ORDER BY due_date ASC
        `, [startDate, endDate]);
        return rows;
    },

    async updatePositions(updates) {
        for (const update of updates) {
            await db.execute('UPDATE tasks SET position = ?, list_id = ? WHERE id = ?', 
                [update.position, update.listId, update.id]);
        }
    }
};

module.exports = Task;
