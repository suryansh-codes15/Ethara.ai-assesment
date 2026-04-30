const prisma = require('../config/db');

// GET /api/analytics/velocity — tasks completed per day for past 30 days
const getVelocity = async (req, res, next) => {
  try {
    const days = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      days.push({ date: d, end });
    }

    const results = await Promise.all(
      days.map(async ({ date, end }) => {
        const count = await prisma.task.count({
          where: {
            status: 'done',
            updatedAt: { gte: date, lte: end },
          },
        });
        return {
          date: date.toISOString().slice(0, 10),
          completed: count,
        };
      })
    );

    res.json({ success: true, velocity: results });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/heatmap — week completion grid
const getHeatmap = async (req, res, next) => {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 364);
    start.setHours(0, 0, 0, 0);

    const tasks = await prisma.task.findMany({
      where: {
        status: 'done',
        updatedAt: { gte: start },
      },
      select: { updatedAt: true },
    });

    // Group by date string
    const map = {};
    tasks.forEach(t => {
      const key = t.updatedAt.toISOString().slice(0, 10);
      map[key] = (map[key] || 0) + 1;
    });

    res.json({ success: true, heatmap: map });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/leaderboard — member rankings this week
const getLeaderboard = async (req, res, next) => {
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        assignedTasks: {
          where: {
            status: 'done',
            updatedAt: { gte: weekStart },
          },
          select: { id: true },
        },
      },
    });

    const leaderboard = users
      .map(u => ({
        id: u.id,
        _id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        role: u.role,
        completed: u.assignedTasks.length,
      }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 10);

    res.json({ success: true, leaderboard });
  } catch (error) {
    next(error);
  }
};

module.exports = { getVelocity, getHeatmap, getLeaderboard };
