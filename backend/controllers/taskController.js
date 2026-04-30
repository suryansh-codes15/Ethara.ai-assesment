const prisma = require('../config/db');

const formatUser = (user) => {
  if (!user) return null;
  return { ...user, _id: user.id };
};

const formatTask = (task) => {
  if (!task) return null;
  return {
    ...task,
    _id: task.id,
    assignedTo: formatUser(task.assignedTo),
    createdBy: formatUser(task.createdBy),
    project: task.project ? { ...task.project, _id: task.project.id } : null,
  };
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private/Admin
const createTask = async (req, res, next) => {
  try {
    const { title, description, project, assignedTo, status, priority, dueDate } = req.body;

    // Verify project exists and user has access
    const proj = await prisma.project.findUnique({
      where: { id: project },
      include: { members: true }
    });
    if (!proj) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Verify assigned user is a member of the project
    if (assignedTo && !proj.members.some(m => m.id === assignedTo)) {
      return res.status(400).json({ success: false, message: 'Assigned user is not a project member.' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId: project,
        assignedToId: assignedTo || null,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: req.user.id
      },
      include: {
        assignedTo: { select: { name: true, email: true, avatar: true } },
        createdBy: { select: { name: true, email: true, avatar: true } },
        project: { select: { name: true } }
      }
    });

    res.status(201).json({ success: true, task: formatTask(task) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks (with filters)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { project, status, priority, assignedTo } = req.query;
    let where = {};

    // Members only see tasks in their projects
    if (req.user.role !== 'admin') {
      const userProjects = await prisma.project.findMany({
        where: { members: { some: { id: req.user.id } } },
        select: { id: true }
      });
      where.projectId = { in: userProjects.map(p => p.id) };
    }

    if (project) {
      if (where.projectId && where.projectId.in && !where.projectId.in.includes(project)) {
         return res.json({ success: true, count: 0, tasks: [] });
      }
      where.projectId = project;
    }
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedToId = assignedTo;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { name: true, email: true, avatar: true } },
        createdBy: { select: { name: true, email: true, avatar: true } },
        project: { select: { name: true } }
      }
    });

    res.json({ success: true, count: tasks.length, tasks: tasks.map(formatTask) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: { select: { name: true, email: true, avatar: true } },
        createdBy: { select: { name: true, email: true, avatar: true } },
        project: { select: { name: true, members: true } }
      }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({ success: true, task: formatTask(task) });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PATCH /api/tasks/:id
// @access  Private (admin: full, member: only status of own tasks)
const updateTask = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    let dataToUpdate = {};

    // Members can only update status of tasks assigned to them
    if (req.user.role !== 'admin') {
      const isAssigned = task.assignedToId === req.user.id;
      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'You can only update tasks assigned to you.' });
      }
      // Restrict members to only updating status
      if (req.body.status) dataToUpdate.status = req.body.status;
    } else {
      // Admin can update any field
      const { title, description, assignedTo, status, priority, dueDate } = req.body;
      if (title !== undefined) dataToUpdate.title = title;
      if (description !== undefined) dataToUpdate.description = description;
      if (assignedTo !== undefined) dataToUpdate.assignedToId = assignedTo || null;
      if (status !== undefined) dataToUpdate.status = status;
      if (priority !== undefined) dataToUpdate.priority = priority;
      if (dueDate !== undefined) dataToUpdate.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: dataToUpdate,
      include: {
        assignedTo: { select: { name: true, email: true, avatar: true } },
        createdBy: { select: { name: true, email: true, avatar: true } },
        project: { select: { name: true } }
      }
    });

    res.json({ success: true, task: formatTask(updatedTask) });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
const deleteTask = async (req, res, next) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    if (error.code === 'P2025') {
       return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    next(error);
  }
};

module.exports = { createTask, getTasks, getTask, updateTask, deleteTask };
