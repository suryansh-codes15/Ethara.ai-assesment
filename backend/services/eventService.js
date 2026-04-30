const prisma = require('../config/db');

const createActivity = async ({ userId, action, entityType, entityId, details = '' }) => {
  try {
    return await prisma.activityLog.create({
      data: { userId, action, entityType, entityId, details }
    });
  } catch (err) {
    console.error('Activity Log Error:', err);
  }
};

const createNotification = async ({ userId, type, message, link = '' }) => {
  try {
    return await prisma.notification.create({
      data: { userId, type, message, link }
    });
  } catch (err) {
    console.error('Notification Error:', err);
  }
};

module.exports = { createActivity, createNotification };
