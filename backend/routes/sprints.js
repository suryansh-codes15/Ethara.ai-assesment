const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { protect: auth } = require("../middleware/auth");

/**
 * @route   GET /api/sprints/:projectId
 * @desc    Get all sprints for a project
 */
router.get("/:projectId", auth, async (req, res) => {
  try {
    const sprints = await prisma.sprint.findMany({
      where: { projectId: req.params.projectId },
      include: {
        tasks: {
          include: { assignedTo: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(sprints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/sprints
 * @desc    Create a new sprint
 */
router.post("/", auth, async (req, res) => {
  const { name, goal, startDate, endDate, projectId } = req.body;

  try {
    const sprint = await prisma.sprint.create({
      data: {
        name,
        goal,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        projectId
      }
    });
    res.status(201).json(sprint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PATCH /api/sprints/:id/add-tasks
 * @desc    Add tasks to a sprint
 */
router.patch("/:id/add-tasks", auth, async (req, res) => {
  const { taskIds } = req.body;

  try {
    await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { sprintId: req.params.id }
    });

    const sprint = await prisma.sprint.findUnique({
      where: { id: req.params.id },
      include: { tasks: true }
    });

    res.json(sprint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
