const Workspace = require('../models/Workspace');

const workspaceController = {
    async create(req, res) {
        try {
            const { name, description } = req.body;
            
            if (!name) {
                return res.status(400).json({ error: 'El nombre es requerido' });
            }

            const workspaceId = await Workspace.create(name, description, req.userId);
            const workspace = await Workspace.findById(workspaceId);

            res.status(201).json({ message: 'Workspace creado', workspace });
        } catch (error) {
            console.error('Error en create workspace:', error);
            res.status(500).json({ error: 'Error al crear workspace' });
        }
    },

    async getAll(req, res) {
        try {
            const workspaces = await Workspace.findByUserId(req.userId);
            res.json({ workspaces });
        } catch (error) {
            console.error('Error en getAll workspaces:', error);
            res.status(500).json({ error: 'Error al obtener workspaces' });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const workspace = await Workspace.findById(id);

            if (!workspace) {
                return res.status(404).json({ error: 'Workspace no encontrado' });
            }

            const isMember = await Workspace.isMember(id, req.userId);
            if (!isMember) {
                return res.status(403).json({ error: 'No tienes acceso a este workspace' });
            }

            const members = await Workspace.getMembers(id);
            res.json({ workspace, members });
        } catch (error) {
            console.error('Error en getById workspace:', error);
            res.status(500).json({ error: 'Error al obtener workspace' });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const workspace = await Workspace.findById(id);
            if (!workspace) {
                return res.status(404).json({ error: 'Workspace no encontrado' });
            }

            const isMember = await Workspace.isMember(id, req.userId);
            if (!isMember) {
                return res.status(403).json({ error: 'No tienes acceso a este workspace' });
            }

            await Workspace.update(id, name, description);
            const updated = await Workspace.findById(id);

            res.json({ message: 'Workspace actualizado', workspace: updated });
        } catch (error) {
            console.error('Error en update workspace:', error);
            res.status(500).json({ error: 'Error al actualizar workspace' });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;

            const workspace = await Workspace.findById(id);
            if (!workspace) {
                return res.status(404).json({ error: 'Workspace no encontrado' });
            }

            if (workspace.owner_id !== req.userId) {
                return res.status(403).json({ error: 'Solo el propietario puede eliminar el workspace' });
            }

            await Workspace.delete(id);
            res.json({ message: 'Workspace eliminado' });
        } catch (error) {
            console.error('Error en delete workspace:', error);
            res.status(500).json({ error: 'Error al eliminar workspace' });
        }
    },

    async addMember(req, res) {
        try {
            const { id } = req.params;
            const { userId, role } = req.body;

            const workspace = await Workspace.findById(id);
            if (!workspace) {
                return res.status(404).json({ error: 'Workspace no encontrado' });
            }

            const isAdmin = await Workspace.isMember(id, req.userId);
            if (!isAdmin) {
                return res.status(403).json({ error: 'No tienes permisos para agregar miembros' });
            }

            await Workspace.addMember(id, userId, role || 'member');
            res.json({ message: 'Miembro agregado' });
        } catch (error) {
            console.error('Error en addMember:', error);
            res.status(500).json({ error: 'Error al agregar miembro' });
        }
    },

    async removeMember(req, res) {
        try {
            const { id, userId } = req.params;

            const workspace = await Workspace.findById(id);
            if (!workspace) {
                return res.status(404).json({ error: 'Workspace no encontrado' });
            }

            const isAdmin = await Workspace.isMember(id, req.userId);
            if (!isAdmin) {
                return res.status(403).json({ error: 'No tienes permisos para eliminar miembros' });
            }

            await Workspace.removeMember(id, userId);
            res.json({ message: 'Miembro eliminado' });
        } catch (error) {
            console.error('Error en removeMember:', error);
            res.status(500).json({ error: 'Error al eliminar miembro' });
        }
    }
};

module.exports = workspaceController;
