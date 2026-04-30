const prisma = require('../config/db');

// GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, read: false },
    });

    res.json({
      success: true,
      notifications: notifications.map(n => ({ ...n, _id: n.id })),
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications/:id
const dismissNotification = async (req, res, next) => {
  try {
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAllRead, dismissNotification };
