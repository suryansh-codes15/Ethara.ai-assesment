const prisma = require('../config/db');

const getPublicStats = async (req, res, next) => {
  try {
    const [totalTasks, totalProjects, totalUsers] = await Promise.all([
      prisma.task.count(),
      prisma.project.count(),
      prisma.user.count(),
    ]);

    // Format for landing page
    res.json({
      success: true,
      stats: [
        { val: `${totalProjects}+`, label: 'Active Projects' },
        { val: `${(totalTasks / 1000).toFixed(1)}k+`, label: 'Tasks Orchestrated' },
        { val: '99.9%', label: 'Uptime Reliability' },
        { val: `${totalUsers}+`, label: 'Active Personnel' }
      ]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPublicStats };
