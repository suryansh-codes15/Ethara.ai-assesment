const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { protect: auth } = require("../middleware/auth");

/**
 * @route   GET /api/search
 * @desc    Global search for tasks and projects
 */
router.get("/", auth, async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.json({ tasks: [], projects: [] });
  }

  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { description: { contains: q } }
        ],
        members: { some: { id: req.user.id } }
      },
      take: 5
    });

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } }
        ],
        project: { members: { some: { id: req.user.id } } }
      },
      take: 5,
      include: { project: true }
    });

    res.json({ projects, tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
