const prisma = require('../config/db');
const { createActivity, createNotification } = require('../services/eventService');

const addComment = async (req, res, next) => {
  try {
    const { text, taskId } = req.body;
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const comment = await prisma.comment.create({
      data: { text, taskId, userId: req.user.id },
      include: { user: { select: { name: true, avatar: true } } }
    });

    const formatted = { ...comment, _id: comment.id };

    // Notify assignee if someone else comments
    if (task.assignedToId && task.assignedToId !== req.user.id) {
      await createNotification({
        userId: task.assignedToId,
        type: 'comment',
        message: `${req.user.name} commented on your task: ${task.title}`,
        link: `/projects/${task.projectId}?task=${task.id}`
      });
    }

    // Emit to project room for real-time updates
    const { emitToProject } = require('../services/socketService');
    emitToProject(task.projectId, 'new-comment', { taskId, comment: formatted });

    res.status(201).json({ success: true, comment: formatted });
  } catch (error) {
    next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: { user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, comments: comments.map(c => ({ ...c, _id: c.id })) });
  } catch (error) {
    next(error);
  }
};

const getSubtasks = async (req, res, next) => {
  try {
    const { id: taskId } = req.params;
    const subtasks = await prisma.subtask.findMany({
      where: { taskId },
      orderBy: { order: 'asc' }
    });
    res.json({ success: true, subtasks: subtasks.map(s => ({ ...s, _id: s.id })) });
  } catch (error) {
    next(error);
  }
};

const addSubtask = async (req, res, next) => {
  try {
    const { id: taskId } = req.params;
    const { title } = req.body;
    
    const subtask = await prisma.subtask.create({
      data: { title, taskId, order: 0 }
    });

    res.status(201).json({ success: true, subtask: { ...subtask, _id: subtask.id } });
  } catch (error) {
    next(error);
  }
};

const toggleSubtask = async (req, res, next) => {
  try {
    const { sid } = req.params;
    const subtask = await prisma.subtask.findUnique({ where: { id: sid } });
    if (!subtask) return res.status(404).json({ success: false, message: 'Subtask not found' });

    const updated = await prisma.subtask.update({
      where: { id: sid },
      data: { done: !subtask.done }
    });

    res.json({ success: true, subtask: { ...updated, _id: updated.id } });
  } catch (error) {
    next(error);
  }
};

const deleteSubtask = async (req, res, next) => {
  try {
    const { sid } = req.params;
    await prisma.subtask.delete({ where: { id: sid } });
    res.json({ success: true, message: 'Subtask deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { addComment, getComments, getSubtasks, addSubtask, toggleSubtask, deleteSubtask };
