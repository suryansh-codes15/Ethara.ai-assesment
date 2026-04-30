const prisma = require('../config/db');
const { emitToProject } = require('../services/socketService');

// @desc    Add message to project chat
// @route   POST /api/chat/:projectId
// @access  Private
const addMessage = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { text } = req.body;

    const message = await prisma.chatMessage.create({
      data: {
        text,
        projectId,
        userId: req.user.id
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } }
      }
    });

    const formatted = { ...message, _id: message.id };

    // Emit to project room for real-time updates
    emitToProject(projectId, 'new-chat-message', formatted);

    res.status(201).json({ success: true, message: formatted });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project chat messages
// @route   GET /api/chat/:projectId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const messages = await prisma.chatMessage.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } }
      },
      orderBy: { createdAt: 'asc' },
      take: 100 // Last 100 messages
    });

    res.json({ success: true, messages: messages.map(m => ({ ...m, _id: m.id })) });
  } catch (error) {
    next(error);
  }
};

module.exports = { addMessage, getMessages };
