const prisma = require('../config/db');

// POST /api/tasks/:id/comments
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }

    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        taskId: req.params.id,
        userId: req.user.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    res.status(201).json({
      success: true,
      comment: { ...comment, _id: comment.id, user: { ...comment.user, _id: comment.user.id } },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id/comments
const getComments = async (req, res, next) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { taskId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    res.json({
      success: true,
      comments: comments.map(c => ({
        ...c,
        _id: c.id,
        user: { ...c.user, _id: c.user.id },
      })),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks/:id/subtasks
const addSubtask = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Subtask title is required.' });
    }

    const count = await prisma.subtask.count({ where: { taskId: req.params.id } });

    const subtask = await prisma.subtask.create({
      data: {
        title: title.trim(),
        taskId: req.params.id,
        order: count,
      },
    });

    res.status(201).json({ success: true, subtask: { ...subtask, _id: subtask.id } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id/subtasks/:sid
const toggleSubtask = async (req, res, next) => {
  try {
    const subtask = await prisma.subtask.findUnique({ where: { id: req.params.sid } });
    if (!subtask) {
      return res.status(404).json({ success: false, message: 'Subtask not found.' });
    }

    const updated = await prisma.subtask.update({
      where: { id: req.params.sid },
      data: { done: !subtask.done },
    });

    res.json({ success: true, subtask: { ...updated, _id: updated.id } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:id/subtasks/:sid
const deleteSubtask = async (req, res, next) => {
  try {
    await prisma.subtask.delete({ where: { id: req.params.sid } });
    res.json({ success: true, message: 'Subtask deleted.' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Subtask not found.' });
    next(error);
  }
};

// GET /api/tasks/:id/subtasks
const getSubtasks = async (req, res, next) => {
  try {
    const subtasks = await prisma.subtask.findMany({
      where: { taskId: req.params.id },
      orderBy: { order: 'asc' },
    });
    res.json({ success: true, subtasks: subtasks.map(s => ({ ...s, _id: s.id })) });
  } catch (error) {
    next(error);
  }
};

module.exports = { addComment, getComments, addSubtask, toggleSubtask, deleteSubtask, getSubtasks };
