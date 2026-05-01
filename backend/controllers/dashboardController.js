const prisma = require('../config/db');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    let projectFilter = {};
    let taskFilter = {};

    if (req.user.role !== 'admin') {
      const userProjects = await prisma.project.findMany({
        where: { members: { some: { id: req.user.id } } },
        select: { id: true }
      });
      const projectIds = userProjects.map(p => p.id);
      projectFilter = { id: { in: projectIds } };
      taskFilter = { projectId: { in: projectIds } };
    }

    const [
      totalProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      totalUsers,
    ] = await Promise.all([
      prisma.project.count({ where: projectFilter }),
      prisma.task.count({ where: taskFilter }),
      prisma.task.count({ where: { ...taskFilter, status: 'done' } }),
      prisma.task.count({ where: { ...taskFilter, status: 'in-progress' } }),
      prisma.task.count({ where: { ...taskFilter, status: 'todo' } }),
      prisma.task.count({ where: { ...taskFilter, status: { not: 'done' }, dueDate: { lt: now } } }),
      req.user.role === 'admin' ? prisma.user.count() : null,
    ]);

    // Recent tasks
    const recentTasks = await prisma.task.findMany({
      where: taskFilter,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        assignedTo: { select: { name: true, email: true, avatar: true } },
        project: { select: { name: true } }
      }
    });

    // Tasks by project (for chart)
    const projectsWithTasks = await prisma.project.findMany({
      where: projectFilter,
      take: 6,
      select: {
        name: true,
        _count: { select: { tasks: true } },
        tasks: {
          where: { status: 'done' },
          select: { id: true }
        }
      }
    });

    const tasksByProject = projectsWithTasks.map(p => ({
      name: p.name,
      count: p._count.tasks,
      done: p.tasks.length
    }));

    res.json({
      success: true,
      stats: {
        totalProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        overdueTasks,
        totalUsers,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      recentTasks: recentTasks.map(t => ({
        ...t,
        _id: t.id,
        assignedTo: t.assignedTo ? { ...t.assignedTo, _id: t.assignedTo.id } : null,
        project: t.project ? { ...t.project, _id: t.project.id } : null,
      })),
      tasksByProject,
    });
  } catch (error) {
    console.error("Dashboard Controller Error:", error);
    next(error);
  }
};

module.exports = { getDashboardStats };
