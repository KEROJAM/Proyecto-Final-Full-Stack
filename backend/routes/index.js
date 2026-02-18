const authController = require('../controllers/authController');
const workspaceController = require('../controllers/workspaceController');
const boardController = require('../controllers/boardController');
const listController = require('../controllers/listController');
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');

module.exports = (app) => {
    app.post('/api/auth/register', authController.register);
    app.post('/api/auth/login', authController.login);
    app.get('/api/auth/profile', authMiddleware, authController.getProfile);
    app.put('/api/auth/avatar', authMiddleware, authController.updateAvatar);
    app.get('/api/auth/search', authMiddleware, authController.searchUsers);

    app.post('/api/workspaces', authMiddleware, workspaceController.create);
    app.get('/api/workspaces', authMiddleware, workspaceController.getAll);
    app.get('/api/workspaces/:id', authMiddleware, workspaceController.getById);
    app.put('/api/workspaces/:id', authMiddleware, workspaceController.update);
    app.delete('/api/workspaces/:id', authMiddleware, workspaceController.delete);
    app.post('/api/workspaces/:id/members', authMiddleware, workspaceController.addMember);
    app.delete('/api/workspaces/:id/members/:userId', authMiddleware, workspaceController.removeMember);

    app.post('/api/boards', authMiddleware, boardController.create);
    app.get('/api/boards', authMiddleware, boardController.getAll);
    app.get('/api/boards/:id', authMiddleware, boardController.getById);
    app.put('/api/boards/:id', authMiddleware, boardController.update);
    app.delete('/api/boards/:id', authMiddleware, boardController.delete);
    app.post('/api/boards/:id/members', authMiddleware, boardController.addMember);
    app.delete('/api/boards/:id/members/:userId', authMiddleware, boardController.removeMember);
    app.put('/api/boards/positions', authMiddleware, boardController.updatePositions);
    app.post('/api/boards/:id/banner', authMiddleware, boardController.uploadBanner);

    app.post('/api/lists', authMiddleware, listController.create);
    app.get('/api/lists', authMiddleware, listController.getAll);
    app.put('/api/lists/:id', authMiddleware, listController.update);
    app.delete('/api/lists/:id', authMiddleware, listController.delete);
    app.put('/api/lists/positions', authMiddleware, listController.updatePositions);

    app.post('/api/tasks', authMiddleware, taskController.create);
    app.get('/api/tasks', authMiddleware, taskController.getAll);
    app.get('/api/tasks/user', authMiddleware, taskController.getUserTasks);
    app.get('/api/tasks/calendar', authMiddleware, taskController.getCalendarData);
    app.get('/api/tasks/:id', authMiddleware, taskController.getById);
    app.put('/api/tasks/:id', authMiddleware, taskController.update);
    app.delete('/api/tasks/:id', authMiddleware, taskController.delete);
    app.post('/api/tasks/:id/members', authMiddleware, taskController.addMember);
    app.delete('/api/tasks/:id/members/:userId', authMiddleware, taskController.removeMember);
    app.put('/api/tasks/positions', authMiddleware, taskController.updatePositions);
};
