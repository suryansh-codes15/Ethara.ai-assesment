const express = require('express');
const router = express.Router();
const { createSprint, getSprints } = require('../controllers/sprintController');
const { protect } = require('../middleware/auth');
const prisma = require('../config/db');

/**
 * @route   GET /api/sprints
 * @desc    Get all sprints (optionally filtered by projectId)
 */
router.get('/', protect, getSprints);

/**
 * @route   POST /api/sprints
 * @desc    Create a new sprint
 */
router.post('/', protect, createSprint);

/**
 * @route   PATCH /api/sprints/:id/add-tasks
 * @desc    Add tasks to a sprint
 */
router.patch("/:id/add-tasks", protect, async (req, res) => {
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
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
