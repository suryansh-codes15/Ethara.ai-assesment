const prisma = require('../config/db');

const getActivities = async (req, res, next) => {
  try {
    const { entityId, entityType, limit = 20 } = req.query;
    let where = {};
    if (entityId) where.entityId = entityId;
    if (entityType) where.entityType = entityType;

    const activities = await prisma.activityLog.findMany({
      where,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, avatar: true } } }
    });

    res.json({ success: true, activities: activities.map(a => ({ ...a, _id: a.id })) });
  } catch (error) {
    next(error);
  }
};

module.exports = { getActivities };
