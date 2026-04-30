const prisma = require('../config/db');

// GET /api/search?q=
const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, results: { tasks: [], projects: [] } });
    }

    const query = q.trim();

    let projectFilter = {};
    if (req.user.role !== 'admin') {
      const userProjects = await prisma.project.findMany({
        where: { members: { some: { id: req.user.id } } },
        select: { id: true },
      });
      const ids = userProjects.map(p => p.id);
      projectFilter = { id: { in: ids } };
    }

    const [tasks, projects] = await Promise.all([
      prisma.task.findMany({
        where: {
          title: { contains: query },
          projectId: projectFilter.id ? { in: (projectFilter.id?.in || []) } : undefined,
        },
        take: 8,
        include: {
          project: { select: { name: true, color: true } },
          assignedTo: { select: { name: true } },
        },
      }),
      prisma.project.findMany({
        where: {
          name: { contains: query },
          ...projectFilter,
        },
        take: 5,
        include: {
          members: { select: { id: true, name: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      results: {
        tasks: tasks.map(t => ({ ...t, _id: t.id })),
        projects: projects.map(p => ({ ...p, _id: p.id })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { globalSearch };
