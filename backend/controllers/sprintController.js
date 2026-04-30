const prisma = require('../config/db');

const createSprint = async (req, res, next) => {
  try {
    const { name, projectId, startDate, endDate } = req.body;
    const sprint = await prisma.sprint.create({
      data: {
        name,
        projectId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: { project: true }
    });
    res.status(201).json({ success: true, sprint });
  } catch (error) {
    next(error);
  }
};

const getSprints = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const sprints = await prisma.sprint.findMany({
      where: projectId ? { projectId } : {},
      include: { tasks: true, project: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, count: sprints.length, sprints });
  } catch (error) {
    next(error);
  }
};

module.exports = { createSprint, getSprints };
